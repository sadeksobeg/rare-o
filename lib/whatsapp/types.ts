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

/** Non-media inbound we do not fully model (or media download failed). */
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

export type WhatsAppInboundMediaKind =
  | "image"
  | "video"
  | "audio"
  | "document"
  | "sticker"
  | "location"
  | "contact";

/** Inbound media / structured non-text — bytes only for file kinds. */
export type WhatsAppInboundMediaEvent = {
  waMessageId: string;
  waChatId: string;
  waRemoteJid: string;
  senderE164: string | null;
  displayName: string | null;
  timestamp: string;
  messageType: WhatsAppInboundMediaKind;
  mime: string | null;
  fileName: string | null;
  caption: string | null;
  durationSec: number | null;
  /** Present for image/video/audio/document/sticker */
  bytes: Buffer | null;
  /** JSON body for location/contact when bytes is null */
  structuredBody: string | null;
};

export type WhatsAppSendTextInput = {
  /** WhatsApp chat JID or E.164 digits — worker normalizes */
  waChatId: string;
  text: string;
  /** Idempotency key from admin action */
  clientRequestId: string;
  adminId: string;
};

export type WhatsAppSendResult =
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

export type WhatsAppSendTextResult = WhatsAppSendResult;

export type WhatsAppSendMediaInput = {
  waChatId: string;
  clientRequestId: string;
  adminId: string;
  messageType: "image" | "video" | "audio" | "document";
  mime: string;
  fileName: string | null;
  caption: string | null;
  bytes: Buffer;
  /** Voice note (PTT) when audio */
  ptt?: boolean;
};

/** Own-device / history echo (message sent from phone or prior sync). */
export type WhatsAppOutboundEchoEvent = {
  waMessageId: string;
  waChatId: string;
  waRemoteJid: string;
  text: string;
  timestamp: string;
};

/** Seed a 1:1 chat row from history sync (may have no messages yet). */
export type WhatsAppChatSeedEvent = {
  waChatId: string;
  displayName: string | null;
  participantE164: string | null;
  lastMessagePreview: string;
  lastMessageAt: string | null;
};

/** Contact / LID↔phone enrichment for the admin roster (WhatsApp-like identity). */
export type WhatsAppContactIdentityEvent = {
  /** Chat addressing id (@lid or @s.whatsapp.net) */
  waChatId: string;
  /** Alternate id when LID maps to a phone jid */
  altWaChatId: string | null;
  participantE164: string | null;
  displayName: string | null;
};

/** Delivery/read receipt for a message we sent (fromMe), by WA ack level. */
export type WhatsAppOutboundStatusEvent = {
  waMessageId: string;
  status: "delivered" | "read";
  timestamp: string;
};

export type WhatsAppAdapterEvents = {
  onHealth?: (health: WhatsAppHealth) => void | Promise<void>;
  onQr?: (payload: WhatsAppQrPayload) => void | Promise<void>;
  onPairingCode?: (payload: WhatsAppPairingCodePayload) => void | Promise<void>;
  onInboundText?: (
    event: WhatsAppInboundTextEvent
  ) => void | Promise<void>;
  onInboundMedia?: (
    event: WhatsAppInboundMediaEvent
  ) => void | Promise<void>;
  onInboundUnsupported?: (
    event: WhatsAppInboundUnsupportedEvent
  ) => void | Promise<void>;
  onOutboundEcho?: (
    event: WhatsAppOutboundEchoEvent
  ) => void | Promise<void>;
  onChatSeed?: (event: WhatsAppChatSeedEvent) => void | Promise<void>;
  onContactIdentity?: (
    event: WhatsAppContactIdentityEvent
  ) => void | Promise<void>;
  onOutboundStatusUpdate?: (
    event: WhatsAppOutboundStatusEvent
  ) => void | Promise<void>;
};

/**
 * Live WhatsApp transport contract used by the long-running worker.
 * Persistence / inbox UI consume DB, not this socket directly.
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
  sendMedia?(input: WhatsAppSendMediaInput): Promise<WhatsAppSendResult>;
  /**
   * Resolve known E.164 phones → LID via USync and emit onContactIdentity.
   * Used after connect so @lid inbox rows get real numbers when we already know the phone.
   */
  resolvePhonesToLids?(phonesE164: string[]): Promise<number>;
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
