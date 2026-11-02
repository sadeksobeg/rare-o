/**
 * Client-safe WhatsApp media constants — no Node / sharp / fs.
 */

export const WHATSAPP_MEDIA_URL_PREFIX = "/api/media/whatsapp/";

export const WHATSAPP_MAX_MEDIA_BYTES = 16 * 1024 * 1024;

/** Outbound attach allowlist (composer). */
export const WHATSAPP_OUTBOUND_MIME: Readonly<Record<string, string>> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "video/mp4": "mp4",
  "video/webm": "webm",
  "audio/ogg": "ogg",
  "audio/opus": "opus",
  "audio/mpeg": "mp3",
  "audio/mp4": "m4a",
  "audio/aac": "aac",
  "application/pdf": "pdf",
};

export type WhatsAppMediaKind =
  | "image"
  | "video"
  | "audio"
  | "document"
  | "sticker";

export function mediaKindFromMime(mime: string): WhatsAppMediaKind | null {
  const m = mime.trim().toLowerCase();
  if (m.startsWith("image/")) return m === "image/webp" ? "image" : "image";
  if (m.startsWith("video/")) return "video";
  if (m.startsWith("audio/")) return "audio";
  if (m === "application/pdf") return "document";
  return null;
}

export function mediaUrl(
  conversationId: string,
  fileName: string
): string {
  return `${WHATSAPP_MEDIA_URL_PREFIX}${encodeURIComponent(conversationId)}/${encodeURIComponent(fileName)}`;
}
