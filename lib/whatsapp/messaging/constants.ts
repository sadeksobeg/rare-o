/**
 * WhatsApp messaging domain constants (human admin desk).
 */

export const WHATSAPP_MESSAGE_DIRECTIONS = ["inbound", "outbound"] as const;
export type WhatsAppMessageDirection =
  (typeof WHATSAPP_MESSAGE_DIRECTIONS)[number];

export const WHATSAPP_MESSAGE_TYPES = [
  "text",
  "image",
  "video",
  "audio",
  "document",
  "sticker",
  "location",
  "contact",
  "unsupported",
] as const;
export type WhatsAppMessageType = (typeof WHATSAPP_MESSAGE_TYPES)[number];

export const WHATSAPP_MEDIA_MESSAGE_TYPES = [
  "image",
  "video",
  "audio",
  "document",
  "sticker",
] as const;
export type WhatsAppMediaMessageType =
  (typeof WHATSAPP_MEDIA_MESSAGE_TYPES)[number];

export function isWhatsAppMediaMessageType(
  value: string
): value is WhatsAppMediaMessageType {
  return (WHATSAPP_MEDIA_MESSAGE_TYPES as readonly string[]).includes(value);
}

export {
  MAX_OUTBOUND_ATTEMPTS,
  STALE_SENDING_MS,
  WHATSAPP_MESSAGE_STATUSES,
  type WhatsAppMessageStatus,
} from "@/lib/whatsapp/messaging/reliability";

export const WHATSAPP_CONNECTION_HEALTH_ID = "default";

export const MAX_OUTBOUND_TEXT_LENGTH = 4096;
export const MAX_MESSAGE_PREVIEW_LENGTH = 160;
