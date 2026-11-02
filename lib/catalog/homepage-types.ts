/** Client-safe homepage/discovery product shapes — no Prisma / next/cache. */

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
