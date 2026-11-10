import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomBytes } from "node:crypto";
import sharp from "sharp";
import {
  BROKERAGE_ALLOWED_IMAGE_TYPES,
  BROKERAGE_MAX_BYTES,
  BROKERAGE_MAX_PHOTOS,
  type BrokerageMediaError,
} from "@/lib/brokerage/media-shared";

export {
  BROKERAGE_MAX_PHOTOS,
  BROKERAGE_MAX_BYTES,
  BROKERAGE_ALLOWED_IMAGE_TYPES,
  parsePhotoPaths,
  mergePhotoPaths,
  mediaErrorMessage,
  type BrokerageMediaError,
} from "@/lib/brokerage/media-shared";

const ALLOWED = new Set<string>(BROKERAGE_ALLOWED_IMAGE_TYPES);

function isSvgPayload(buf: Buffer, declaredType: string): boolean {
  if (declaredType === "image/svg+xml") return true;
  const head = buf.subarray(0, Math.min(buf.length, 256)).toString("utf8");
  return /^\s*<\?xml/i.test(head) || /^\s*<svg[\s>]/i.test(head);
}

function detectImageMagic(buf: Buffer): boolean {
  if (buf.length < 12) return false;
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return true;
  if (
    buf[0] === 0x89 &&
    buf[1] === 0x50 &&
    buf[2] === 0x4e &&
    buf[3] === 0x47
  ) {
    return true;
  }
  if (
    buf.toString("ascii", 0, 4) === "RIFF" &&
    buf.toString("ascii", 8, 12) === "WEBP"
  ) {
    return true;
  }
  return false;
}

/** Outside the web root — never served directly by Next's static file
 *  handler. Only app/api/media/brokerage/[requestId]/[file]/route.ts reads
 *  from here, after checking session + ownership. */
export function uploadsRoot() {
  return path.join(process.cwd(), "storage", "uploads", "brokerage");
}

/** Collect File entries from FormData under `photos`. */
export function collectPhotoFiles(formData: FormData): File[] {
  const raw = formData.getAll("photos");
  return raw.filter(
    (f): f is File =>
      typeof File !== "undefined" &&
      f instanceof File &&
      f.size > 0 &&
      f.name.length > 0
  );
}

/** Cheap pre-check before creating the DB row. */
export function preflightPhotoFiles(
  files: File[],
  alreadyCount = 0
): { ok: true } | { ok: false; error: BrokerageMediaError } {
  if (files.length === 0) return { ok: true };
  if (
    alreadyCount + files.length > BROKERAGE_MAX_PHOTOS &&
    alreadyCount >= BROKERAGE_MAX_PHOTOS
  ) {
    return { ok: false, error: "MAX" };
  }
  for (const file of files.slice(0, BROKERAGE_MAX_PHOTOS - alreadyCount)) {
    if (file.size > BROKERAGE_MAX_BYTES) return { ok: false, error: "SIZE" };
    const type = file.type || "";
    if (type && !ALLOWED.has(type) && type !== "application/octet-stream") {
      return { ok: false, error: "TYPE" };
    }
  }
  return { ok: true };
}

/**
 * Persist brokerage images under public/uploads/brokerage/{requestId}/.
 * Re-encodes to webp via sharp (strips metadata).
 */
export async function saveBrokeragePhotos(
  requestId: string,
  files: File[],
  alreadyCount = 0
): Promise<
  { ok: true; paths: string[] } | { ok: false; error: BrokerageMediaError }
> {
  if (files.length === 0) return { ok: true, paths: [] };
  if (alreadyCount >= BROKERAGE_MAX_PHOTOS) {
    return { ok: false, error: "MAX" };
  }
  const room = BROKERAGE_MAX_PHOTOS - alreadyCount;
  const batch = files.slice(0, room);

  const dir = path.join(uploadsRoot(), requestId);
  await mkdir(dir, { recursive: true });

  const paths: string[] = [];
  for (const file of batch) {
    const type = file.type || "application/octet-stream";
    if (!ALLOWED.has(type) && type !== "application/octet-stream") {
      return { ok: false, error: "TYPE" };
    }
    if (file.size > BROKERAGE_MAX_BYTES) return { ok: false, error: "SIZE" };

    let buf: Buffer;
    try {
      buf = Buffer.from(await file.arrayBuffer());
    } catch {
      return { ok: false, error: "GENERIC" };
    }

    if (isSvgPayload(buf, type)) return { ok: false, error: "TYPE" };
    if (!detectImageMagic(buf)) return { ok: false, error: "TYPE" };

    let outBuf: Buffer;
    try {
      outBuf = Buffer.from(
        await sharp(buf).rotate().webp({ quality: 85 }).toBuffer()
      );
    } catch {
      return { ok: false, error: "TYPE" };
    }

    const name = `${Date.now()}-${randomBytes(6).toString("hex")}.webp`;
    await writeFile(path.join(dir, name), outBuf);
    paths.push(`/api/media/brokerage/${requestId}/${name}`);
  }

  return { ok: true, paths };
}
