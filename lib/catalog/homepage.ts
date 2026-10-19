import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/db/prisma";
import { listLaunchCategories } from "@/lib/catalog/service";
import { listPublishedPublicOffers } from "@/lib/offers/service";
import { LAUNCH_CATEGORY_SLUGS } from "@/lib/catalog/constants";

export type HomepageProductImage = {
  path: string;
  altAr: string;
  altEn: string;
};

export type HomepageProduct = {
  id: string;
  slug: string;
  nameAr: string;
  nameEn: string;
  descriptionAr: string;
  descriptionEn: string;
  specsTextAr: string;
  specsTextEn: string;
  retailPrice: string;
  compareAtPrice: string | null;
  currency: string;
  availability: string;
  updatedAt: string;
  category: {
    id: string;
    slug: string;
    nameAr: string;
    nameEn: string;
  };
  images: HomepageProductImage[];
};

export type HomepageCategory = {
  id: string;
  slug: string;
  nameAr: string;
  nameEn: string;
  productCount: number;
};

export type HomepageOffer = {
  id: string;
  slug: string;
  titleAr: string;
  titleEn: string;
  summaryAr: string;
  summaryEn: string;
};

function mapProduct(
  p: Awaited<ReturnType<typeof fetchPublishedProducts>>[number]
): HomepageProduct {
  return {
    id: p.id,
    slug: p.slug,
    nameAr: p.nameAr,
    nameEn: p.nameEn,
    descriptionAr: p.descriptionAr,
    descriptionEn: p.descriptionEn,
    specsTextAr: p.specsTextAr,
    specsTextEn: p.specsTextEn,
    retailPrice: p.retailPrice != null ? p.retailPrice.toString() : "",
    compareAtPrice:
      p.compareAtPrice != null ? p.compareAtPrice.toString() : null,
    currency: p.currency ?? "",
    availability: p.availability,
    updatedAt: p.updatedAt.toISOString(),
    category: {
      id: p.category.id,
      slug: p.category.slug,
      nameAr: p.category.nameAr,
      nameEn: p.category.nameEn,
    },
    images: p.images.map((img) => ({
      path: img.path,
      altAr: img.altAr,
      altEn: img.altEn,
    })),
  };
}

async function fetchPublishedProducts() {
  return prisma.product.findMany({
    where: { status: "published" },
    include: {
      category: true,
      images: { orderBy: { sortOrder: "asc" }, take: 1 },
    },
    orderBy: { updatedAt: "desc" },
  });
}

async function loadHomepageDiscoveryData() {
  const [rawProducts, categories, rawOffers] = await Promise.all([
    fetchPublishedProducts(),
    listLaunchCategories(),
    listPublishedPublicOffers(),
  ]);

  const products = rawProducts.map(mapProduct);

  const categoriesWithCounts: HomepageCategory[] = categories.map((c) => ({
    id: c.id,
    slug: c.slug,
    nameAr: c.nameAr,
    nameEn: c.nameEn,
    productCount: products.filter((p) => p.category.slug === c.slug).length,
  }));

  // Prefer product with a real image for hero/featured
  const withImage = products.find((p) => p.images[0]?.path);
  const heroProduct = withImage ?? products[0] ?? null;
  const featuredInstrument =
    products.find((p) => p.id !== heroProduct?.id && p.images[0]?.path) ??
    products.find((p) => p.id !== heroProduct?.id) ??
    heroProduct;

  const available = products.filter((p) => p.availability === "available");
  const latest = products.slice(0, 8);

  const byCategory = Object.fromEntries(
    LAUNCH_CATEGORY_SLUGS.map((slug) => [
      slug,
      products.filter((p) => p.category.slug === slug),
    ])
  ) as Record<(typeof LAUNCH_CATEGORY_SLUGS)[number], HomepageProduct[]>;

  const mosaic = products.filter((p) => p.id !== featuredInstrument?.id);

  const secondaryRail =
    byCategory["accessories"].length > 0
      ? byCategory["accessories"]
      : byCategory["string-instruments"].filter(
          (p) => p.id !== featuredInstrument?.id && p.id !== heroProduct?.id
        );

  const offers: HomepageOffer[] = rawOffers.map((o) => ({
    id: o.id,
    slug: o.slug,
    titleAr: o.titleAr,
    titleEn: o.titleEn,
    summaryAr: o.summaryAr,
    summaryEn: o.summaryEn,
  }));

  return {
    products,
    categories: categoriesWithCounts,
    offers,
    heroProduct,
    featuredInstrument,
    available,
    latest,
    mosaic,
    byCategory,
    secondaryRail,
    searchIndex: products.map((p) => ({
      id: p.id,
      slug: p.slug,
      nameAr: p.nameAr,
      nameEn: p.nameEn,
      descriptionAr: p.descriptionAr,
      descriptionEn: p.descriptionEn,
      categorySlug: p.category.slug,
      categoryNameAr: p.category.nameAr,
      categoryNameEn: p.category.nameEn,
      imagePath: p.images[0]?.path ?? null,
      availability: p.availability,
      retailPrice: p.retailPrice,
      currency: p.currency,
    })),
  };
}

export const getHomepageDiscoveryData = unstable_cache(
  loadHomepageDiscoveryData,
  ["homepage-discovery-v1"],
  { revalidate: 60 }
);

export type HomepageDiscoveryData = Awaited<
  ReturnType<typeof loadHomepageDiscoveryData>
>;

export type HomepageSearchItem = HomepageDiscoveryData["searchIndex"][number];
