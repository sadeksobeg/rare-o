/** Real discount only when admin set compare-at above retail. */
export function resolveCompareAt(
  retailPrice: number | string | null | undefined,
  compareAtPrice: number | string | null | undefined
): { retail: number; compareAt: number | null; onSale: boolean } {
  const retail = Number(retailPrice);
  const compare =
    compareAtPrice == null || compareAtPrice === ""
      ? NaN
      : Number(compareAtPrice);
  const retailOk = Number.isFinite(retail);
  const compareOk = Number.isFinite(compare);
  const onSale = retailOk && compareOk && compare > retail;
  return {
    retail: retailOk ? retail : NaN,
    compareAt: onSale ? compare : null,
    onSale,
  };
}
