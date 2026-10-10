/**
 * Phase E reliability policy — conservative, restart-safe, no uncontrolled loops.
 */

/** Max outbound transport attempts per clientRequestId / message row. */
export const MAX_OUTBOUND_ATTEMPTS = 3;

/**
 * `sending` rows older than this (without waMessageId) are treated as interrupted
 * on worker recovery and returned to `pending` (if attempts remain).
 */
export const STALE_SENDING_MS = 2 * 60 * 1000;

/** Cap automatic Baileys reconnect attempts before requiring manual intervention. */
export const MAX_BAILEYS_RECONNECT_ATTEMPTS = 10;

export const WHATSAPP_MESSAGE_STATUSES = [
  "received",
  "pending",
  "sending",
  "sent",
  "failed",
] as const;

export type WhatsAppMessageStatus = (typeof WHATSAPP_MESSAGE_STATUSES)[number];
