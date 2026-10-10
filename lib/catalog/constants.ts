export const PRODUCT_STATUSES = ["draft", "published", "archived"] as const;
export type ProductStatus = (typeof PRODUCT_STATUSES)[number];

/** Public retail availability flag — NOT inventory quantity */
export const PRODUCT_AVAILABILITIES = ["available", "unavailable"] as const;
export type ProductAvailability = (typeof PRODUCT_AVAILABILITIES)[number];

export const LAUNCH_CATEGORY_SLUGS = [
  "string-instruments",
  "accessories",
] as const;
export type LaunchCategorySlug = (typeof LAUNCH_CATEGORY_SLUGS)[number];

export function isLaunchCategorySlug(
  slug: string
): slug is LaunchCategorySlug {
  return (LAUNCH_CATEGORY_SLUGS as readonly string[]).includes(slug);
}
