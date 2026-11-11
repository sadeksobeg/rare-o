/**
 * Private WhatsApp media storage (admin desk).
 * Outside the web root — served only via authenticated API route.
 */
import { createHash, randomBytes } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import {
  magicMatchesKind,
  resolveWhatsAppMagicKind,
} from "@/lib/whatsapp/media-magic";
import {
  WHATSAPP_MAX_MEDIA_BYTES,
  WHATSAPP_OUTBOUND_MIME,
  maxBytesForMediaKind,
  mediaKindFromMime,
  normalizeOutboundMime,
  type WhatsAppMediaKind,
} from "@/lib/whatsapp/media-shared";

export {
  WHATSAPP_MAX_MEDIA_BYTES,
  WHATSAPP_OUTBOUND_MIME,
  mediaKindFromMime,
  mediaUrl,
  type WhatsAppMediaKind,
} from "@/lib/whatsapp/media-shared";

const SAFE_FILE_RE = /^[0-9]+-[0-9a-f]{12}\.[a-z0-9]{2,8}$/;

const EXT_ALLOW = new Set([
  "jpg",
  "jpeg",
  "png",
  "webp",
  "gif",
  "mp4",
  "webm",
  "ogg",
  "opus",
  "mp3",
  "m4a",
  "aac",
  "pdf",
  "bin",
]);

export function whatsappUploadsRoot(): string {
  return path.join(process.cwd(), "storage", "uploads", "whatsapp");
}

export function isSafeWhatsAppMediaFileName(name: string): boolean {
  return SAFE_FILE_RE.test(name);
}

function extFromMime(mime: string, fallback = "bin"): string {
  const base = normalizeOutboundMime(mime);
  const mapped = WHATSAPP_OUTBOUND_MIME[base];
  if (mapped) return mapped;
  const sub = base.split("/")[1]?.replace(/[^a-z0-9]/gi, "") ?? "";
  if (sub && EXT_ALLOW.has(sub)) return sub;
  if (sub === "jpeg") return "jpg";
  return fallback;
}

export type SavedWhatsAppMedia = {
  storageKey: string;
  fileName: string;
  absolutePath: string;
  size: number;
  sha256: string;
  mime: string;
  kind: WhatsAppMediaKind;
};

/**
 * Persist bytes under storage/uploads/whatsapp/{conversationId}/.
 * storageKey is relative: `{conversationId}/{fileName}`.
 * Validates size + magic bytes (not extension alone).
 */
export async function saveWhatsAppMediaBytes(input: {
  conversationId: string;
  bytes: Buffer;
  mime: string;
  kind?: WhatsAppMediaKind;
  originalName?: string;
}): Promise<
  | { ok: true; saved: SavedWhatsAppMedia }
  | { ok: false; error: "TOO_LARGE" | "EMPTY" | "BAD_MIME" | "BAD_ID" | "BAD_MAGIC" }
> {
  const conversationId = input.conversationId.trim();
  if (
    !conversationId ||
    conversationId.includes("..") ||
    conversationId.includes("/") ||
    conversationId.includes("\\")
  ) {
    return { ok: false, error: "BAD_ID" };
  }
  if (!input.bytes.length) return { ok: false, error: "EMPTY" };

  const declaredMime = normalizeOutboundMime(input.mime) || "application/octet-stream";
  const kindFromMime = mediaKindFromMime(declaredMime);
  const resolvedKind: WhatsAppMediaKind =
    input.kind ?? kindFromMime ?? "document";

  const cap = maxBytesForMediaKind(resolvedKind);
  if (input.bytes.length > Math.min(cap, WHATSAPP_MAX_MEDIA_BYTES)) {
    return { ok: false, error: "TOO_LARGE" };
  }

  const magic = resolveWhatsAppMagicKind(
    input.bytes,
    resolvedKind,
    declaredMime
  );
  if (!magic || !magicMatchesKind(magic, resolvedKind)) {
    return { ok: false, error: "BAD_MAGIC" };
  }

  // Prefer sniffed MIME when allowlisted; otherwise keep declared if allowlisted
  const mime =
    WHATSAPP_OUTBOUND_MIME[magic.mime]
      ? magic.mime
      : WHATSAPP_OUTBOUND_MIME[declaredMime]
        ? declaredMime
        : null;
  if (!mime) return { ok: false, error: "BAD_MIME" };

  const ext = extFromMime(mime);
  if (!EXT_ALLOW.has(ext)) return { ok: false, error: "BAD_MIME" };

  const fileName = `${Date.now()}-${randomBytes(6).toString("hex")}.${ext}`;
  const dir = path.join(whatsappUploadsRoot(), conversationId);
  await mkdir(dir, { recursive: true });
  const absolutePath = path.join(dir, fileName);
  await writeFile(absolutePath, input.bytes);

  const sha256 = createHash("sha256").update(input.bytes).digest("hex");
  const storageKey = `${conversationId}/${fileName}`;

  return {
    ok: true,
    saved: {
      storageKey,
      fileName,
      absolutePath,
      size: input.bytes.length,
      sha256,
      mime,
      kind: resolvedKind,
    },
  };
}

export async function readWhatsAppMediaByKey(
  storageKey: string
): Promise<Buffer | null> {
  const key = storageKey.trim().replace(/\\/g, "/");
  const parts = key.split("/");
  if (parts.length !== 2) return null;
  const [conversationId, fileName] = parts;
  if (!conversationId || !fileName) return null;
  if (conversationId.includes("..") || !isSafeWhatsAppMediaFileName(fileName)) {
    return null;
  }
  const root = whatsappUploadsRoot();
  const absolute = path.resolve(root, conversationId, fileName);
  if (!absolute.startsWith(path.resolve(root) + path.sep)) return null;
  try {
    return await readFile(absolute);
  } catch {
    return null;
  }
}

export function parseStorageKey(
  storageKey: string
): { conversationId: string; fileName: string } | null {
  const key = storageKey.trim().replace(/\\/g, "/");
  const parts = key.split("/");
  if (parts.length !== 2) return null;
  const [conversationId, fileName] = parts;
  if (!conversationId || !fileName || !isSafeWhatsAppMediaFileName(fileName)) {
    return null;
  }
  return { conversationId, fileName };
}
