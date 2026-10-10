/**
 * WhatsApp messaging domain constants (Stage A text-only).
 * Communication layer — not Retail / Deal / Wholesale.
 */

export const WHATSAPP_MESSAGE_DIRECTIONS = ["inbound", "outbound"] as const;
export type WhatsAppMessageDirection =
  (typeof WHATSAPP_MESSAGE_DIRECTIONS)[number];

export const WHATSAPP_MESSAGE_TYPES = ["text", "unsupported"] as const;
export type WhatsAppMessageType = (typeof WHATSAPP_MESSAGE_TYPES)[number];

export {
  MAX_OUTBOUND_ATTEMPTS,
  STALE_SENDING_MS,
  WHATSAPP_MESSAGE_STATUSES,
  type WhatsAppMessageStatus,
} from "@/lib/whatsapp/messaging/reliability";

export const WHATSAPP_CONNECTION_HEALTH_ID = "default";

export const MAX_OUTBOUND_TEXT_LENGTH = 4096;
export const MAX_MESSAGE_PREVIEW_LENGTH = 160;
