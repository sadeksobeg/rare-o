/**
 * Magic-byte sniff for WhatsApp desk media — do not trust client MIME / extension.
 * Pure Buffer checks; safe for tests without ffmpeg/fs side effects.
 */

import type { WhatsAppMediaKind } from "@/lib/whatsapp/media-shared";

export type DetectedWhatsAppMagic =
  | { kind: "image"; mime: "image/jpeg" | "image/png" | "image/webp" | "image/gif" }
  | { kind: "video"; mime: "video/mp4" | "video/webm" }
  | { kind: "audio"; mime: "audio/ogg" | "audio/mpeg" | "audio/webm" | "audio/mp4" }
  | { kind: "document"; mime: "application/pdf" };

/** Sniff payload; returns null when unrecognized / ambiguous. */
export function detectWhatsAppMediaMagic(buf: Buffer): DetectedWhatsAppMagic | null {
  if (buf.length < 12) return null;

  // JPEG
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) {
    return { kind: "image", mime: "image/jpeg" };
  }
  // PNG
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) {
    return { kind: "image", mime: "image/png" };
  }
  // GIF
  if (buf.toString("ascii", 0, 4) === "GIF8") {
    return { kind: "image", mime: "image/gif" };
  }
  // WEBP: RIFF....WEBP
  if (
    buf.toString("ascii", 0, 4) === "RIFF" &&
    buf.toString("ascii", 8, 12) === "WEBP"
  ) {
    return { kind: "image", mime: "image/webp" };
  }
  // PDF
  if (buf.toString("ascii", 0, 5) === "%PDF-") {
    return { kind: "document", mime: "application/pdf" };
  }
  // OGG (opus/vorbis)
  if (buf.toString("ascii", 0, 4) === "OggS") {
    return { kind: "audio", mime: "audio/ogg" };
  }
  // WebM / Matroska EBML — treat as video by default; audio/webm from MediaRecorder
  // is also EBML. Prefer declared kind via caller when both allowed.
  if (buf[0] === 0x1a && buf[1] === 0x45 && buf[2] === 0xdf && buf[3] === 0xa3) {
    return { kind: "video", mime: "video/webm" };
  }
  // MP4 / ISO BMFF: ....ftyp — video or m4a; resolveWhatsAppMagicKind disambiguates
  if (buf.toString("ascii", 4, 8) === "ftyp") {
    const brand = buf.toString("ascii", 8, 12).trim();
    if (brand.startsWith("M4A") || brand.startsWith("M4B")) {
      return { kind: "audio", mime: "audio/mp4" };
    }
    return { kind: "video", mime: "video/mp4" };
  }
  // MP3: ID3 or MPEG frame sync
  if (buf.toString("ascii", 0, 3) === "ID3") {
    return { kind: "audio", mime: "audio/mpeg" };
  }
  if (buf[0] === 0xff && (buf[1]! & 0xe0) === 0xe0) {
    return { kind: "audio", mime: "audio/mpeg" };
  }

  return null;
}

/**
 * Resolve sniffed magic against the intended WhatsApp kind.
 * EBML (webm) may be audio (voice) or video — honor declaredKind when magic is EBML/ftyp-ambiguous.
 */
export function resolveWhatsAppMagicKind(
  buf: Buffer,
  declaredKind: WhatsAppMediaKind | null,
  declaredMime?: string
): DetectedWhatsAppMagic | null {
  const sniffed = detectWhatsAppMediaMagic(buf);
  if (!sniffed) return null;

  // MediaRecorder voice: audio/webm is EBML → sniffed as video/webm
  if (
    sniffed.mime === "video/webm" &&
    (declaredKind === "audio" ||
      (declaredMime && normalizeMime(declaredMime).startsWith("audio/")))
  ) {
    return { kind: "audio", mime: "audio/webm" };
  }

  // m4a often shares ftyp with mp4
  if (
    sniffed.kind === "video" &&
    sniffed.mime === "video/mp4" &&
    (declaredKind === "audio" ||
      (declaredMime && normalizeMime(declaredMime).startsWith("audio/")))
  ) {
    return { kind: "audio", mime: "audio/mp4" };
  }

  return sniffed;
}

function normalizeMime(mime: string): string {
  return mime.trim().toLowerCase().split(";")[0]!.trim();
}

export function magicMatchesKind(
  magic: DetectedWhatsAppMagic,
  kind: WhatsAppMediaKind
): boolean {
  if (kind === "sticker") return magic.kind === "image";
  return magic.kind === kind;
}
