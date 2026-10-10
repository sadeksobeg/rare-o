import { prisma } from "@/lib/db/prisma";
import type { ProductUpsertInput } from "@/lib/validation/schemas";
import {
  isLaunchCategorySlug,
  LAUNCH_CATEGORY_SLUGS,
} from "@/lib/catalog/constants";
import type { Prisma } from "@prisma/client";

export type ProductWithRelations = Prisma.ProductGetPayload<{
  include: {
    category: true;
    images: true;
  };
}>;

export async function listLaunchCategories() {
  return prisma.category.findMany({
    where: { slug: { in: [...LAUNCH_CATEGORY_SLUGS] } },
    orderBy: { sortOrder: "asc" },
  });
}

export async function listAdminProducts() {
  return prisma.product.findMany({
    include: { category: true, images: { orderBy: { sortOrder: "asc" } } },
    orderBy: { updatedAt: "desc" },
  });
}

export async function getProductById(id: string) {
  return prisma.product.findUnique({
    where: { id },
    include: { category: true, images: { orderBy: { sortOrder: "asc" } } },
  });
}

export async function getPublishedProductBySlug(slug: string) {
  return prisma.product.findFirst({
    where: { slug, status: "published" },
    include: { category: true, images: { orderBy: { sortOrder: "asc" } } },
  });
}

export async function listPublishedProducts(filters?: {
  categorySlug?: string;
  q?: string;
}) {
  const q = filters?.q?.trim();
  return prisma.product.findMany({
    where: {
      status: "published",
      ...(filters?.categorySlug
        ? { category: { slug: filters.categorySlug } }
        : {}),
      ...(q
        ? {
            OR: [
              { nameAr: { contains: q } },
              { nameEn: { contains: q } },
              { descriptionAr: { contains: q } },
              { descriptionEn: { contains: q } },
            ],
          }
        : {}),
    },
    include: {
      category: true,
      images: { orderBy: { sortOrder: "asc" }, take: 1 },
    },
    orderBy: { updatedAt: "desc" },
  });
}

export async function createProduct(input: ProductUpsertInput) {
  const category = await prisma.category.findUnique({
    where: { id: input.categoryId },
  });
  if (!category || !isLaunchCategorySlug(category.slug)) {
    throw new Error("INVALID_CATEGORY");
  }

  return prisma.product.create({
    data: {
      slug: input.slug,
      nameAr: input.nameAr,
      nameEn: input.nameEn,
      descriptionAr: input.descriptionAr,
      descriptionEn: input.descriptionEn,
      specsTextAr: input.specsTextAr,
      specsTextEn: input.specsTextEn,
      categoryId: input.categoryId,
      retailPrice: input.retailPrice,
      currency: input.currency,
      status: input.status,
      availability: input.availability,
      wholesaleEligible: input.wholesaleEligible,
    },
  });
}

export async function updateProduct(id: string, input: ProductUpsertInput) {
  const category = await prisma.category.findUnique({
    where: { id: input.categoryId },
  });
  if (!category || !isLaunchCategorySlug(category.slug)) {
    throw new Error("INVALID_CATEGORY");
  }

  return prisma.product.update({
    where: { id },
    data: {
      slug: input.slug,
      nameAr: input.nameAr,
      nameEn: input.nameEn,
      descriptionAr: input.descriptionAr,
      descriptionEn: input.descriptionEn,
      specsTextAr: input.specsTextAr,
      specsTextEn: input.specsTextEn,
      categoryId: input.categoryId,
      retailPrice: input.retailPrice,
      currency: input.currency,
      status: input.status,
      availability: input.availability,
      wholesaleEligible: input.wholesaleEligible,
    },
  });
}

export async function updateCategoryLabels(input: {
  id: string;
  nameAr: string;
  nameEn: string;
  sortOrder: number;
}) {
  const existing = await prisma.category.findUnique({ where: { id: input.id } });
  if (!existing || !isLaunchCategorySlug(existing.slug)) {
    throw new Error("INVALID_CATEGORY");
  }
  return prisma.category.update({
    where: { id: input.id },
    data: {
      nameAr: input.nameAr,
      nameEn: input.nameEn,
      sortOrder: input.sortOrder,
    },
  });
}

/** Creation of new category slugs is intentionally not exposed in Week 2 */
export function assertNoUnrestrictedCategoryCreate(): void {
  // Extension boundary: Week 2 forbids unrestricted create-category workflows.
}
