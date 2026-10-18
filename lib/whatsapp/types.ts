/**
 * WhatsApp transport adapter boundary.
 * Application code depends on this interface — not on Baileys types.
 *
 * Week 3 wa.me handoff remains in ./handoff-adapter.ts (fallback deep links).
 * Live messaging is implemented by BaileysWhatsAppAdapter in the worker process.
 */

export const WHATSAPP_CONNECTION_STATES = [
  "CONNECTED",
  "CONNECTING",
  "RECONNECTING",
  "DISCONNECTED",
  "AUTHENTICATION_REQUIRED",
  "ERROR",
] as const;

export type WhatsAppConnectionState =
  (typeof WHATSAPP_CONNECTION_STATES)[number];

export type WhatsAppHealth = {
  state: WhatsAppConnectionState;
  /** Safe operational message — never includes session secrets */
  detail?: string;
  lastConnectedAt?: string | null;
  updatedAt: string;
};

export type WhatsAppQrPayload = {
  /** Data URL or raw QR string for admin display only */
  qr: string;
  createdAt: string;
};

export type WhatsAppPairingCodePayload = {
  /** Pairing code for admin display only — never log */
  code: string;
  /** E.164 digits of the phone being linked (no +) */
  phone: string;
  createdAt: string;
};

export type WhatsAppInboundTextEvent = {
  waMessageId: string;
  waChatId: string;
  waRemoteJid: string;
  senderE164: string | null;
  displayName: string | null;
  text: string;
  timestamp: string;
};

/** Non-text inbound (Stage A records as unsupported; no media handling). */
export type WhatsAppInboundUnsupportedEvent = {
  waMessageId: string;
  waChatId: string;
  waRemoteJid: string;
  senderE164: string | null;
  displayName: string | null;
  timestamp: string;
  /** Safe kind hint only — e.g. image | audio | document | unknown */
  kindHint?: string;
};

export type WhatsAppSendTextInput = {
  /** WhatsApp chat JID or E.164 digits — worker normalizes */
  waChatId: string;
  text: string;
  /** Idempotency key from admin action */
  clientRequestId: string;
  adminId: string;
};

export type WhatsAppSendTextResult =
  | {
      ok: true;
      waMessageId: string;
      clientRequestId: string;
    }
  | {
      ok: false;
      clientRequestId: string;
      /** Safe error for operators — never session material */
      error: string;
      code?:
        | "OUTBOUND_DISABLED"
        | "NOT_CONNECTED"
        | "INVALID_INPUT"
        | "SEND_FAILED"
        | "DUPLICATE";
    };

export type WhatsAppAdapterEvents = {
  onHealth?: (health: WhatsAppHealth) => void | Promise<void>;
  onQr?: (payload: WhatsAppQrPayload) => void | Promise<void>;
  onPairingCode?: (payload: WhatsAppPairingCodePayload) => void | Promise<void>;
  onInboundText?: (
    event: WhatsAppInboundTextEvent
  ) => void | Promise<void>;
  onInboundUnsupported?: (
    event: WhatsAppInboundUnsupportedEvent
  ) => void | Promise<void>;
};

/**
 * Live WhatsApp transport contract used by the long-running worker.
 * Persistence / inbox UI (Phase B+) consume DB, not this socket directly.
 */
export interface WhatsAppAdapter {
  getHealth(): WhatsAppHealth;
  start(): Promise<void>;
  stop(): Promise<void>;
  /** Begin or continue QR auth; emits onQr when a QR is available */
  requestAuthentication(): Promise<void>;
  /** Request a phone pairing code (digits only, country code included, no +) */
  requestPairingCode?(phoneE164: string): Promise<void>;
  /** Controlled logout — clears in-memory socket; session wipe is explicit */
  logout(): Promise<void>;
  sendText(input: WhatsAppSendTextInput): Promise<WhatsAppSendTextResult>;
}

/** WHATSAPP_ADAPTER=fake — E2E without a real phone / Baileys socket. */
export function isFakeWhatsAppAdapter(): boolean {
  return process.env.WHATSAPP_ADAPTER?.trim().toLowerCase() === "fake";
}

export function isOutboundEnabled(): boolean {
  const raw = process.env.WHATSAPP_OUTBOUND_ENABLED?.trim().toLowerCase();
  if (raw === undefined || raw === "") return false;
  return raw === "1" || raw === "true" || raw === "yes" || raw === "on";
}
