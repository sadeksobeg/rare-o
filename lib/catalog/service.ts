import { prisma } from "@/lib/db/prisma";
import { containsCI } from "@/lib/db/search";
import type { ProductUpsertInput } from "@/lib/validation/schemas";
import {
  type CatalogSort,
  isProtectedCategorySlug,
  LAUNCH_CATEGORY_SLUGS,
} from "@/lib/catalog/constants";
import { Prisma } from "@prisma/client";

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

/** Every category (launch + admin-created), ordered for admin pickers. */
export async function listAllCategories() {
  return prisma.category.findMany({
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });
}

/** Admin categories table: all categories with product counts. */
export async function listAdminCategories() {
  return prisma.category.findMany({
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    include: { _count: { select: { products: true } } },
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

export type PublishedProductFilters = {
  categorySlug?: string;
  q?: string;
  /** Inclusive lower bound on retailPrice (currency-agnostic read filter). */
  minPrice?: number;
  /** Inclusive upper bound on retailPrice (currency-agnostic read filter). */
  maxPrice?: number;
  sort?: CatalogSort;
  /** Max rows returned (omit for all). */
  limit?: number;
  /** Only pieces marked available. */
  availableOnly?: boolean;
  /** Admin badges; a piece matches when it has ANY of the listed badges. */
  badges?: CatalogBadge[];
};

import type { CatalogBadge } from "@/lib/catalog/badges";
export type { CatalogBadge };

function publishedWhere(
  filters?: PublishedProductFilters
): Prisma.ProductWhereInput {
  const q = filters?.q?.trim();
  const hasMin = typeof filters?.minPrice === "number";
  const hasMax = typeof filters?.maxPrice === "number";
  return {
    status: "published",
    ...(filters?.availableOnly ? { availability: "available" } : {}),
    ...(filters?.badges?.length
      ? {
          OR: filters.badges.map((b) =>
            b === "new"
              ? { badgeNew: true }
              : b === "featured"
                ? { badgeFeatured: true }
                : { badgeSale: true }
          ),
        }
      : {}),
    ...(filters?.categorySlug
      ? { category: { slug: filters.categorySlug } }
      : {}),
    ...(hasMin || hasMax
      ? {
          retailPrice: {
            ...(hasMin ? { gte: filters!.minPrice } : {}),
            ...(hasMax ? { lte: filters!.maxPrice } : {}),
          },
        }
      : {}),
    ...(q
      ? {
          AND: [
            {
              OR: [
                { nameAr: containsCI(q) },
                { nameEn: containsCI(q) },
                { descriptionAr: containsCI(q) },
                { descriptionEn: containsCI(q) },
              ],
            },
          ],
        }
      : {}),
  };
}

export type CatalogFacets = {
  categoryCounts: Record<string, number>;
  price: { min: number; max: number } | null;
  availableCount: number;
  badgeCounts: Record<CatalogBadge, number>;
};

/**
 * Facet numbers for the filter sidebar. Each facet is counted with every
 * OTHER filter applied (so counts predict what a click would show).
 */
export async function getCatalogFacets(
  filters: Omit<PublishedProductFilters, "sort" | "limit">
): Promise<CatalogFacets> {
  const without = (k: "categorySlug" | "availableOnly" | "badges") => {
    const f: Omit<PublishedProductFilters, "sort" | "limit"> = { ...filters };
    delete f[k];
    return f;
  };
  const [cats, launch, priceAgg, availableCount, nNew, nFeat, nSale] =
    await Promise.all([
      prisma.product.groupBy({
        by: ["categoryId"],
        where: publishedWhere(without("categorySlug")),
        _count: { _all: true },
      }),
      prisma.category.findMany({ select: { id: true, slug: true } }),
      prisma.product.aggregate({
        where: { status: "published", retailPrice: { not: null } },
        _min: { retailPrice: true },
        _max: { retailPrice: true },
      }),
      prisma.product.count({
        where: publishedWhere({ ...without("availableOnly"), availableOnly: true }),
      }),
      prisma.product.count({
        where: publishedWhere({ ...without("badges"), badges: ["new"] }),
      }),
      prisma.product.count({
        where: publishedWhere({ ...without("badges"), badges: ["featured"] }),
      }),
      prisma.product.count({
        where: publishedWhere({ ...without("badges"), badges: ["sale"] }),
      }),
    ]);
  const slugById = new Map(launch.map((c) => [c.id, c.slug]));
  const categoryCounts: Record<string, number> = {};
  for (const row of cats) {
    const slug = slugById.get(row.categoryId);
    if (slug) categoryCounts[slug] = row._count._all;
  }
  const lo = priceAgg._min.retailPrice;
  const hi = priceAgg._max.retailPrice;
  return {
    categoryCounts,
    price: lo != null && hi != null ? { min: Math.floor(Number(lo)), max: Math.ceil(Number(hi)) } : null,
    availableCount,
    badgeCounts: { new: nNew, featured: nFeat, sale: nSale },
  };
}

function publishedOrderBy(
  sort?: CatalogSort
): Prisma.ProductOrderByWithRelationInput[] {
  if (sort === "price-asc") {
    return [{ retailPrice: "asc" }, { updatedAt: "desc" }];
  }
  if (sort === "price-desc") {
    return [{ retailPrice: "desc" }, { updatedAt: "desc" }];
  }
  return [{ updatedAt: "desc" }];
}

export async function listPublishedProducts(filters?: PublishedProductFilters) {
  return prisma.product.findMany({
    where: publishedWhere(filters),
    include: {
      category: true,
      // Primary + optional hover (second image lazy-loaded in CatalogCardHoverImage).
      images: { orderBy: { sortOrder: "asc" }, take: 2 },
    },
    orderBy: publishedOrderBy(filters?.sort),
    ...(filters?.limit ? { take: filters.limit } : {}),
  });
}

export async function countPublishedProducts(
  filters?: Omit<PublishedProductFilters, "sort" | "limit">
) {
  return prisma.product.count({ where: publishedWhere(filters) });
}

/** Same-category published products, excluding the current one (PDP related row). */
export async function listRelatedPublishedProducts(
  categoryId: string,
  excludeId: string,
  limit = 4
) {
  return prisma.product.findMany({
    where: { status: "published", categoryId, id: { not: excludeId } },
    include: {
      category: true,
      images: { orderBy: { sortOrder: "asc" }, take: 2 },
    },
    orderBy: { updatedAt: "desc" },
    take: limit,
  });
}

export async function createProduct(input: ProductUpsertInput) {
  const category = await prisma.category.findUnique({
    where: { id: input.categoryId },
  });
  if (!category) {
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
      oudSpecs:
        input.oudSpecs == null
          ? Prisma.DbNull
          : (input.oudSpecs as Prisma.InputJsonValue),
      categoryId: input.categoryId,
      retailPrice: input.retailPrice,
      compareAtPrice: input.compareAtPrice,
      currency: input.currency,
      status: input.status,
      availability: input.availability,
      wholesaleEligible: input.wholesaleEligible,
      badgeNew: input.badgeNew,
      badgeFeatured: input.badgeFeatured,
      badgeSale: input.badgeSale,
      weightKg: input.weightKg,
      shippingClass: input.shippingClass,
    },
  });
}

export async function updateProduct(id: string, input: ProductUpsertInput) {
  const category = await prisma.category.findUnique({
    where: { id: input.categoryId },
  });
  if (!category) {
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
      oudSpecs:
        input.oudSpecs == null
          ? Prisma.DbNull
          : (input.oudSpecs as Prisma.InputJsonValue),
      categoryId: input.categoryId,
      retailPrice: input.retailPrice,
      compareAtPrice: input.compareAtPrice,
      currency: input.currency,
      status: input.status,
      availability: input.availability,
      wholesaleEligible: input.wholesaleEligible,
      badgeNew: input.badgeNew,
      badgeFeatured: input.badgeFeatured,
      badgeSale: input.badgeSale,
      weightKg: input.weightKg,
      shippingClass: input.shippingClass,
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
  if (!existing) {
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

/** AD-08 — admin creates a category (slug is unique and immutable after create). */
export async function createCategory(input: {
  slug: string;
  nameAr: string;
  nameEn: string;
  sortOrder: number;
}) {
  const clash = await prisma.category.findUnique({ where: { slug: input.slug } });
  if (clash) throw new Error("SLUG_EXISTS");
  return prisma.category.create({
    data: {
      slug: input.slug,
      nameAr: input.nameAr,
      nameEn: input.nameEn,
      sortOrder: input.sortOrder,
    },
  });
}

/**
 * AD-08 — delete a category. Rejected when products reference it, and for
 * the core launch categories the storefront depends on.
 */
export async function deleteCategory(id: string) {
  const existing = await prisma.category.findUnique({
    where: { id },
    include: { _count: { select: { products: true } } },
  });
  if (!existing) throw new Error("INVALID_CATEGORY");
  if (isProtectedCategorySlug(existing.slug)) throw new Error("CATEGORY_LAUNCH");
  if (existing._count.products > 0) throw new Error("CATEGORY_HAS_PRODUCTS");
  return prisma.category.delete({ where: { id } });
}
