/**
 * Safe response headers for WhatsApp media download.
 * Content-Type is derived from magic bytes (preferred) then stored MIME;
 * never serves HTML/SVG as navigable documents.
 */
import {
  detectWhatsAppMediaMagic,
  resolveWhatsAppMagicKind,
} from "@/lib/whatsapp/media-magic";
import { mediaKindFromMime, normalizeOutboundMime } from "@/lib/whatsapp/media-shared";
import { isSafeWhatsAppMediaFileName } from "@/lib/whatsapp/media";

const DANGEROUS_INLINE = new Set([
  "text/html",
  "application/xhtml+xml",
  "image/svg+xml",
  "text/xml",
  "application/xml",
  "text/javascript",
  "application/javascript",
]);

export function isSafeWhatsAppConversationId(id: string): boolean {
  if (!id || id.includes("..") || id.includes("/") || id.includes("\\") || id.includes("\0")) {
    return false;
  }
  // CUID / UUID-ish — reject encoded traversal and odd chars
  return /^[a-zA-Z0-9_-]{8,64}$/.test(id);
}

export function resolveWhatsAppServeContentType(
  bytes: Buffer,
  storedMime: string | null | undefined,
  fileName: string
): { contentType: string; disposition: string } {
  const stored = storedMime ? normalizeOutboundMime(storedMime) : "";
  const kindHint = mediaKindFromMime(stored);
  const magic = resolveWhatsAppMagicKind(bytes, kindHint, stored) ?? detectWhatsAppMediaMagic(bytes);

  let contentType =
    magic?.mime ||
    stored ||
    guessFromExt(fileName) ||
    "application/octet-stream";

  contentType = normalizeOutboundMime(contentType);

  if (DANGEROUS_INLINE.has(contentType) || contentType.startsWith("text/")) {
    contentType = "application/octet-stream";
  }

  const safeName = isSafeWhatsAppMediaFileName(fileName)
    ? fileName
    : "download.bin";

  const canInline =
    contentType.startsWith("image/") ||
    contentType.startsWith("video/") ||
    contentType.startsWith("audio/") ||
    contentType === "application/pdf";

  const disposition = canInline
    ? `inline; filename="${safeName}"`
    : `attachment; filename="${safeName}"`;

  return { contentType, disposition };
}

function guessFromExt(file: string): string | null {
  const ext = file.split(".").pop()?.toLowerCase() ?? "";
  switch (ext) {
    case "jpg":
    case "jpeg":
      return "image/jpeg";
    case "png":
      return "image/png";
    case "webp":
      return "image/webp";
    case "gif":
      return "image/gif";
    case "mp4":
      return "video/mp4";
    case "webm":
      return "video/webm";
    case "ogg":
    case "opus":
      return "audio/ogg";
    case "mp3":
      return "audio/mpeg";
    case "m4a":
      return "audio/mp4";
    case "aac":
      return "audio/aac";
    case "pdf":
      return "application/pdf";
    case "html":
    case "htm":
    case "svg":
      return "application/octet-stream";
    default:
      return null;
  }
}
