/**
 * Shipping pricing — pure core. No DB, no Node built-ins: the same functions
 * price a quote on the server, drive the admin simulator, and run in tests
 * against the legacy code tables (see scripts/shipping-engine-checks.ts).
 */

export type RateBasis =
  | "PER_PARCEL"
  | "PER_KG"
  | "TIERED_PER_KG"
  | "TIERED_PER_PARCEL";

export type QuoteAudience = "CUSTOMER" | "TRADER";

/** One weight band. `perKg` keeps every currency leg the rate sheet offers. */
export type RateTier = {
  minKg: number;
  maxKg: number | null;
  /** TIERED_PER_KG: price per kg, per currency */
  perKg?: Partial<Record<string, number | null>>;
  /** TIERED_PER_PARCEL: flat price for the band (rate currency) */
  amount?: number;
};

export type EngineMethod = {
  code: string;
  labelAr: string;
  labelEn: string;
  mode: string;
  speed: string | null;
  security: string | null;
  consolidation: boolean;
  consolidationNote: string;
  carrierLabel: string;
  description: string;
  allowedClasses: string[];
  etaMinDays: number | null;
  etaMaxDays: number | null;
  active: boolean;
  sortOrder: number;
};

export type EngineRate = {
  id: string;
  countryCode: string;
  basis: RateBasis;
  amount: number;
  currency: string;
  tiers: RateTier[] | null;
  firstKgAmount: number | null;
  additionalKgAmount: number | null;
  minCharge: number | null;
  maxWeightKg: number | null;
  minChargeableWeightKg: number | null;
  handlingFee: number | null;
  freeShippingOver: number | null;
  audience: "CUSTOMER" | "TRADER" | "BOTH";
  validFrom: Date | null;
  validTo: Date | null;
  active: boolean;
  verified: boolean;
  source: string;
  method: EngineMethod;
};

export type EngineConfig = {
  roundingRule: "legacy_2dp" | "ceil_unit" | "ceil_5" | "none";
  packagingKg: number;
  volumetricDivisor: number | null;
  globalFreeShippingOver: number | null;
  insuranceEnabled: boolean;
  insurancePercent: number | null;
};

export const DEFAULT_ENGINE_CONFIG: EngineConfig = {
  roundingRule: "legacy_2dp",
  packagingKg: 0,
  volumetricDivisor: null,
  globalFreeShippingOver: null,
  insuranceEnabled: false,
  insurancePercent: null,
};

export type QuotePrice = {
  base: number;
  weightCharge: number;
  handling: number;
  insurance: number;
  discount: number;
  total: number;
  currency: string;
  alt: { amount: number; currency: string } | null;
};

export type QuoteMethodResult = {
  methodCode: string;
  labelAr: string;
  labelEn: string;
  carrierLabel: string;
  mode: string;
  speed: string | null;
  security: string | null;
  consolidation: boolean;
  note: string | null;
  etaMinDays: number | null;
  etaMaxDays: number | null;
  price: QuotePrice;
  rateId: string;
  /** Only ever true in admin previews (`includeUnverified`). */
  unverified: boolean;
  warnings: string[];
};

export type InquiryReason =
  | "NO_METHOD"
  | "MAX_WEIGHT"
  | "BELOW_TIER_FLOOR"
  | "WEIGHT_REQUIRED"
  | "RESTRICTED_CLASS";

export type QuoteCoreResult = {
  methods: QuoteMethodResult[];
  /** Show the "اطلب عرض سعر" card (alone, or next to the priced methods). */
  inquiry: boolean;
  inquiryReason: InquiryReason | null;
  /** Methods withheld because of a product class, with the admin's reason. */
  restricted: { methodCode: string; labelAr: string; reason: string }[];
};

export type QuoteCoreInput = {
  /** Billable weight before packaging; null = unknown (flat rates still price). */
  weightKg: number | null;
  /** Parcel count — only used for per-parcel packaging weight. */
  parcels?: number;
  /** Largest volumetric candidate in cm³, if dimensions are known. */
  volumeCm3?: number | null;
  /** Goods value, for free-shipping thresholds and insurance. */
  declaredValue?: number | null;
  /** Product shipping classes in the cart. */
  classes?: string[];
  audience: QuoteAudience;
  /** Admin simulator only. */
  includeUnverified?: boolean;
  now?: Date;
};

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export function applyRounding(n: number, rule: EngineConfig["roundingRule"]): number {
  switch (rule) {
    case "ceil_unit":
      return Math.ceil(round2(n));
    case "ceil_5":
      return Math.ceil(round2(n) / 5) * 5;
    case "none":
      return n;
    case "legacy_2dp":
    default:
      return round2(n);
  }
}

/** Weight the rate is charged on: packaging + volumetric, only if configured. */
export function chargeableWeight(
  input: Pick<QuoteCoreInput, "weightKg" | "parcels" | "volumeCm3">,
  config: EngineConfig
): number | null {
  if (input.weightKg == null || input.weightKg <= 0) return null;
  let w = input.weightKg + config.packagingKg * Math.max(1, input.parcels ?? 1);
  if (config.volumetricDivisor && config.volumetricDivisor > 0 && input.volumeCm3) {
    w = Math.max(w, input.volumeCm3 / config.volumetricDivisor);
  }
  return w;
}

function isRateVisible(rate: EngineRate, input: QuoteCoreInput, now: Date): boolean {
  if (!rate.active || !rate.method.active) return false;
  if (!rate.verified && !input.includeUnverified) return false;
  if (rate.validFrom && rate.validFrom.getTime() > now.getTime()) return false;
  if (rate.validTo && rate.validTo.getTime() < now.getTime()) return false;
  if (rate.audience !== "BOTH" && rate.audience !== input.audience) return false;
  return true;
}

type Priced =
  | { kind: "ok"; result: QuoteMethodResult }
  | { kind: "inquiry"; reason: InquiryReason }
  | { kind: "restricted"; reason: string };

/** Legacy leg order: USD first when present, else the first priced currency. */
const LEG_ORDER = ["USD", "EUR", "AED"];

function tierLegs(tier: RateTier, weight: number): { currency: string; amount: number }[] {
  const perKg = tier.perKg ?? {};
  const currencies = [
    ...LEG_ORDER.filter((c) => c in perKg),
    ...Object.keys(perKg).filter((c) => !LEG_ORDER.includes(c)),
  ];
  return currencies
    .filter((c) => perKg[c] != null)
    .map((c) => ({ currency: c, amount: round2(Number(perKg[c]) * weight) }));
}

export function priceRate(
  rate: EngineRate,
  input: QuoteCoreInput,
  config: EngineConfig
): Priced {
  const allowed = rate.method.allowedClasses;
  const classes = input.classes ?? [];
  if (allowed.length > 0 && classes.some((c) => !allowed.includes(c))) {
    return { kind: "restricted", reason: rate.method.description };
  }

  const raw = chargeableWeight(input, config);
  if (rate.maxWeightKg != null && raw != null && raw > rate.maxWeightKg) {
    return { kind: "inquiry", reason: "MAX_WEIGHT" };
  }
  const weight =
    raw != null && rate.minChargeableWeightKg != null
      ? Math.max(raw, rate.minChargeableWeightKg)
      : raw;

  let base = 0;
  let weightCharge = 0;
  let currency = rate.currency;
  let alt: QuotePrice["alt"] = null;

  if (rate.basis === "PER_PARCEL") {
    base = rate.amount;
  } else {
    if (weight == null) return { kind: "inquiry", reason: "WEIGHT_REQUIRED" };
    if (rate.basis === "PER_KG") {
      weightCharge =
        rate.firstKgAmount != null && rate.additionalKgAmount != null
          ? rate.firstKgAmount + Math.max(0, weight - 1) * rate.additionalKgAmount
          : rate.amount * weight;
    } else {
      const tier = (rate.tiers ?? []).find(
        (t) => weight >= t.minKg && (t.maxKg == null || weight <= t.maxKg)
      );
      if (!tier) return { kind: "inquiry", reason: "BELOW_TIER_FLOOR" };
      if (rate.basis === "TIERED_PER_KG") {
        const legs = tierLegs(tier, weight);
        if (legs.length === 0) return { kind: "inquiry", reason: "BELOW_TIER_FLOOR" };
        const primary = legs.find((l) => l.currency === "USD") ?? legs[0]!;
        weightCharge = primary.amount;
        currency = primary.currency;
        alt = legs.find((l) => l.currency !== primary.currency) ?? null;
      } else {
        base = Number(tier.amount ?? rate.amount);
      }
    }
  }

  const handling = rate.handlingFee ?? 0;
  let subtotal = applyRounding(base + weightCharge + handling, config.roundingRule);
  if (rate.minCharge != null) subtotal = Math.max(subtotal, rate.minCharge);

  const goods = input.declaredValue ?? null;
  const freeOver = rate.freeShippingOver ?? config.globalFreeShippingOver;
  const discount = goods != null && freeOver != null && goods >= freeOver ? subtotal : 0;

  const insurance =
    config.insuranceEnabled && config.insurancePercent && goods != null && goods > 0
      ? applyRounding((goods * config.insurancePercent) / 100, config.roundingRule)
      : 0;

  const total = round2(subtotal - discount + insurance);
  const warnings: string[] = [];
  if (!rate.verified) warnings.push("UNVERIFIED");
  if (weight == null && rate.basis === "PER_PARCEL" && rate.maxWeightKg != null) {
    warnings.push("WEIGHT_UNKNOWN");
  }

  return {
    kind: "ok",
    result: {
      methodCode: rate.method.code,
      labelAr: rate.method.labelAr,
      labelEn: rate.method.labelEn || rate.method.labelAr,
      carrierLabel: rate.method.carrierLabel,
      mode: rate.method.mode,
      speed: rate.method.speed,
      security: rate.method.security,
      consolidation: rate.method.consolidation,
      note: rate.method.consolidation ? rate.method.consolidationNote || null : null,
      etaMinDays: rate.method.etaMinDays,
      etaMaxDays: rate.method.etaMaxDays,
      price: {
        base: round2(base),
        weightCharge: round2(weightCharge),
        handling,
        insurance,
        discount,
        total,
        currency,
        alt: discount > 0 ? null : alt,
      },
      rateId: rate.id,
      unverified: !rate.verified,
      warnings,
    },
  };
}

/**
 * Prices every visible rate for one destination. Mixed bases sit side by
 * side; a rate that can't price this shipment (too heavy, below a tier
 * floor, weight unknown) never yields a misleading number — it turns on the
 * inquiry card instead.
 */
export function quoteFromRates(
  rates: EngineRate[],
  input: QuoteCoreInput,
  config: EngineConfig = DEFAULT_ENGINE_CONFIG
): QuoteCoreResult {
  const now = input.now ?? new Date();
  const methods: QuoteMethodResult[] = [];
  const restricted: QuoteCoreResult["restricted"] = [];
  let reason: InquiryReason | null = null;
  const order = new Map<string, number>();

  for (const rate of rates) {
    if (!isRateVisible(rate, input, now)) continue;
    const priced = priceRate(rate, input, config);
    if (priced.kind === "ok") {
      methods.push(priced.result);
      order.set(priced.result.methodCode, rate.method.sortOrder);
    } else if (priced.kind === "inquiry") {
      reason = reason ?? priced.reason;
    } else {
      restricted.push({
        methodCode: rate.method.code,
        labelAr: rate.method.labelAr,
        reason: priced.reason,
      });
      reason = reason ?? "RESTRICTED_CLASS";
    }
  }

  methods.sort(
    (a, b) =>
      (order.get(a.methodCode) ?? 0) - (order.get(b.methodCode) ?? 0) ||
      a.price.total - b.price.total
  );

  const inquiry = methods.length === 0 || reason !== null;
  return {
    methods,
    inquiry,
    inquiryReason: inquiry ? (reason ?? "NO_METHOD") : null,
    restricted,
  };
}
