/** Rank published offers so a trader's 3.2 interest categories surface first. */

export function parseInterestSlugs(raw: string | null | undefined): string[] {
  return (raw ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export function rankOffersByInterest<
  T extends {
    product?: { category?: { slug: string } | null } | null;
  },
>(offers: readonly T[], interestSlugs: readonly string[]): T[] {
  if (interestSlugs.length === 0) return [...offers];
  const set = new Set(interestSlugs);
  return [...offers].sort((a, b) => {
    const aHit = a.product?.category?.slug && set.has(a.product.category.slug) ? 0 : 1;
    const bHit = b.product?.category?.slug && set.has(b.product.category.slug) ? 0 : 1;
    return aHit - bHit;
  });
}
