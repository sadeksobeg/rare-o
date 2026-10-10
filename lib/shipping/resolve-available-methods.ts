/**
 * Shipping extension point — Week 2.
 * Destination-dependent methods will plug in later.
 * No pricing, no admin shipping UI, no seeded availability maps.
 */

export type ShippingMethodOption = {
  code: string;
  labelAr: string;
  labelEn: string;
};

/**
 * Returns shipping methods approved/configured for a destination.
 * Week 2: always empty — callers must allow shippingMethod = null
 * and note that shipping will be confirmed with the RARE OUD team.
 */
export function resolveAvailableMethods(
  destinationCountry: string
): ShippingMethodOption[] {
  // Week 2: no configured destination rules yet. Parameter retained for the
  // future destination-dependent lookup extension point.
  void destinationCountry;
  return [];
}
