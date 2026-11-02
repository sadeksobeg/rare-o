/**
 * Client-safe search index helpers — no Prisma / next/cache.
 * Keep this file free of Node-only imports so discovery UI can import it.
 */

export type HomepageSearchProduct = {
  id: string;
  slug: string;
  nameAr: string;
  nameEn: string;
  descriptionAr: string;
  descriptionEn: string;
  retailPrice: string;
  currency: string;
  availability: string;
  category: {
    slug: string;
    nameAr: string;
    nameEn: string;
  };
  images: { path: string }[];
};

export type HomepageSearchItem = {
  id: string;
  slug: string;
  nameAr: string;
  nameEn: string;
  descriptionAr: string;
  descriptionEn: string;
  categorySlug: string;
  categoryNameAr: string;
  categoryNameEn: string;
  imagePath: string | null;
  availability: string;
  retailPrice: string;
  currency: string;
};

export function toSearchIndex(
  products: HomepageSearchProduct[]
): HomepageSearchItem[] {
  return products.map((p) => ({
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
  }));
}
