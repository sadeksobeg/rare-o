import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomBytes } from "node:crypto";

import { prisma } from "@/lib/db/prisma";
import { probeImageDimensions } from "@/lib/catalog/image-dimensions";

const MAX_IMAGES = 8;
const MAX_BYTES = 8 * 1024 * 1024;
const MIN_LONG_SIDE = 1600;
const ALLOWED = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

const EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

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
  if (product._count.images >= MAX_IMAGES) {
    return { ok: false, error: "MAX" };
  }

  const type = input.file.type;
  if (!ALLOWED.has(type)) return { ok: false, error: "TYPE" };
  if (input.file.size > MAX_BYTES) return { ok: false, error: "SIZE" };

  const buf = Buffer.from(await input.file.arrayBuffer());
  const dims = probeImageDimensions(buf);
  if (!dims || Math.max(dims.width, dims.height) < MIN_LONG_SIDE) {
    return { ok: false, error: "DIM" };
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
      kind: "image",
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
