/**
 * WhatsApp admin pairing — link-command queue + ephemeral pairing display.
 *
 * The web process never holds a socket. Admin actions write `linkCommand`
 * (and optional phone) to WhatsAppConnectionHealth; the worker polls,
 * executes on its adapter, then clears the command.
 * Pairing code / QR are display-only and must never be logged.
 *
 * No broadcast / bulk messaging lives here — pairing a single account only.
 */

import type { PrismaClient } from "@prisma/client";

import { prisma as defaultPrisma } from "@/lib/db/prisma";
import {
  createFakeAdapter,
  FAKE_PAIRING_CONNECT_DELAY_MS,
} from "@/lib/whatsapp/fake-adapter";
import { toE164Digits } from "@/lib/whatsapp/jid";
import { WHATSAPP_CONNECTION_HEALTH_ID } from "@/lib/whatsapp/messaging/constants";
import { upsertConnectionHealth } from "@/lib/whatsapp/messaging/service";
import type { WhatsAppAdapter } from "@/lib/whatsapp/types";

export type DbClient = PrismaClient;

export const WHATSAPP_LINK_COMMANDS = [
  "none",
  "pair",
  "qr",
  "reconnect",
  "logout",
] as const;
export type WhatsAppLinkCommand = (typeof WHATSAPP_LINK_COMMANDS)[number];

/** How long a pairing code / QR is shown before the UI treats it as expired. */
export const PAIRING_DISPLAY_TTL_MS = 2 * 60_000;

export function isWhatsAppLinkCommand(v: string): v is WhatsAppLinkCommand {
  return (WHATSAPP_LINK_COMMANDS as readonly string[]).includes(v);
}

/** Normalize admin phone input to digits-only E.164 (no +). */
export function normalizePairingPhone(input: string): string | null {
  return toE164Digits(input.trim());
}

export type PairingDisplayInput = {
  code?: string | null;
  qr?: string | null;
  phone?: string | null;
  expiresAt?: Date | null;
};

/**
 * Generate a QR data URL via the optional `qrcode` package.
 * Returns null when the package is unavailable or encoding fails.
 */
export async function buildQrDataUrl(raw: string): Promise<string | null> {
  try {
    const mod = await import("qrcode");
    const toDataURL = mod.toDataURL ?? mod.default?.toDataURL;
    if (typeof toDataURL !== "function") return null;
    return await toDataURL(raw, { margin: 1, width: 280 });
  } catch {
    return null;
  }
}

function defaultExpiry(): Date {
  return new Date(Date.now() + PAIRING_DISPLAY_TTL_MS);
}

/**
 * Queue a link command for the worker. Pair/qr clear any stale display first.
 */
export async function setLinkCommand(
  command: WhatsAppLinkCommand,
  phone?: string | null,
  db: DbClient = defaultPrisma
): Promise<void> {
  const resetsDisplay = command === "pair" || command === "qr";
  const phoneDigits = phone ? normalizePairingPhone(phone) : null;

  // Owner Disconnect/Logout: clear lastConnectedAt immediately so ops alerts
  // treat this as intentional (soak test still alerts on unexpected drops).
  if (command === "logout") {
    const { markIntentionalDisconnect } = await import(
      "@/lib/whatsapp/messaging/ops-alerts"
    );
    await markIntentionalDisconnect("Logged out - pairing required");
    await db.whatsAppConnectionHealth.updateMany({
      where: { id: WHATSAPP_CONNECTION_HEALTH_ID },
      data: { linkCommand: "logout" },
    });
    return;
  }

  await db.whatsAppConnectionHealth.upsert({
    where: { id: WHATSAPP_CONNECTION_HEALTH_ID },
    create: {
      id: WHATSAPP_CONNECTION_HEALTH_ID,
      state: "DISCONNECTED",
      linkCommand: command,
      pairingPhone: phoneDigits,
    },
    update: {
      linkCommand: command,
      ...(resetsDisplay
        ? {
            pairingPhone: phoneDigits,
            pairingCode: null,
            qrDataUrl: null,
            pairingExpiresAt: null,
          }
        : {}),
    },
  });
}

/** Remove all ephemeral pairing material (code, QR, phone, expiry). */
export async function clearPairingDisplay(
  db: DbClient = defaultPrisma
): Promise<void> {
  await db.whatsAppConnectionHealth.updateMany({
    where: { id: WHATSAPP_CONNECTION_HEALTH_ID },
    data: {
      pairingPhone: null,
      pairingCode: null,
      qrDataUrl: null,
      pairingExpiresAt: null,
    },
  });
}

/** Store code / QR for admin display. Undefined fields are left untouched. */
export async function upsertPairingDisplay(
  input: PairingDisplayInput,
  db: DbClient = defaultPrisma
): Promise<void> {
  const data = {
    ...(input.code !== undefined ? { pairingCode: input.code } : {}),
    ...(input.qr !== undefined ? { qrDataUrl: input.qr } : {}),
    ...(input.phone !== undefined ? { pairingPhone: input.phone } : {}),
    pairingExpiresAt:
      input.expiresAt === undefined ? defaultExpiry() : input.expiresAt,
  };

  await db.whatsAppConnectionHealth.upsert({
    where: { id: WHATSAPP_CONNECTION_HEALTH_ID },
    create: {
      id: WHATSAPP_CONNECTION_HEALTH_ID,
      state: "AUTHENTICATION_REQUIRED",
      ...data,
    },
    update: data,
  });
}

export type ProcessLinkCommandResult =
  | { processed: false }
  | { processed: true; command: WhatsAppLinkCommand; ok: boolean; error?: string };

async function markLinkError(
  code: string,
  db: DbClient
): Promise<void> {
  await upsertConnectionHealth(
    {
      state: "ERROR",
      detail: `Link command failed: ${code}`.slice(0, 200),
      updatedAt: new Date().toISOString(),
    },
    db
  );
}

/**
 * Worker poll: read the queued link command, claim it (clear so it runs once),
 * execute on the adapter. Never logs pairing code / QR / phone.
 */
export async function processLinkCommands(
  adapter: WhatsAppAdapter,
  db: DbClient = defaultPrisma
): Promise<ProcessLinkCommandResult> {
  const row = await db.whatsAppConnectionHealth.findUnique({
    where: { id: WHATSAPP_CONNECTION_HEALTH_ID },
    select: { linkCommand: true, pairingPhone: true },
  });
  const raw = row?.linkCommand ?? "none";
  if (!row || raw === "none" || !isWhatsAppLinkCommand(raw)) {
    if (row && raw !== "none") {
      // Unknown command value — drop it so the poll loop never spins on it
      await db.whatsAppConnectionHealth.updateMany({
        where: { id: WHATSAPP_CONNECTION_HEALTH_ID, linkCommand: raw },
        data: { linkCommand: "none" },
      });
    }
    return { processed: false };
  }

  const command: WhatsAppLinkCommand = raw;

  // Claim: only one poller wins the none-transition
  const claimed = await db.whatsAppConnectionHealth.updateMany({
    where: { id: WHATSAPP_CONNECTION_HEALTH_ID, linkCommand: command },
    data: { linkCommand: "none" },
  });
  if (claimed.count === 0) return { processed: false };

  try {
    switch (command) {
      case "pair": {
        const phone = row.pairingPhone
          ? normalizePairingPhone(row.pairingPhone)
          : null;
        if (!phone) throw new Error("INVALID_PHONE");
        if (!adapter.requestPairingCode) {
          throw new Error("PAIRING_UNSUPPORTED");
        }
        await adapter.requestPairingCode(phone);
        break;
      }
      case "qr":
        // QR arrives via adapter onQr → upsertPairingDisplay
        await adapter.requestAuthentication();
        break;
      case "reconnect":
        await adapter.requestAuthentication();
        break;
      case "logout":
        await adapter.logout();
        await clearPairingDisplay(db);
        break;
      default:
        break;
    }
    return { processed: true, command, ok: true };
  } catch (err) {
    const code =
      err instanceof Error ? err.message.slice(0, 80) : "UNKNOWN";
    await markLinkError(code, db);
    return { processed: true, command, ok: false, error: code };
  }
}

/**
 * Fake mode (WHATSAPP_ADAPTER=fake) — called from Next server actions, no worker.
 * Health goes AUTHENTICATION_REQUIRED (with code) then CONNECTED.
 * The fake code stays in the row so E2E can read it; real mode clears on connect.
 */
export async function applyFakePairing(
  phone: string,
  wantQr = false,
  db: DbClient = defaultPrisma
): Promise<{ ok: true } | { ok: false; error: "INVALID_PHONE" }> {
  const digits = normalizePairingPhone(phone);
  if (!digits) return { ok: false, error: "INVALID_PHONE" };

  await setLinkCommand("none", null, db);
  await clearPairingDisplay(db);

  const adapter = createFakeAdapter({
    onHealth: async (health) => {
      await upsertConnectionHealth(health, db);
    },
    onPairingCode: async ({ code, phone: p }) => {
      const qr = wantQr
        ? await buildQrDataUrl(`FAKE-QR:${code}`)
        : undefined;
      await upsertPairingDisplay(
        { code, phone: p, ...(qr !== undefined ? { qr } : {}) },
        db
      );
    },
  });
  await adapter.start();
  await adapter.requestPairingCode(digits);
  // Wait for the fake connect tick so callers see CONNECTED deterministically
  await new Promise((resolve) =>
    setTimeout(resolve, FAKE_PAIRING_CONNECT_DELAY_MS + 25)
  );
  return { ok: true };
}

/** Fake reconnect: back to CONNECTED if ever linked, else not linked. */
export async function applyFakeReconnect(
  db: DbClient = defaultPrisma
): Promise<void> {
  const row = await db.whatsAppConnectionHealth.findUnique({
    where: { id: WHATSAPP_CONNECTION_HEALTH_ID },
    select: { lastConnectedAt: true },
  });
  await setLinkCommand("none", null, db);
  const now = new Date().toISOString();
  if (row?.lastConnectedAt) {
    await upsertConnectionHealth(
      {
        state: "CONNECTED",
        detail: "Fake adapter reconnected",
        lastConnectedAt: now,
        updatedAt: now,
      },
      db
    );
  } else {
    await upsertConnectionHealth(
      {
        state: "AUTHENTICATION_REQUIRED",
        detail: "Fake adapter ready; not linked",
        updatedAt: now,
      },
      db
    );
  }
}

/** Fake logout: back to not linked and wipe display + last-connected marker. */
export async function applyFakeLogout(
  db: DbClient = defaultPrisma
): Promise<void> {
  const { markIntentionalDisconnect } = await import(
    "@/lib/whatsapp/messaging/ops-alerts"
  );
  // markIntentionalDisconnect uses default prisma; for fake/E2E paths the
  // process DATABASE_URL already points at the active DB.
  if (db === defaultPrisma) {
    await markIntentionalDisconnect("Logged out - pairing required");
    return;
  }
  const { INTENTIONAL_DISCONNECT_MARKER } = await import(
    "@/lib/whatsapp/messaging/ops-alerts"
  );
  await db.whatsAppConnectionHealth.upsert({
    where: { id: WHATSAPP_CONNECTION_HEALTH_ID },
    create: {
      id: WHATSAPP_CONNECTION_HEALTH_ID,
      state: "AUTHENTICATION_REQUIRED",
      detailSafe: `${INTENTIONAL_DISCONNECT_MARKER}: Logged out - pairing required`,
      linkCommand: "none",
    },
    update: {
      state: "AUTHENTICATION_REQUIRED",
      detailSafe: `${INTENTIONAL_DISCONNECT_MARKER}: Logged out - pairing required`,
      lastConnectedAt: null,
      linkCommand: "none",
      pairingPhone: null,
      pairingCode: null,
      qrDataUrl: null,
      pairingExpiresAt: null,
    },
  });
}
