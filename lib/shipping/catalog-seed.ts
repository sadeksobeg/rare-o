/**
 * Builds the shipping catalog rows (countries / methods / rates) from the two
 * sources of truth: the legacy code tables in rates.ts (imported verified,
 * source=LEGACY, behaviour unchanged) and the owner's notebook rates
 * (imported unverified, source=NOTEBOOK — hidden until the owner verifies).
 *
 * Pure: the importer writes these rows to the DB, and the parity test feeds
 * the very same rows to the engine without touching a database.
 */
import {
  INTERNATIONAL_ZONES,
  SYRIA_GOVERNORATES,
  listDomesticCarriersFor,
  type RateCurrency,
} from "@/lib/shipping/rates";
import type { RateBasis, RateTier } from "@/lib/shipping/engine-core";

export type SeedCountry = {
  code: string;
  nameAr: string;
  nameEn: string;
  region: string;
};

export type SeedMethod = {
  code: string;
  labelAr: string;
  labelEn: string;
  mode: string;
  speed: string | null;
  security: string | null;
  consolidation: boolean;
  consolidationNote: string;
  carrierLabel: string;
  source: "LEGACY" | "NOTEBOOK";
  sortOrder: number;
};

export type SeedRate = {
  countryCode: string;
  methodCode: string;
  basis: RateBasis;
  amount: number;
  currency: string;
  tiers: RateTier[] | null;
  maxWeightKg: number | null;
  verified: boolean;
  source: "LEGACY" | "NOTEBOOK";
  packageLabel: string | null;
};

/** Denormalized row shape (STOP-A reconstruction). */
type NotebookSeedRowFlat = {
  countryCode: string;
  methodCode: string;
  labelAr: string;
  carrierLabel: string;
  mode: string;
  speed: string | null;
  security: string | null;
  consolidation: boolean;
  basis: string;
  amount: number;
  currency: string;
  maxWeightKg: number | null;
  verified: boolean;
  source: string;
};

/**
 * Owner attachment shape (MASTER-EXECUTION §1b / shipping-rates-seed.json).
 * `methods[]` carries labels; `rates[]` references method codes + optional speedOverride.
 */
type NotebookSeedOwner = {
  _meta?: {
    currency?: string;
    basis?: string;
    maxWeightKgDefault?: number;
    verifiedDefault?: boolean;
  };
  methods: {
    code: string;
    labelAr: string;
    mode: string;
    speed: string | null;
    security: string | null;
    consolidation: boolean;
    carrierLabel: string;
  }[];
  rates: {
    code: string;
    method: string;
    amount: number;
    speedOverride?: string | null;
  }[];
};

export type NotebookSeedFile =
  | { rates: NotebookSeedRowFlat[] }
  | NotebookSeedOwner;

function isOwnerSeed(file: NotebookSeedFile): file is NotebookSeedOwner {
  return Array.isArray((file as NotebookSeedOwner).methods);
}

/** Normalize either seed shape into the flat rows `buildNotebookCatalog` consumes. */
export function normalizeNotebookSeed(file: NotebookSeedFile): NotebookSeedRowFlat[] {
  if (!isOwnerSeed(file)) return file.rates;
  const meta = file._meta ?? {};
  const currency = meta.currency ?? "USD";
  const basis = meta.basis ?? "PER_PARCEL";
  const maxWeightKg =
    meta.maxWeightKgDefault === undefined ? 50 : meta.maxWeightKgDefault;
  const byCode = new Map(file.methods.map((m) => [m.code, m]));
  return file.rates.map((r) => {
    const m = byCode.get(r.method);
    if (!m) throw new Error(`Notebook rate references unknown method ${r.method}`);
    const speed =
      r.speedOverride !== undefined && r.speedOverride !== null
        ? r.speedOverride
        : m.speed;
    return {
      countryCode: r.code,
      methodCode: r.method,
      labelAr:
        speed === "FAST" && r.method === "LAND_PASSENGER_CAR"
          ? "شحن بري سريع مع سيارة ركاب"
          : m.labelAr,
      carrierLabel: m.carrierLabel,
      mode: m.mode,
      speed,
      security: m.security,
      consolidation: m.consolidation,
      basis,
      amount: r.amount,
      currency,
      maxWeightKg,
      verified: false,
      source: "NOTEBOOK",
    };
  });
}

/** Region for a governorate row — domestic Syria lives in the same table. */
export const DOMESTIC_REGION = "syria";

const NOTEBOOK_COUNTRIES: Record<string, { nameAr: string; nameEn: string; region: string }> = {
  LB: { nameAr: "لبنان", nameEn: "Lebanon", region: "levant" },
  JO: { nameAr: "الأردن", nameEn: "Jordan", region: "levant" },
  SA: { nameAr: "السعودية", nameEn: "Saudi Arabia", region: "gulf" },
  AE: { nameAr: "الإمارات", nameEn: "United Arab Emirates", region: "gulf" },
};

const ZONE_REGION: Record<string, string> = {
  germany: "europe",
  austria: "europe",
  sweden: "europe",
  britain: "europe",
  norway: "europe",
  america: "world",
  uae: "gulf",
  oman: "gulf",
  iraq: "levant",
};

/** Legacy rows are primary-priced in USD when a USD leg exists, else the first leg. */
function primaryCurrency(perKg: Record<RateCurrency, number | null>): RateCurrency {
  if (perKg.USD != null) return "USD";
  return (Object.keys(perKg) as RateCurrency[]).find((c) => perKg[c] != null) ?? "USD";
}

export function buildLegacyCatalog(): {
  countries: SeedCountry[];
  methods: SeedMethod[];
  rates: SeedRate[];
} {
  const countries: SeedCountry[] = [];
  const methods: SeedMethod[] = [];
  const rates: SeedRate[] = [];

  for (const zone of INTERNATIONAL_ZONES) {
    for (const c of zone.countries) {
      countries.push({
        code: c.code,
        nameAr: c.nameAr,
        nameEn: c.nameEn,
        region: ZONE_REGION[zone.id] ?? "other",
      });
    }
    (["land", "air"] as const).forEach((mode, i) => {
      const modeRates = zone[mode];
      if (!modeRates) return;
      const methodCode = `intl:${zone.id}:${mode}`;
      methods.push({
        code: methodCode,
        labelAr: `${zone.nameAr} — شحن ${mode === "land" ? "بري" : "جوي"}`,
        labelEn: `${zone.nameEn} — ${mode === "land" ? "Land" : "Air"} shipping`,
        mode: mode.toUpperCase(),
        speed: null,
        security: null,
        consolidation: false,
        consolidationNote: "",
        carrierLabel: "",
        source: "LEGACY",
        sortOrder: i,
      });
      const tiers: RateTier[] = modeRates.tiers.map((t) => ({
        minKg: t.minKg,
        maxKg: t.maxKg,
        perKg: { ...t.perKg },
      }));
      const first = modeRates.tiers[0]!;
      const currency = primaryCurrency(first.perKg);
      for (const c of zone.countries) {
        rates.push({
          countryCode: c.code,
          methodCode,
          basis: "TIERED_PER_KG",
          amount: Number(first.perKg[currency] ?? 0),
          currency,
          tiers,
          maxWeightKg: null,
          verified: true,
          source: "LEGACY",
          packageLabel: zone.id,
        });
      }
    });
  }

  for (const gov of SYRIA_GOVERNORATES) {
    countries.push({
      code: gov.code,
      nameAr: gov.nameAr,
      nameEn: gov.nameEn,
      region: DOMESTIC_REGION,
    });
    listDomesticCarriersFor(gov.code).forEach((carrier, i) => {
      const methodCode = `domestic:${gov.code}:${carrier.carrierId}`;
      methods.push({
        code: methodCode,
        labelAr: `${carrier.nameAr} — ${carrier.deliveryKindAr} (${gov.nameAr})`,
        labelEn: `${carrier.nameEn} — ${carrier.deliveryKindEn} (${gov.nameEn})`,
        mode: "LAND",
        speed: null,
        security: null,
        consolidation: false,
        consolidationNote: "",
        carrierLabel: carrier.nameAr,
        source: "LEGACY",
        sortOrder: i,
      });
      rates.push({
        countryCode: gov.code,
        methodCode,
        basis: "PER_PARCEL",
        amount: carrier.amountUsd,
        currency: "USD",
        tiers: null,
        maxWeightKg: null,
        verified: true,
        source: "LEGACY",
        packageLabel: "domestic",
      });
    });
  }

  return { countries, methods, rates };
}

/**
 * A method code is unique, but the notebook reuses LAND_PASSENGER_CAR for two
 * different services (LB: plain; SA: fast, different label). The SA one is
 * stored under its own code so each keeps its label and speed.
 */
export function notebookMethodCode(row: { countryCode: string; methodCode: string; speed: string | null }): string {
  if (row.methodCode === "LAND_PASSENGER_CAR" && row.speed === "FAST") {
    return "LAND_FAST_PASSENGER_CAR";
  }
  return row.methodCode;
}

export const CONSOLIDATION_NOTE_AR =
  "شحن تجميعي: تنتظر الشحنة اكتمال الحمولة قبل الانطلاق، لذلك قد يطول موعد الخروج.";

export function buildNotebookCatalog(file: NotebookSeedFile): {
  countries: SeedCountry[];
  methods: SeedMethod[];
  rates: SeedRate[];
} {
  const countries = new Map<string, SeedCountry>();
  const methods = new Map<string, SeedMethod>();
  const rates: SeedRate[] = [];

  normalizeNotebookSeed(file).forEach((row, i) => {
    const known = NOTEBOOK_COUNTRIES[row.countryCode];
    if (!known) throw new Error(`Unknown notebook country ${row.countryCode}`);
    countries.set(row.countryCode, { code: row.countryCode, ...known });
    const code = notebookMethodCode(row);
    methods.set(code, {
      code,
      labelAr: row.labelAr,
      labelEn: "",
      mode: row.mode,
      speed: row.speed,
      security: row.security,
      consolidation: row.consolidation,
      consolidationNote: row.consolidation ? CONSOLIDATION_NOTE_AR : "",
      carrierLabel: row.carrierLabel,
      source: "NOTEBOOK",
      sortOrder: 10 + i,
    });
    rates.push({
      countryCode: row.countryCode,
      methodCode: code,
      basis: "PER_PARCEL",
      amount: row.amount,
      currency: row.currency,
      tiers: null,
      maxWeightKg: row.maxWeightKg,
      verified: false,
      source: "NOTEBOOK",
      packageLabel: null,
    });
  });

  return { countries: [...countries.values()], methods: [...methods.values()], rates };
}
