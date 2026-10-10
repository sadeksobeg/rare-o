/**
 * WhatsApp worker process — owns the Baileys socket lifecycle.
 *
 * Run: npm run worker:whatsapp
 *
 * Environment:
 *   WHATSAPP_AUTH_DIR          Session directory (default: ./.wa-auth)
 *   WHATSAPP_CONNECT_ON_START  "true" to open socket immediately (default: false)
 *   WHATSAPP_OUTBOUND_ENABLED  Kill switch for outbound sends (default: false)
 *
 * Security:
 * - Do not print QR payloads or session file contents.
 * - Do not authenticate a production WhatsApp account until VPS/session
 *   storage is ready. Local default keeps the socket closed until connect.
 *
 * Reliability (Phase E):
 * - On start: recover interrupted `sending` outbound rows.
 * - Drain pending only when CONNECTED + kill switch on.
 * - Kill switch re-checked at dispatch and adapter send boundaries.
 */

import path from "node:path";

import { BaileysWhatsAppAdapter } from "@/lib/whatsapp/baileys-adapter";
import {
  dispatchPendingOutbound,
  persistInboundText,
  persistUnsupportedInbound,
  recoverInterruptedOutbound,
  upsertConnectionHealth,
} from "@/lib/whatsapp/messaging/service";
import {
  createSessionStoreConfig,
  ensureAuthDir,
  hasAuthStateFiles,
  resolveWhatsAppAuthDir,
} from "@/lib/whatsapp/session-store";
import { isOutboundEnabled } from "@/lib/whatsapp/types";

const OUTBOUND_POLL_MS = 5_000;

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
  const session = createSessionStoreConfig();
  ensureAuthDir(session.authDir);

  const authDirDisplay =
    path.relative(process.cwd(), session.authDir) || session.authDir;

  console.log("[whatsapp-worker] starting");
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

  const adapter = new BaileysWhatsAppAdapter({
    session,
    connectOnStart: connect,
    events: {
      onHealth: async (health) => {
        console.log(
          `[whatsapp-worker] health state=${health.state}` +
            (health.detail ? ` detail=${health.detail}` : "")
        );
        try {
          await upsertConnectionHealth(health);
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err);
          console.error(
            `[whatsapp-worker] health persist failed: ${message.slice(0, 200)}`
          );
        }
      },
      onQr: () => {
        console.log(
          "[whatsapp-worker] QR event received (payload not printed - use admin channel when wired)"
        );
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
    },
  });

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

  outboundTimer = setInterval(() => {
    void drainOutbound();
  }, OUTBOUND_POLL_MS);

  const shutdown = async (signal: string) => {
    console.log(`[whatsapp-worker] ${signal} - stopping`);
    if (outboundTimer) clearInterval(outboundTimer);
    await adapter.stop();
    process.exit(0);
  };

  process.on("SIGINT", () => void shutdown("SIGINT"));
  process.on("SIGTERM", () => void shutdown("SIGTERM"));

  await adapter.start();
  void drainOutbound();

  if (!connect) {
    console.log(
      "[whatsapp-worker] idle (socket not opened). Pass --connect or set WHATSAPP_CONNECT_ON_START=true when ready."
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
