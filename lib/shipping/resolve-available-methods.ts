/**
 * Shipping extension point — now backed by lib/shipping/rates.ts.
 *
 * `destinationCode` is either an international country code (see
 * INTERNATIONAL_ZONES) or a Syria governorate code (see
 * SYRIA_GOVERNORATES) — resolved by checking the governorate list first.
 */
import {
  calculateOudShipmentWeightKg,
  findZoneByCountryCode,
  listDomesticCarriersFor,
  quoteDomesticShipping,
  quoteInternationalShipping,
  SYRIA_GOVERNORATES,
  type RateCurrency,
  type ShippingMode,
} from "@/lib/shipping/rates";

export { calculateOudShipmentWeightKg };

export type ShippingMethodOption = {
  code: string;
  labelAr: string;
  labelEn: string;
  amount: number;
  currency: RateCurrency;
  alternate: { amount: number; currency: RateCurrency } | null;
};

const SYRIA_GOVERNORATE_CODES = new Set(SYRIA_GOVERNORATES.map((g) => g.code));

function modeLabelAr(mode: ShippingMode): string {
  return mode === "land" ? "بري" : "جوي";
}
function modeLabelEn(mode: ShippingMode): string {
  return mode === "land" ? "Land" : "Air";
}

/**
 * Returns every priced shipping option for a destination + shipment weight.
 * Empty array means "unmapped destination" — callers must still allow
 * shippingMethod = null and confirm shipping with the team over WhatsApp.
 */
export function resolveAvailableMethods(
  destinationCode: string,
  weightKg: number
): ShippingMethodOption[] {
  const code = destinationCode.trim().toLowerCase();
  if (!code || weightKg <= 0) return [];

  if (SYRIA_GOVERNORATE_CODES.has(code)) {
    const gov = SYRIA_GOVERNORATES.find((g) => g.code === code)!;
    return listDomesticCarriersFor(code).map((carrier) => ({
      code: `domestic:${code}:${carrier.carrierId}`,
      labelAr: `${carrier.nameAr} — ${carrier.deliveryKindAr} (${gov.nameAr})`,
      labelEn: `${carrier.nameEn} — ${carrier.deliveryKindEn} (${gov.nameEn})`,
      amount: carrier.amountUsd,
      currency: "USD" as const,
      alternate: null,
    }));
  }

  const zone = findZoneByCountryCode(code);
  if (!zone) return [];

  const options: ShippingMethodOption[] = [];
  for (const mode of ["land", "air"] as const) {
    if (!zone[mode]) continue;
    const quote = quoteInternationalShipping(zone.id, mode, weightKg);
    if (!quote) continue;
    options.push({
      code: `intl:${zone.id}:${mode}`,
      labelAr: `${zone.nameAr} — شحن ${modeLabelAr(mode)}`,
      labelEn: `${zone.nameEn} — ${modeLabelEn(mode)} shipping`,
      amount: quote.amount,
      currency: quote.currency,
      alternate: quote.alternate,
    });
  }
  return options;
}

export { quoteDomesticShipping, quoteInternationalShipping };
