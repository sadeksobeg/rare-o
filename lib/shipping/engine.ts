/**
 * Server-authoritative shipping quote — DB layer over engine-core.ts.
 * Rates come only from the catalog tables (legacy options were imported as
 * verified rows; see lib/shipping/importer.ts and the parity gate in
 * scripts/shipping-engine-checks.ts). Nothing here trusts a client total.
 */
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import {
  DEFAULT_ENGINE_CONFIG,
  quoteFromRates,
  type EngineConfig,
  type EngineRate,
  type QuoteAudience,
  type QuoteCoreResult,
  type RateBasis,
  type RateTier,
} from "@/lib/shipping/engine-core";
import { calculateOudShipmentWeightKg, SYRIA_GOVERNORATES } from "@/lib/shipping/rates";

export type { QuoteAudience, QuoteMethodResult, InquiryReason } from "@/lib/shipping/engine-core";

export type QuoteItemInput = {
  productId?: string;
  qty: number;
  /** Explicit per-unit weight (admin simulator / tests). */
  weightKg?: number | null;
};

export type QuoteResult = QuoteCoreResult & {
  destinationCode: string;
  destination: { nameAr: string; nameEn: string; note: string } | null;
  weightKg: number | null;
  /** How the weight was obtained — shown in the admin simulator. */
  weightSource: "explicit" | "products" | "heuristic" | "mixed" | "unknown";
  inquiryNote: { ar: string; en: string };
};

const GOVERNORATE_CODES = new Set(SYRIA_GOVERNORATES.map((g) => g.code));

/** Governorate codes are stored lowercase, ISO country codes uppercase. */
export function normalizeDestinationCode(raw: string): string {
  const code = raw.trim();
  return GOVERNORATE_CODES.has(code.toLowerCase()) ? code.toLowerCase() : code.toUpperCase();
}

const num = (v: Prisma.Decimal | number | null | undefined): number | null =>
  v == null ? null : Number(v);

type RateRow = Prisma.ShippingRateGetPayload<{ include: { method: true } }>;

export function toEngineRate(row: RateRow): EngineRate {
  return {
    id: row.id,
    countryCode: row.countryCode,
    basis: row.basis as RateBasis,
    amount: Number(row.amount),
    currency: row.currency,
    tiers: Array.isArray(row.tiers) ? (row.tiers as unknown as RateTier[]) : null,
    firstKgAmount: num(row.firstKgAmount),
    additionalKgAmount: num(row.additionalKgAmount),
    minCharge: num(row.minCharge),
    maxWeightKg: num(row.maxWeightKg),
    minChargeableWeightKg: num(row.minChargeableWeightKg),
    handlingFee: num(row.handlingFee),
    freeShippingOver: num(row.freeShippingOver),
    audience: row.audience as EngineRate["audience"],
    validFrom: row.validFrom,
    validTo: row.validTo,
    active: row.active,
    verified: row.verified,
    source: row.source,
    method: {
      code: row.method.code,
      labelAr: row.method.labelAr,
      labelEn: row.method.labelEn,
      mode: row.method.mode,
      speed: row.method.speed,
      security: row.method.security,
      consolidation: row.method.consolidation,
      consolidationNote: row.method.consolidationNote,
      carrierLabel: row.method.carrierLabel,
      description: row.method.description,
      allowedClasses: row.method.allowedClasses,
      etaMinDays: row.method.etaMinDays,
      etaMaxDays: row.method.etaMaxDays,
      active: row.method.active,
      sortOrder: row.method.sortOrder,
    },
  };
}

export async function loadEngineConfig(): Promise<{
  config: EngineConfig;
  inquiryNote: { ar: string; en: string };
}> {
  const row = await prisma.shippingConfig.findUnique({ where: { id: "default" } });
  if (!row) {
    return { config: DEFAULT_ENGINE_CONFIG, inquiryNote: { ar: "", en: "" } };
  }
  return {
    config: {
      roundingRule: row.roundingRule as EngineConfig["roundingRule"],
      packagingKg: Number(row.packagingKg),
      volumetricDivisor: num(row.volumetricDivisor),
      globalFreeShippingOver: num(row.globalFreeShippingOver),
      insuranceEnabled: row.insuranceEnabled,
      insurancePercent: num(row.insurancePercent),
    },
    inquiryNote: { ar: row.inquiryNoteAr, en: row.inquiryNoteEn },
  };
}

/**
 * Product weight if set, else the legacy oud-box heuristic for the units
 * without one. Returns the shipping classes seen, for method restrictions.
 */
export async function resolveWeight(
  items: QuoteItemInput[],
  explicitWeightKg?: number | null
): Promise<{ weightKg: number | null; source: QuoteResult["weightSource"]; classes: string[] }> {
  if (explicitWeightKg != null && explicitWeightKg > 0) {
    return { weightKg: explicitWeightKg, source: "explicit", classes: [] };
  }
  if (items.length === 0) return { weightKg: null, source: "unknown", classes: [] };

  const ids = [...new Set(items.map((i) => i.productId).filter((v): v is string => !!v))];
  const products = ids.length
    ? await prisma.product.findMany({
        where: { id: { in: ids } },
        select: { id: true, weightKg: true, shippingClass: true },
      })
    : [];
  const byId = new Map(products.map((p) => [p.id, p]));

  let known = 0;
  let unweighedUnits = 0;
  const classes = new Set<string>();
  for (const item of items) {
    const qty = Math.max(0, Math.floor(item.qty));
    if (qty === 0) continue;
    const product = item.productId ? byId.get(item.productId) : undefined;
    if (product) classes.add(product.shippingClass || "other");
    const unit = item.weightKg ?? num(product?.weightKg);
    if (unit != null && unit > 0) known += unit * qty;
    else unweighedUnits += qty;
  }

  const heuristic = calculateOudShipmentWeightKg(unweighedUnits);
  const weightKg = known + heuristic;
  const source =
    unweighedUnits === 0 ? "products" : known === 0 ? "heuristic" : "mixed";
  return { weightKg: weightKg > 0 ? weightKg : null, source, classes: [...classes] };
}

export async function quote(input: {
  destinationCode: string;
  items?: QuoteItemInput[];
  weightKg?: number | null;
  declaredValue?: number | null;
  audience: QuoteAudience;
  /** Admin simulator only — never set from a public route. */
  includeUnverified?: boolean;
}): Promise<QuoteResult> {
  const destinationCode = normalizeDestinationCode(input.destinationCode);
  const [{ weightKg, source, classes }, { config, inquiryNote }, country] = await Promise.all([
    resolveWeight(input.items ?? [], input.weightKg),
    loadEngineConfig(),
    prisma.shippingCountry.findUnique({
      where: { code: destinationCode },
      include: { rates: { include: { method: true } } },
    }),
  ]);

  const usable = country && country.active ? country.rates.map(toEngineRate) : [];
  const core = quoteFromRates(
    usable,
    {
      weightKg,
      declaredValue: input.declaredValue ?? null,
      classes,
      audience: input.audience,
      includeUnverified: input.includeUnverified === true,
    },
    config
  );

  return {
    ...core,
    // An unknown or inquiry-disabled destination still never shows a price.
    inquiry: core.inquiry && (country ? country.inquiryEnabled : true),
    destinationCode,
    destination: country
      ? { nameAr: country.nameAr, nameEn: country.nameEn, note: country.note }
      : null,
    weightKg,
    weightSource: source,
    inquiryNote,
  };
}

/** Immutable snapshot stored on a request at submit time. */
export function buildQuoteSnapshot(result: QuoteResult, methodCode: string | null) {
  const chosen = methodCode ? result.methods.find((m) => m.methodCode === methodCode) ?? null : null;
  return {
    v: 1,
    at: new Date().toISOString(),
    destinationCode: result.destinationCode,
    weightKg: result.weightKg,
    weightSource: result.weightSource,
    method: chosen
      ? {
          code: chosen.methodCode,
          labelAr: chosen.labelAr,
          labelEn: chosen.labelEn,
          rateId: chosen.rateId,
          price: chosen.price,
        }
      : null,
    inquiry: result.inquiry,
    inquiryReason: result.inquiryReason,
  };
}
