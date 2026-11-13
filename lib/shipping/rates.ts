/**
 * Shipping cost calculator — RARE OUD (Syria-origin).
 *
 * Fills the extension point left by resolve-available-methods.ts. Source:
 * owner-supplied carrier rate sheet (2026-11-06) for international
 * land/air packages, plus a flat-rate domestic Syria governorate network.
 *
 * All computed amounts are an ESTIMATE shown before handoff — like every
 * other request on this platform, the final terms are confirmed over
 * WhatsApp, never charged automatically (no payment gateway exists here).
 *
 * SYP ("Syria-pay") legs for the UAE/Oman/Iraq air lanes are deliberately
 * NOT modeled here: the storefront's base currency is USD and there is no
 * live SYP exchange rate in this project, so a SYP number would not be a
 * meaningful "cost" next to USD line items. Those lanes compute from their
 * destination-currency leg instead (AED for UAE, USD for Oman/Iraq), which
 * the rate sheet offers as an equally valid way to pay. The SYP alternative
 * stays available for the admin to quote manually over WhatsApp.
 */

export type ShippingMode = "land" | "air";

export type RateCurrency = "USD" | "EUR" | "AED";

export type WeightTier = {
  /** Inclusive lower bound, kg. */
  minKg: number;
  /** Inclusive upper bound, kg — null means unbounded. */
  maxKg: number | null;
  perKg: Record<RateCurrency, number | null>;
};

export type ModeRates = {
  tiers: WeightTier[];
};

export type InternationalZone = {
  id: string;
  nameAr: string;
  nameEn: string;
  countries: { code: string; nameAr: string; nameEn: string }[];
  land?: ModeRates;
  air?: ModeRates;
};

function flat(perKg: Partial<Record<RateCurrency, number>>): ModeRates {
  return {
    tiers: [
      {
        minKg: 0,
        maxKg: null,
        perKg: { USD: perKg.USD ?? null, EUR: perKg.EUR ?? null, AED: perKg.AED ?? null },
      },
    ],
  };
}

function tiered(
  tiers: { minKg: number; maxKg: number | null; USD?: number; EUR?: number }[]
): ModeRates {
  return {
    tiers: tiers.map((t) => ({
      minKg: t.minKg,
      maxKg: t.maxKg,
      perKg: { USD: t.USD ?? null, EUR: t.EUR ?? null, AED: null },
    })),
  };
}

export const INTERNATIONAL_ZONES: InternationalZone[] = [
  {
    id: "germany",
    nameAr: "باقة ألمانيا",
    nameEn: "Germany package",
    countries: [
      { code: "DE", nameAr: "ألمانيا", nameEn: "Germany" },
      { code: "NL", nameAr: "هولندا", nameEn: "Netherlands" },
      { code: "BE", nameAr: "بلجيكا", nameEn: "Belgium" },
      { code: "LU", nameAr: "لوكسمبورغ", nameEn: "Luxembourg" },
    ],
    land: tiered([
      { minKg: 11, maxKg: 20, USD: 6.5, EUR: 5.5 },
      { minKg: 21, maxKg: null, USD: 5.5, EUR: 5 },
    ]),
    air: tiered([
      { minKg: 11, maxKg: 20, USD: 7.5, EUR: 6.5 },
      { minKg: 21, maxKg: null, USD: 7, EUR: 6 },
    ]),
  },
  {
    id: "austria",
    nameAr: "باقة النمسا",
    nameEn: "Austria package",
    countries: [
      { code: "AT", nameAr: "النمسا", nameEn: "Austria" },
      { code: "DK", nameAr: "الدنمارك", nameEn: "Denmark" },
      { code: "FR", nameAr: "فرنسا", nameEn: "France" },
    ],
    land: flat({ USD: 6.25, EUR: 5.5 }),
    air: flat({ USD: 9, EUR: 7.75 }),
  },
  {
    id: "sweden",
    nameAr: "باقة السويد",
    nameEn: "Sweden package",
    countries: [
      { code: "SE", nameAr: "السويد", nameEn: "Sweden" },
      { code: "IT", nameAr: "إيطاليا", nameEn: "Italy" },
      { code: "ES", nameAr: "إسبانيا", nameEn: "Spain" },
      { code: "MT", nameAr: "مالطا", nameEn: "Malta" },
    ],
    land: flat({ USD: 7, EUR: 6 }),
    air: flat({ USD: 9.5, EUR: 8.25 }),
  },
  {
    id: "britain",
    nameAr: "باقة بريطانيا",
    nameEn: "Britain package",
    countries: [
      { code: "GB", nameAr: "بريطانيا", nameEn: "Britain" },
      { code: "IS", nameAr: "إسلندا", nameEn: "Iceland" },
      { code: "PT", nameAr: "البرتغال", nameEn: "Portugal" },
      { code: "HR", nameAr: "كرواتيا", nameEn: "Croatia" },
      { code: "EE", nameAr: "إستونيا", nameEn: "Estonia" },
      { code: "HU", nameAr: "هنغاريا", nameEn: "Hungary" },
      { code: "LV", nameAr: "لاتفيا", nameEn: "Latvia" },
      { code: "LT", nameAr: "ليتوانيا", nameEn: "Lithuania" },
      { code: "RO", nameAr: "رومانيا", nameEn: "Romania" },
      { code: "SI", nameAr: "سلوفينيا", nameEn: "Slovenia" },
      { code: "RS", nameAr: "صربيا", nameEn: "Serbia" },
      { code: "SK", nameAr: "سلوفاكيا", nameEn: "Slovakia" },
    ],
    land: flat({ USD: 7.5, EUR: 6.5 }),
    air: flat({ USD: 10.5, EUR: 9 }),
  },
  {
    id: "norway",
    nameAr: "باقة النرويج",
    nameEn: "Norway package",
    countries: [
      { code: "CH", nameAr: "سويسرا", nameEn: "Switzerland" },
      { code: "NO", nameAr: "النرويج", nameEn: "Norway" },
      { code: "CY", nameAr: "قبرص", nameEn: "Cyprus" },
      { code: "GR", nameAr: "اليونان", nameEn: "Greece" },
    ],
    land: flat({ USD: 8, EUR: 6.75 }),
    air: flat({ USD: 11, EUR: 10 }),
  },
  {
    id: "america",
    nameAr: "باقة أمريكا",
    nameEn: "America package",
    countries: [
      { code: "US", nameAr: "أمريكا", nameEn: "United States" },
      { code: "CA", nameAr: "كندا", nameEn: "Canada" },
      { code: "CN", nameAr: "الصين", nameEn: "China" },
      { code: "TH", nameAr: "تايلاند", nameEn: "Thailand" },
      { code: "PS", nameAr: "فلسطين", nameEn: "Palestine" },
      { code: "DZ", nameAr: "الجزائر", nameEn: "Algeria" },
      { code: "MA", nameAr: "المغرب", nameEn: "Morocco" },
    ],
    land: flat({ USD: 11, EUR: 10.5 }),
    air: flat({ USD: 19, EUR: 16 }),
  },
  {
    id: "uae",
    nameAr: "الإمارات",
    nameEn: "UAE (air)",
    countries: [{ code: "AE", nameAr: "الإمارات", nameEn: "United Arab Emirates" }],
    air: flat({ AED: 7.5 }),
  },
  {
    id: "oman",
    nameAr: "سلطنة عُمان (شحن جوي)",
    nameEn: "Oman (air)",
    countries: [{ code: "OM", nameAr: "سلطنة عُمان", nameEn: "Oman" }],
    air: flat({ USD: 3 }),
  },
  {
    id: "iraq",
    nameAr: "العراق (شحن جوي)",
    nameEn: "Iraq (air)",
    countries: [{ code: "IQ", nameAr: "العراق", nameEn: "Iraq" }],
    air: flat({ USD: 3 }),
  },
];

export function findZoneByCountryCode(code: string): InternationalZone | null {
  const needle = code.trim().toUpperCase();
  return (
    INTERNATIONAL_ZONES.find((z) =>
      z.countries.some((c) => c.code === needle)
    ) ?? null
  );
}

export function listShippableCountries(): {
  code: string;
  nameAr: string;
  nameEn: string;
  zoneId: string;
}[] {
  return INTERNATIONAL_ZONES.flatMap((z) =>
    z.countries.map((c) => ({ ...c, zoneId: z.id }))
  );
}

export type InternationalQuote = {
  zoneId: string;
  mode: ShippingMode;
  weightKg: number;
  /** Primary estimate shown to the customer/trader. */
  amount: number;
  currency: RateCurrency;
  /** The other valid way to pay the same shipment, when the rate sheet offers one. */
  alternate: { amount: number; currency: RateCurrency } | null;
};

/** Picks the tier whose [min, max] range contains weightKg. */
function tierFor(rates: ModeRates, weightKg: number): WeightTier | null {
  return (
    rates.tiers.find(
      (t) => weightKg >= t.minKg && (t.maxKg == null || weightKg <= t.maxKg)
    ) ?? null
  );
}

/**
 * Quotes an international shipment. Prefers USD as the primary currency
 * (the storefront's base currency); EUR/AED become the primary only when
 * no USD leg exists for that lane (UAE today).
 */
export function quoteInternationalShipping(
  zoneId: string,
  mode: ShippingMode,
  weightKg: number
): InternationalQuote | null {
  if (weightKg <= 0) return null;
  const zone = INTERNATIONAL_ZONES.find((z) => z.id === zoneId);
  const rates = mode === "land" ? zone?.land : zone?.air;
  if (!rates) return null;
  const tier = tierFor(rates, weightKg);
  if (!tier) return null;

  const legs = (Object.entries(tier.perKg) as [RateCurrency, number | null][])
    .filter((entry): entry is [RateCurrency, number] => entry[1] != null)
    .map(([currency, perKg]) => ({
      currency,
      amount: Math.round(perKg * weightKg * 100) / 100,
    }));
  if (legs.length === 0) return null;

  const primary = legs.find((l) => l.currency === "USD") ?? legs[0]!;
  const alternate = legs.find((l) => l.currency !== primary.currency) ?? null;

  return {
    zoneId,
    mode,
    weightKg,
    amount: primary.amount,
    currency: primary.currency,
    alternate,
  };
}

/**
 * Billable weight for a shipment of `oudCount` oud instruments. Ouds are
 * boxed in pairs: every 2 ouds share one 25 kg box, and a leftover single
 * oud gets its own 20 kg box. E.g. 1→20, 2→25, 3→25+20=45, 4→50, 5→70.
 */
export function calculateOudShipmentWeightKg(oudCount: number): number {
  if (oudCount <= 0) return 0;
  const pairs = Math.floor(oudCount / 2);
  const remainder = oudCount % 2;
  return pairs * 25 + remainder * 20;
}

/** Breakdown of the box grouping behind calculateOudShipmentWeightKg. */
export function describeOudShipmentBoxes(
  oudCount: number
): { pairs: number; remainder: number; totalKg: number } {
  if (oudCount <= 0) return { pairs: 0, remainder: 0, totalKg: 0 };
  const pairs = Math.floor(oudCount / 2);
  const remainder = oudCount % 2;
  return { pairs, remainder, totalKg: pairs * 25 + remainder * 20 };
}

// ---------------------------------------------------------------------------
// Domestic Syria network — flat per-shipment rates (not weight-based).
// ---------------------------------------------------------------------------

export type DomesticCarrierId = "bus" | "babel" | "al-mufti";

export const SYRIA_GOVERNORATES: { code: string; nameAr: string; nameEn: string }[] = [
  { code: "damascus", nameAr: "دمشق", nameEn: "Damascus" },
  { code: "tartus", nameAr: "طرطوس", nameEn: "Tartus" },
  { code: "latakia", nameAr: "اللاذقية", nameEn: "Latakia" },
  { code: "aleppo", nameAr: "حلب", nameEn: "Aleppo" },
  { code: "idlib", nameAr: "إدلب", nameEn: "Idlib" },
  { code: "raqqa", nameAr: "الرقة", nameEn: "Raqqa" },
  { code: "hama", nameAr: "حماة", nameEn: "Hama" },
  { code: "homs", nameAr: "حمص", nameEn: "Homs" },
  { code: "suwayda", nameAr: "السويداء", nameEn: "Suwayda" },
  { code: "daraa", nameAr: "درعا", nameEn: "Daraa" },
];

const BUS_GOVERNORATES = new Set([
  "damascus",
  "tartus",
  "latakia",
  "aleppo",
  "idlib",
  "raqqa",
  "hama",
  "homs",
]);

/** Babel does home delivery everywhere it covers except Raqqa/Idlib; Daraa included. */
const BABEL_GOVERNORATES = new Set([
  "damascus",
  "tartus",
  "latakia",
  "aleppo",
  "hama",
  "homs",
  "daraa",
]);

const AL_MUFTI_GOVERNORATES = new Set(["suwayda", "daraa"]);

export type DomesticCarrierOption = {
  carrierId: DomesticCarrierId;
  nameAr: string;
  nameEn: string;
  /** Pickup point vs. door delivery — shown to set the right expectation. */
  deliveryKindAr: string;
  deliveryKindEn: string;
  amountUsd: number;
};

const DOMESTIC_CARRIERS: Record<
  DomesticCarrierId,
  { nameAr: string; nameEn: string; deliveryKindAr: string; deliveryKindEn: string; amountUsd: number }
> = {
  bus: {
    nameAr: "الباص",
    nameEn: "Bus",
    deliveryKindAr: "استلام من مكتب الباص",
    deliveryKindEn: "Pickup from the bus office",
    amountUsd: 2,
  },
  babel: {
    nameAr: "بابل",
    nameEn: "Babel",
    deliveryKindAr: "توصيل حتى باب المنزل",
    deliveryKindEn: "Home delivery",
    amountUsd: 10,
  },
  "al-mufti": {
    nameAr: "المفتي",
    nameEn: "Al-Mufti",
    deliveryKindAr: "توصيل حتى باب المنزل",
    deliveryKindEn: "Home delivery",
    amountUsd: 5,
  },
};

/** Every carrier available to a given Syrian governorate, cheapest first. */
export function listDomesticCarriersFor(
  governorateCode: string
): DomesticCarrierOption[] {
  const code = governorateCode.trim().toLowerCase();
  const ids: DomesticCarrierId[] = [];
  if (BUS_GOVERNORATES.has(code)) ids.push("bus");
  if (AL_MUFTI_GOVERNORATES.has(code)) ids.push("al-mufti");
  if (BABEL_GOVERNORATES.has(code)) ids.push("babel");
  return ids
    .map((carrierId) => ({ carrierId, ...DOMESTIC_CARRIERS[carrierId] }))
    .sort((a, b) => a.amountUsd - b.amountUsd);
}

export function quoteDomesticShipping(
  governorateCode: string,
  carrierId: DomesticCarrierId
): number | null {
  const available = listDomesticCarriersFor(governorateCode);
  return available.find((c) => c.carrierId === carrierId)?.amountUsd ?? null;
}
