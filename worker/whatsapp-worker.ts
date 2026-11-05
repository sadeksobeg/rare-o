/**
 * WhatsApp worker process — owns the Baileys socket lifecycle.
 *
 * Run: npm run worker:whatsapp
 *
 * Environment:
 *   WHATSAPP_AUTH_DIR          Session directory (default: ./.wa-auth)
 *   WHATSAPP_CONNECT_ON_START  "true" to open socket immediately (default: false)
 *   WHATSAPP_OUTBOUND_ENABLED  Kill switch for outbound sends (default: false)
 *   WHATSAPP_ADAPTER           "baileys" (default) | "fake" (E2E — no phone, no socket)
 *
 * Security:
 * - Do not print QR payloads, pairing codes, phone numbers or session file contents.
 * - Do not authenticate a production WhatsApp account until VPS/session
 *   storage is ready. Local default keeps the socket closed until connect.
 *
 * Reliability (Phase E):
 * - On start: recover interrupted `sending` outbound rows.
 * - Drain pending only when CONNECTED + kill switch on.
 * - Kill switch re-checked at dispatch and adapter send boundaries.
 *
 * Admin pairing:
 * - Polls linkCommand (pair | qr | reconnect | logout) every 2s and executes it.
 * - Pairing code / QR are stored for admin display only (never logged).
 * - Supervises ERROR state: retries connect periodically when a session exists.
 * - No broadcast / mass messaging.
 */

import path from "node:path";

import { prisma } from "@/lib/db/prisma";
import { BaileysWhatsAppAdapter } from "@/lib/whatsapp/baileys-adapter";
import { createFakeAdapter } from "@/lib/whatsapp/fake-adapter";
import { WHATSAPP_CONNECTION_HEALTH_ID } from "@/lib/whatsapp/messaging/constants";
import {
  buildQrDataUrl,
  clearPairingDisplay,
  processLinkCommands,
  upsertPairingDisplay,
} from "@/lib/whatsapp/messaging/pairing";
import {
  dispatchPendingOutbound,
  persistInboundMedia,
  persistInboundText,
  applyContactIdentity,
  persistOutboundEcho,
  persistUnsupportedInbound,
  recordOutboundStatusUpdate,
  recoverInterruptedOutbound,
  seedConversationFromChat,
  upsertConnectionHealth,
} from "@/lib/whatsapp/messaging/service";
import {
  createSessionStoreConfig,
  ensureAuthDir,
  hasAuthStateFiles,
  resolveWhatsAppAuthDir,
} from "@/lib/whatsapp/session-store";
import {
  hydrateAuthDirFromEncrypted,
  registerAuthDirSealOnExit,
} from "@/lib/security/wa-auth-crypto";
import {
  isFakeWhatsAppAdapter,
  isOutboundEnabled,
  type WhatsAppAdapter,
  type WhatsAppAdapterEvents,
} from "@/lib/whatsapp/types";

const OUTBOUND_POLL_MS = 5_000;
const LINK_COMMAND_POLL_MS = 2_000;
/** Retry connect while ERROR and a session exists (Baileys exhausted its own backoff). */
const SUPERVISE_RETRY_MS = 60_000;

function envFlag(name: string, defaultValue = false): boolean {
  const raw = process.env[name]?.trim().toLowerCase();
  if (raw === undefined || raw === "") return defaultValue;
  return raw === "1" || raw === "true" || raw === "yes" || raw === "on";
}

function parseArgs(argv: string[]): { connect: boolean } {
  return {
    connect:
      argv.includes("--connect") || envFlag("WHATSAPP_CONNECT_ON_START", false),
  };
}

async function main(): Promise<void> {
  const { connect } = parseArgs(process.argv.slice(2));
  const fake = isFakeWhatsAppAdapter();
  const session = createSessionStoreConfig();
  ensureAuthDir(session.authDir);
  if (!fake) {
    hydrateAuthDirFromEncrypted(session.authDir);
    registerAuthDirSealOnExit(session.authDir);
  }

  const authDirDisplay =
    path.relative(process.cwd(), session.authDir) || session.authDir;

  console.log("[whatsapp-worker] starting");
  console.log(`[whatsapp-worker] adapter=${fake ? "fake" : "baileys"}`);
  console.log(`[whatsapp-worker] authDir=${authDirDisplay}`);
  console.log(
    `[whatsapp-worker] authFilesPresent=${hasAuthStateFiles(session.authDir)}`
  );
  console.log(
    `[whatsapp-worker] connectOnStart=${connect} outboundEnabled=${isOutboundEnabled()}`
  );
  console.log(
    `[whatsapp-worker] resolvedAuthDir=${resolveWhatsAppAuthDir() === session.authDir ? "ok" : "mismatch"}`
  );

  try {
    const recovered = await recoverInterruptedOutbound();
    console.log(
      `[whatsapp-worker] outbound recovery pending=${recovered.recoveredToPending} failed=${recovered.markedFailed} sent=${recovered.markedSent}`
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(
      `[whatsapp-worker] outbound recovery failed: ${message.slice(0, 200)}`
    );
  }

  let outboundTimer: ReturnType<typeof setInterval> | null = null;
  let linkTimer: ReturnType<typeof setInterval> | null = null;
  let lastSupervisedAt = 0;
  let pollingLinkCommands = false;
  const adapterRef: { current: WhatsAppAdapter | null } = { current: null };

  const events: WhatsAppAdapterEvents = {
    onHealth: async (health) => {
      console.log(
        `[whatsapp-worker] health state=${health.state}` +
          (health.detail ? ` detail=${health.detail}` : "")
      );
      try {
        await upsertConnectionHealth(health);
        // Linked — pairing material is no longer needed
        if (health.state === "CONNECTED") {
          await clearPairingDisplay();
          // Defer so socket is fully ready, then map known phones → @lid chats
          setTimeout(() => {
            void (async () => {
              try {
                const current = adapterRef.current;
                const resolve = current?.resolvePhonesToLids;
                if (!current || !resolve) return;
                const [customers, traders, convos] = await Promise.all([
                  prisma.customer.findMany({
                    where: { phone: { not: "" } },
                    select: { phone: true },
                    take: 100,
                  }),
                  prisma.traderAccount.findMany({
                    where: { phone: { not: "" } },
                    select: { phone: true },
                    take: 100,
                  }),
                  prisma.whatsAppConversation.findMany({
                    where: { participantE164: { not: null } },
                    select: { participantE164: true },
                    take: 100,
                  }),
                ]);
                const phones = [
                  ...customers.map((c: { phone: string }) => c.phone),
                  ...traders.map((t: { phone: string }) => t.phone),
                  ...convos
                    .map((c: { participantE164: string | null }) => c.participantE164)
                    .filter((p): p is string => !!p),
                ];
                const n = await resolve.call(current, phones);
                if (n > 0) {
                  console.log(
                    `[whatsapp-worker] lid phone mappings linked=${n}`
                  );
                }
              } catch (err) {
                const message = err instanceof Error ? err.message : String(err);
                console.error(
                  `[whatsapp-worker] lid resolve failed: ${message.slice(0, 160)}`
                );
              }
            })();
          }, 4_000);
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.error(
          `[whatsapp-worker] health persist failed: ${message.slice(0, 200)}`
        );
      }
    },
    onQr: async ({ qr }) => {
      // NEVER log QR contents — store for the authorized admin channel only
      console.log("[whatsapp-worker] QR event received (stored for admin display)");
      try {
        const dataUrl = await buildQrDataUrl(qr);
        if (dataUrl) {
          await upsertPairingDisplay({ qr: dataUrl });
        }
      } catch {
        console.error("[whatsapp-worker] QR display persist failed");
      }
    },
    onPairingCode: async ({ code, phone }) => {
      // NEVER log the code or phone
      console.log(
        "[whatsapp-worker] pairing code issued (stored for admin display)"
      );
      try {
        await upsertPairingDisplay({ code, phone });
      } catch {
        console.error("[whatsapp-worker] pairing display persist failed");
      }
    },
    onInboundText: async (event) => {
      try {
        const result = await persistInboundText(event);
        if (!result.ok) {
          console.error(
            `[whatsapp-worker] inbound persist failed: ${result.error}`
          );
          return;
        }
        console.log(
          `[whatsapp-worker] inbound text waMessageId=${event.waMessageId} created=${result.created} chars=${event.text.length}`
        );
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.error(
          `[whatsapp-worker] inbound handler error: ${message.slice(0, 200)}`
        );
      }
    },
    onInboundMedia: async (event) => {
      try {
        const result = await persistInboundMedia(event);
        if (!result.ok) {
          console.error(
            `[whatsapp-worker] media persist failed: ${result.error}`
          );
          return;
        }
        console.log(
          `[whatsapp-worker] inbound media waMessageId=${event.waMessageId} type=${event.messageType} created=${result.created}`
        );
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.error(
          `[whatsapp-worker] media handler error: ${message.slice(0, 200)}`
        );
      }
    },
    onOutboundEcho: async (event) => {
      try {
        const result = await persistOutboundEcho(event);
        if (!result.ok) {
          if (result.reason !== "INVALID_INPUT") {
            console.error(
              `[whatsapp-worker] outbound echo failed: ${result.error}`
            );
          }
          return;
        }
        if (result.created) {
          console.log(
            `[whatsapp-worker] outbound echo waMessageId=${event.waMessageId}`
          );
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.error(
          `[whatsapp-worker] outbound echo error: ${message.slice(0, 200)}`
        );
      }
    },
    onChatSeed: async (event) => {
      try {
        await seedConversationFromChat(event);
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.error(
          `[whatsapp-worker] chat seed error: ${message.slice(0, 200)}`
        );
      }
    },
    onContactIdentity: async (event) => {
      try {
        const { updated } = await applyContactIdentity(event);
        if (updated > 0) {
          console.log(
            `[whatsapp-worker] contact identity updated=${updated} chat=${event.waChatId.includes("@lid") ? "lid" : "pn"}`
          );
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.error(
          `[whatsapp-worker] contact identity error: ${message.slice(0, 200)}`
        );
      }
    },
    onOutboundStatusUpdate: async (event) => {
      try {
        const result = await recordOutboundStatusUpdate(
          event.waMessageId,
          event.status
        );
        if (result.applied) {
          console.log(
            `[whatsapp-worker] outbound status waMessageId=${event.waMessageId} status=${event.status}`
          );
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.error(
          `[whatsapp-worker] outbound status error: ${message.slice(0, 200)}`
        );
      }
    },
    onInboundUnsupported: async (event) => {
      try {
        const result = await persistUnsupportedInbound(event);
        if (!result.ok) {
          console.error(
            `[whatsapp-worker] unsupported persist failed: ${result.error}`
          );
          return;
        }
        console.log(
          `[whatsapp-worker] inbound unsupported waMessageId=${event.waMessageId} kind=${event.kindHint ?? "unknown"} created=${result.created}`
        );
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.error(
          `[whatsapp-worker] unsupported handler error: ${message.slice(0, 200)}`
        );
      }
    },
  };

  let fakeConnectOnStart = false;
  if (fake) {
    // Fake mode: server actions drive DB state directly — resume it, don't reset it.
    const row = await prisma.whatsAppConnectionHealth.findUnique({
      where: { id: WHATSAPP_CONNECTION_HEALTH_ID },
      select: { state: true },
    });
    fakeConnectOnStart = connect || row?.state === "CONNECTED";
  }

  const adapter: WhatsAppAdapter = fake
    ? createFakeAdapter(events, { connectOnStart: fakeConnectOnStart })
    : new BaileysWhatsAppAdapter({
        session,
        connectOnStart: connect,
        events,
      });
  adapterRef.current = adapter;

  const drainOutbound = async () => {
    if (!isOutboundEnabled()) return;
    if (adapter.getHealth().state !== "CONNECTED") return;
    try {
      const { processed, results } = await dispatchPendingOutbound(adapter);
      if (processed > 0) {
        const sent = results.filter((r) => r.ok).length;
        const failed = results.filter((r) => !r.ok && r.status === "failed").length;
        const deferred = results.length - sent - failed;
        console.log(
          `[whatsapp-worker] outbound drain processed=${processed} sent=${sent} failed=${failed} deferred=${deferred}`
        );
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(
        `[whatsapp-worker] outbound drain error: ${message.slice(0, 200)}`
      );
    }
  };

  /** Poll admin link commands + supervise stuck ERROR state. */
  const pollLinkCommands = async () => {
    if (pollingLinkCommands) return;
    pollingLinkCommands = true;
    try {
      const result = await processLinkCommands(adapter);
      if (result.processed) {
        console.log(
          `[whatsapp-worker] link command=${result.command} ok=${result.ok}` +
            (result.ok ? "" : ` error=${result.error ?? "unknown"}`)
        );
        return;
      }

      // Supervisor: Baileys gave up reconnecting but a session still exists
      if (
        !fake &&
        connect &&
        adapter.getHealth().state === "ERROR" &&
        hasAuthStateFiles(session.authDir) &&
        Date.now() - lastSupervisedAt >= SUPERVISE_RETRY_MS
      ) {
        lastSupervisedAt = Date.now();
        console.log("[whatsapp-worker] supervisor retrying connect");
        await adapter.requestAuthentication();
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(
        `[whatsapp-worker] link poll error: ${message.slice(0, 200)}`
      );
    } finally {
      pollingLinkCommands = false;
    }
  };

  outboundTimer = setInterval(() => {
    void drainOutbound();
  }, OUTBOUND_POLL_MS);

  linkTimer = setInterval(() => {
    void pollLinkCommands();
  }, LINK_COMMAND_POLL_MS);

  const shutdown = async (signal: string) => {
    console.log(`[whatsapp-worker] ${signal} - stopping`);
    if (outboundTimer) clearInterval(outboundTimer);
    if (linkTimer) clearInterval(linkTimer);
    await adapter.stop();
    process.exit(0);
  };

  process.on("SIGINT", () => void shutdown("SIGINT"));
  process.on("SIGTERM", () => void shutdown("SIGTERM"));

  await adapter.start();
  void drainOutbound();

  if (!connect && !fake) {
    console.log(
      "[whatsapp-worker] idle (socket not opened). Pass --connect or set WHATSAPP_CONNECT_ON_START=true when ready, or use admin Link account."
    );
  }

  await new Promise<void>(() => {
    /* intentional hang — signals call shutdown */
  });
}

main().catch((err) => {
  const message = err instanceof Error ? err.message : String(err);
  console.error(`[whatsapp-worker] fatal: ${message}`);
  process.exit(1);
});
