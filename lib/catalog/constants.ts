export const PRODUCT_STATUSES = ["draft", "published", "archived"] as const;
export type ProductStatus = (typeof PRODUCT_STATUSES)[number];

/** Public retail availability flag — NOT inventory quantity */
export const PRODUCT_AVAILABILITIES = ["available", "unavailable"] as const;
export type ProductAvailability = (typeof PRODUCT_AVAILABILITIES)[number];

/** Storefront browse tiers for oud instruments. */
export const OUD_TIER_SLUGS = [
  "oud-economy",
  "oud-mid",
  "oud-professional",
  "oud-vip",
] as const;
export type OudTierSlug = (typeof OUD_TIER_SLUGS)[number];

export const LAUNCH_CATEGORY_SLUGS = [
  ...OUD_TIER_SLUGS,
  "accessories",
] as const;
export type LaunchCategorySlug = (typeof LAUNCH_CATEGORY_SLUGS)[number];

/** Legacy non-oud instruments; hidden from storefront chips, not deletable. */
export const LEGACY_STRING_CATEGORY_SLUG = "string-instruments";

export const PROTECTED_CATEGORY_SLUGS = [
  ...LAUNCH_CATEGORY_SLUGS,
  LEGACY_STRING_CATEGORY_SLUG,
] as const;

export function isOudTierSlug(slug: string): slug is OudTierSlug {
  return (OUD_TIER_SLUGS as readonly string[]).includes(slug);
}

export function isLaunchCategorySlug(
  slug: string
): slug is LaunchCategorySlug {
  return (LAUNCH_CATEGORY_SLUGS as readonly string[]).includes(slug);
}

export function isProtectedCategorySlug(slug: string): boolean {
  return (PROTECTED_CATEGORY_SLUGS as readonly string[]).includes(slug);
}

/** Storefront catalog sort keys (URL `sort` param). */
export const CATALOG_SORTS = ["new", "price-asc", "price-desc"] as const;
export type CatalogSort = (typeof CATALOG_SORTS)[number];

export function isCatalogSort(value: string | undefined): value is CatalogSort {
  return !!value && (CATALOG_SORTS as readonly string[]).includes(value);
}

export const CATALOG_PAGE_SIZE = 12;
export const CATALOG_MAX_LIMIT = 96;
