/** Client-safe badge facet type + URL parsing (no Prisma). */
export type CatalogBadge = "new" | "featured" | "sale";
export const CATALOG_BADGE_KEYS: readonly CatalogBadge[] = ["new", "featured", "sale"];

export function parseBadges(raw: string | undefined): CatalogBadge[] {
  if (!raw) return [];
  const out = new Set<CatalogBadge>();
  for (const part of raw.split(",")) {
    const p = part.trim() as CatalogBadge;
    if ((CATALOG_BADGE_KEYS as readonly string[]).includes(p)) out.add(p);
  }
  return [...out];
}
