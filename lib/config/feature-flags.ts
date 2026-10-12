/**
 * Out-of-scope promo / compare-at / discount UI.
 * Code and DB remain; every screen stays hidden unless explicitly enabled.
 * Set RO_PROMO_FEATURES=1 (or true/on/yes) to show. Default: off.
 */
export function isPromoFeaturesEnabled(): boolean {
  const raw = process.env.RO_PROMO_FEATURES?.trim().toLowerCase();
  return raw === "1" || raw === "true" || raw === "on" || raw === "yes";
}
