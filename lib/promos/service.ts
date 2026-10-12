import { prisma } from "@/lib/db/prisma";
import type { PromoBandUpsertInput } from "@/lib/validation/schemas";

export async function listPromoBandsForAdmin() {
  return prisma.promoBand.findMany({
    orderBy: [{ sortOrder: "asc" }, { updatedAt: "desc" }],
  });
}

export async function getPromoBandById(id: string) {
  return prisma.promoBand.findUnique({ where: { id } });
}

/** Published bands currently inside their optional date window. */
export async function listActivePromoBands() {
  const now = new Date();
  const rows = await prisma.promoBand.findMany({
    where: { status: "published" },
    orderBy: [{ sortOrder: "asc" }, { updatedAt: "desc" }],
  });
  return rows.filter((b) => {
    if (b.startsAt && b.startsAt > now) return false;
    if (b.endsAt && b.endsAt < now) return false;
    return true;
  });
}

export async function createPromoBand(input: PromoBandUpsertInput) {
  return prisma.promoBand.create({
    data: {
      slug: input.slug,
      titleAr: input.titleAr,
      titleEn: input.titleEn,
      bodyAr: input.bodyAr,
      bodyEn: input.bodyEn,
      ctaLabelAr: input.ctaLabelAr,
      ctaLabelEn: input.ctaLabelEn,
      href: input.href,
      tone: input.tone,
      imagePath: input.imagePath,
      sortOrder: input.sortOrder,
      status: input.status,
      startsAt: input.startsAt,
      endsAt: input.endsAt,
    },
  });
}

export async function updatePromoBand(id: string, input: PromoBandUpsertInput) {
  return prisma.promoBand.update({
    where: { id },
    data: {
      slug: input.slug,
      titleAr: input.titleAr,
      titleEn: input.titleEn,
      bodyAr: input.bodyAr,
      bodyEn: input.bodyEn,
      ctaLabelAr: input.ctaLabelAr,
      ctaLabelEn: input.ctaLabelEn,
      href: input.href,
      tone: input.tone,
      imagePath: input.imagePath,
      sortOrder: input.sortOrder,
      status: input.status,
      startsAt: input.startsAt,
      endsAt: input.endsAt,
    },
  });
}

export async function deletePromoBand(id: string) {
  return prisma.promoBand.delete({ where: { id } });
}
