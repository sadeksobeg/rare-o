import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomBytes } from "node:crypto";

import { prisma } from "@/lib/db/prisma";
import { probeImageDimensions } from "@/lib/catalog/image-dimensions";

const MAX_MEDIA = 8;
const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
const MAX_VIDEO_BYTES = 48 * 1024 * 1024;
const MIN_LONG_SIDE = 1600;

const ALLOWED_IMAGE = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

const ALLOWED_VIDEO = new Set(["video/mp4", "video/webm"]);

const EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "video/mp4": "mp4",
  "video/webm": "webm",
};

/** Magic-byte sniff — do not trust client MIME alone. */
function detectMediaMagic(buf: Buffer): "image" | "video" | null {
  if (buf.length < 12) return null;
  // JPEG
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return "image";
  // PNG
  if (
    buf[0] === 0x89 &&
    buf[1] === 0x50 &&
    buf[2] === 0x4e &&
    buf[3] === 0x47
  ) {
    return "image";
  }
  // WEBP: RIFF....WEBP
  if (
    buf.toString("ascii", 0, 4) === "RIFF" &&
    buf.toString("ascii", 8, 12) === "WEBP"
  ) {
    return "image";
  }
  // MP4 / ISO BMFF: ....ftyp
  if (buf.toString("ascii", 4, 8) === "ftyp") return "video";
  // WebM / Matroska EBML
  if (
    buf[0] === 0x1a &&
    buf[1] === 0x45 &&
    buf[2] === 0xdf &&
    buf[3] === 0xa3
  ) {
    return "video";
  }
  return null;
}

export type ImageActionError =
  | "TYPE"
  | "SIZE"
  | "DIM"
  | "MAX"
  | "NOT_FOUND"
  | "GENERIC";

function uploadsRoot() {
  return path.join(process.cwd(), "public", "uploads");
}

export async function listProductImages(productId: string) {
  return prisma.productImage.findMany({
    where: { productId },
    orderBy: { sortOrder: "asc" },
  });
}

export async function attachProductImage(input: {
  productId: string;
  file: File;
  altAr?: string;
  altEn?: string;
}): Promise<{ ok: true } | { ok: false; error: ImageActionError }> {
  const product = await prisma.product.findUnique({
    where: { id: input.productId },
    select: { id: true, _count: { select: { images: true } } },
  });
  if (!product) return { ok: false, error: "NOT_FOUND" };
  if (product._count.images >= MAX_MEDIA) {
    return { ok: false, error: "MAX" };
  }

  const type = input.file.type;
  const isImage = ALLOWED_IMAGE.has(type);
  const isVideo = ALLOWED_VIDEO.has(type);
  if (!isImage && !isVideo) return { ok: false, error: "TYPE" };

  const maxBytes = isVideo ? MAX_VIDEO_BYTES : MAX_IMAGE_BYTES;
  if (input.file.size > maxBytes) return { ok: false, error: "SIZE" };

  const buf = Buffer.from(await input.file.arrayBuffer());

  const magicKind = detectMediaMagic(buf);
  if (!magicKind) return { ok: false, error: "TYPE" };
  if (isImage && magicKind !== "image") return { ok: false, error: "TYPE" };
  if (isVideo && magicKind !== "video") return { ok: false, error: "TYPE" };

  if (isImage) {
    const dims = probeImageDimensions(buf);
    if (!dims || Math.max(dims.width, dims.height) < MIN_LONG_SIDE) {
      return { ok: false, error: "DIM" };
    }
  }

  const ext = EXT[type] ?? "bin";
  const name = `${Date.now()}-${randomBytes(6).toString("hex")}.${ext}`;
  const dir = path.join(uploadsRoot(), input.productId);
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, name), buf);

  const publicPath = `/uploads/${input.productId}/${name}`;
  const maxSort = await prisma.productImage.aggregate({
    where: { productId: input.productId },
    _max: { sortOrder: true },
  });

  await prisma.productImage.create({
    data: {
      productId: input.productId,
      path: publicPath,
      altAr: input.altAr?.trim() || "",
      altEn: input.altEn?.trim() || "",
      sortOrder: (maxSort._max.sortOrder ?? -1) + 1,
      kind: isVideo ? "video" : "image",
    },
  });

  return { ok: true };
}

export async function removeProductImage(
  imageId: string
): Promise<{ ok: true } | { ok: false; error: ImageActionError }> {
  const image = await prisma.productImage.findUnique({ where: { id: imageId } });
  if (!image) return { ok: false, error: "NOT_FOUND" };

  await prisma.productImage.delete({ where: { id: imageId } });

  if (image.path.startsWith("/uploads/")) {
    const abs = path.join(process.cwd(), "public", image.path.replace(/^\//, ""));
    try {
      await unlink(abs);
    } catch {
      // file may already be gone
    }
  }

  return { ok: true };
}

export async function reorderProductImage(
  imageId: string,
  direction: "earlier" | "later"
): Promise<{ ok: true } | { ok: false; error: ImageActionError }> {
  const image = await prisma.productImage.findUnique({ where: { id: imageId } });
  if (!image) return { ok: false, error: "NOT_FOUND" };

  const siblings = await prisma.productImage.findMany({
    where: { productId: image.productId },
    orderBy: { sortOrder: "asc" },
  });
  const idx = siblings.findIndex((s) => s.id === imageId);
  if (idx < 0) return { ok: false, error: "NOT_FOUND" };

  const swapWith =
    direction === "earlier" ? siblings[idx - 1] : siblings[idx + 1];
  if (!swapWith) return { ok: true };

  await prisma.$transaction([
    prisma.productImage.update({
      where: { id: image.id },
      data: { sortOrder: swapWith.sortOrder },
    }),
    prisma.productImage.update({
      where: { id: swapWith.id },
      data: { sortOrder: image.sortOrder },
    }),
  ]);

  return { ok: true };
}

export async function updateProductImageAlts(input: {
  imageId: string;
  altAr: string;
  altEn: string;
}): Promise<{ ok: true } | { ok: false; error: ImageActionError }> {
  try {
    await prisma.productImage.update({
      where: { id: input.imageId },
      data: {
        altAr: input.altAr.trim(),
        altEn: input.altEn.trim(),
      },
    });
    return { ok: true };
  } catch {
    return { ok: false, error: "NOT_FOUND" };
  }
}
