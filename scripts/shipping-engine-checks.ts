/**
 * Shipping engine gates (no DB):
 *  1. LEGACY PARITY (blocking) — every legacy zone country x {land, air} x
 *     weights, and every governorate x carrier, priced by the new engine from
 *     the imported catalog rows must equal the old code tables to 0.01.
 *  2. Golden tests for the 7 notebook rates and each pricing basis.
 * Run: npm run test:shipping-engine
 */
import fs from "node:fs";
import path from "node:path";
import {
  DEFAULT_ENGINE_CONFIG,
  quoteFromRates,
  type EngineConfig,
  type EngineRate,
  type QuoteCoreInput,
} from "../lib/shipping/engine-core";
import {
  buildLegacyCatalog,
  buildNotebookCatalog,
  type NotebookSeedFile,
  type SeedMethod,
  type SeedRate,
} from "../lib/shipping/catalog-seed";
import { INTERNATIONAL_ZONES, SYRIA_GOVERNORATES } from "../lib/shipping/rates";
import { resolveAvailableMethods } from "../lib/shipping/resolve-available-methods";

let passed = 0;
let failed = 0;
function check(cond: unknown, msg: string) {
  if (cond) {
    passed += 1;
  } else {
    failed += 1;
    console.error(`FAIL: ${msg}`);
  }
}
function section(name: string, before: number) {
  console.log(`PASS: ${name} (${passed - before} assertions)`);
}

function toEngineRates(methods: SeedMethod[], rates: SeedRate[], verified?: boolean): EngineRate[] {
  const byCode = new Map(methods.map((m) => [m.code, m]));
  return rates.map((r, i) => {
    const m = byCode.get(r.methodCode)!;
    return {
      id: `seed-${i}`,
      countryCode: r.countryCode,
      basis: r.basis,
      amount: r.amount,
      currency: r.currency,
      tiers: r.tiers,
      firstKgAmount: null,
      additionalKgAmount: null,
      minCharge: null,
      maxWeightKg: r.maxWeightKg,
      minChargeableWeightKg: null,
      handlingFee: null,
      freeShippingOver: null,
      audience: "BOTH",
      validFrom: null,
      validTo: null,
      active: true,
      verified: verified ?? r.verified,
      source: r.source,
      method: {
        code: m.code,
        labelAr: m.labelAr,
        labelEn: m.labelEn,
        mode: m.mode,
        speed: m.speed,
        security: m.security,
        consolidation: m.consolidation,
        consolidationNote: m.consolidationNote,
        carrierLabel: m.carrierLabel,
        description: "",
        allowedClasses: [],
        etaMinDays: null,
        etaMaxDays: null,
        active: true,
        sortOrder: m.sortOrder,
      },
    };
  });
}

const customer = (weightKg: number | null, extra: Partial<QuoteCoreInput> = {}): QuoteCoreInput => ({
  weightKg,
  audience: "CUSTOMER",
  ...extra,
});
const forCountry = (rates: EngineRate[], code: string) =>
  rates.filter((r) => r.countryCode === code);

// ---------------------------------------------------------------- 1. parity
const legacy = buildLegacyCatalog();
const legacyRates = toEngineRates(legacy.methods, legacy.rates);
const WEIGHTS = [1, 5, 10, 11, 15, 20, 21, 40, 100];
const floorChanges: string[] = [];

let mark = passed;
for (const zone of INTERNATIONAL_ZONES) {
  for (const country of zone.countries) {
    for (const w of WEIGHTS) {
      const old = resolveAvailableMethods(country.code, w);
      const next = quoteFromRates(forCountry(legacyRates, country.code), customer(w));
      check(
        old.length === next.methods.length,
        `${country.code} ${w}kg: method count ${old.length} vs ${next.methods.length}`
      );
      for (const o of old) {
        const n = next.methods.find((m) => m.methodCode === o.code);
        check(!!n, `${country.code} ${w}kg: ${o.code} missing in new engine`);
        if (!n) continue;
        check(Math.abs(n.price.total - o.amount) <= 0.01, `${o.code} ${country.code} ${w}kg total ${n.price.total} vs ${o.amount}`);
        check(n.price.currency === o.currency, `${o.code} ${w}kg currency ${n.price.currency} vs ${o.currency}`);
        check(
          (n.price.alt?.currency ?? null) === (o.alternate?.currency ?? null) &&
            Math.abs((n.price.alt?.amount ?? 0) - (o.alternate?.amount ?? 0)) <= 0.01,
          `${o.code} ${country.code} ${w}kg alternate leg`
        );
        check(n.labelAr === o.labelAr && n.labelEn === o.labelEn, `${o.code} label`);
      }
      if (old.length === 0) {
        // The one intentional change: an empty list becomes the inquiry card.
        check(next.inquiry && next.inquiryReason === "BELOW_TIER_FLOOR", `${country.code} ${w}kg floor -> inquiry`);
        floorChanges.push(`${country.code}@${w}kg`);
      } else {
        check(!next.inquiry, `${country.code} ${w}kg: no inquiry card when all methods price`);
      }
    }
  }
}
section("legacy parity — international zones x land/air x 9 weights", mark);

mark = passed;
for (const gov of SYRIA_GOVERNORATES) {
  const old = resolveAvailableMethods(gov.code, 20);
  const next = quoteFromRates(forCountry(legacyRates, gov.code), customer(20));
  check(old.length === next.methods.length, `${gov.code}: carrier count`);
  old.forEach((o, i) => {
    const n = next.methods[i];
    check(n?.methodCode === o.code, `${gov.code}: order/code ${n?.methodCode} vs ${o.code}`);
    check(n?.price.total === o.amount && n?.price.currency === "USD", `${gov.code} ${o.code} amount`);
    check(n?.labelAr === o.labelAr, `${gov.code} ${o.code} label`);
  });
  // Flat domestic rates price with an unknown weight too.
  check(
    quoteFromRates(forCountry(legacyRates, gov.code), customer(null)).methods.length === old.length,
    `${gov.code}: flat rates price without a weight`
  );
}
section("legacy parity — domestic governorates x carriers", mark);
console.log(
  `      intentional change (empty list -> inquiry card): ${[...new Set(floorChanges.map((f) => f.split("@")[1]))].join(", ")} for ${new Set(floorChanges.map((f) => f.split("@")[0])).size} countries (germany package)`
);

// ------------------------------------------------------------ 2. notebook
const seedFile = JSON.parse(
  fs.readFileSync(path.join(__dirname, "..", "docs", "shipping", "shipping-rates-seed.json"), "utf8")
) as NotebookSeedFile;
const notebook = buildNotebookCatalog(seedFile);
const notebookUnverified = toEngineRates(notebook.methods, notebook.rates);
const notebookVerified = toEngineRates(notebook.methods, notebook.rates, true);

mark = passed;
check(notebook.rates.length === 7, "exactly 7 notebook rates");
const GOLDEN: [string, string, number, string][] = [
  ["LB", "LAND_PASSENGER_CAR", 20, "شحن بري مع سيارة ركاب"],
  ["JO", "LAND_SLOW_MASRI", 30, "شحن بري بطيء مع شركة المصري"],
  ["JO", "LAND_FAST_PASSENGER_BUS", 70, "شحن بري سريع مع باص ركاب"],
  ["JO", "LAND_FAST_SECURE_PRIVATE_CAR", 100, "شحن بري سريع عالي الأمان مع سيارة خاصة"],
  ["SA", "LAND_SLOW_CONSOLIDATED_RAQI", 50, "شحن بري بطيء وتجميع شركة الراقي"],
  ["SA", "LAND_FAST_PASSENGER_CAR", 100, "شحن بري سريع مع سيارة ركاب"],
  ["AE", "SHARJAH_REP", 60, "شحن مع مندوب الشارقة"],
];
for (const [country, code, usd, label] of GOLDEN) {
  for (const w of [1, 20, 50]) {
    const q = quoteFromRates(forCountry(notebookVerified, country), customer(w));
    const m = q.methods.find((x) => x.methodCode === code);
    check(m?.price.total === usd && m?.price.currency === "USD", `${country} ${code} = $${usd} flat at ${w}kg`);
    check(m?.labelAr === label, `${country} ${code} label`);
  }
  const trader = quoteFromRates(forCountry(notebookVerified, country), { weightKg: 20, audience: "TRADER" });
  check(trader.methods.find((x) => x.methodCode === code)?.price.total === usd, `${country} ${code}: trader pays the same`);
}
const raqi = quoteFromRates(forCountry(notebookVerified, "SA"), customer(20)).methods.find(
  (m) => m.methodCode === "LAND_SLOW_CONSOLIDATED_RAQI"
);
check(raqi?.consolidation === true && !!raqi.note, "SA Raqi is flagged consolidation with a note");
check(
  quoteFromRates(forCountry(notebookVerified, "JO"), customer(20)).methods.every((m) => !m.consolidation),
  "JO methods are not consolidation"
);
section("golden — the 7 notebook rates", mark);

mark = passed;
for (const country of ["LB", "JO", "SA", "AE"]) {
  const q = quoteFromRates(forCountry(notebookUnverified, country), customer(20));
  check(q.methods.length === 0 && q.inquiry, `${country}: unverified notebook rates are never public`);
  const preview = quoteFromRates(forCountry(notebookUnverified, country), customer(20, { includeUnverified: true }));
  check(preview.methods.length > 0 && preview.methods.every((m) => m.unverified), `${country}: admin preview shows them, labelled`);
}
// AE: legacy air stays live next to the unverified notebook row.
const ae = quoteFromRates(
  [...forCountry(legacyRates, "AE"), ...forCountry(notebookUnverified, "AE")],
  customer(20)
);
check(ae.methods.length === 1 && ae.methods[0]!.methodCode === "intl:uae:air", "AE public: legacy air only while Sharjah is unverified");
check(ae.methods[0]!.price.total === 150 && ae.methods[0]!.price.currency === "AED", "AE air 20kg = 150 AED");
const aeBoth = quoteFromRates(
  [...forCountry(legacyRates, "AE"), ...forCountry(notebookVerified, "AE")],
  customer(20)
);
check(aeBoth.methods.length === 2, "AE after verify: air per kg and Sharjah $60 side by side");
section("visibility — unverified rates hidden; AE mixed bases", mark);

mark = passed;
const heavy = quoteFromRates(forCountry(notebookVerified, "LB"), customer(51));
check(heavy.methods.length === 0 && heavy.inquiryReason === "MAX_WEIGHT", "51kg over the 50kg cap -> inquiry, no price");
check(quoteFromRates(forCountry(notebookVerified, "LB"), customer(50)).methods.length === 1, "exactly 50kg still prices");
check(quoteFromRates(forCountry(notebookVerified, "LB"), customer(null)).methods.length === 1, "flat rate prices with unknown weight");
const none = quoteFromRates([], customer(20));
check(none.inquiry && none.inquiryReason === "NO_METHOD", "country with no method -> inquiry card");
const de5 = quoteFromRates(forCountry(legacyRates, "DE"), customer(5));
check(de5.methods.length === 0 && de5.inquiryReason === "BELOW_TIER_FLOOR", "DE 5kg -> inquiry (below the 11kg floor)");
section("guards — max weight, unknown weight, no method, tier floor", mark);

// --------------------------------------------------------- 3. each basis
mark = passed;
const base = notebookVerified[0]!;
const mk = (over: Partial<EngineRate>): EngineRate => ({ ...base, id: "t", ...over });
const one = (rate: EngineRate, input: QuoteCoreInput, config: EngineConfig = DEFAULT_ENGINE_CONFIG) =>
  quoteFromRates([rate], input, config);

check(one(mk({ basis: "PER_KG", amount: 3, maxWeightKg: null }), customer(7)).methods[0]?.price.total === 21, "PER_KG 3/kg x 7 = 21");
check(
  one(mk({ basis: "PER_KG", amount: 0, firstKgAmount: 10, additionalKgAmount: 2, maxWeightKg: null }), customer(6)).methods[0]?.price.total === 20,
  "first kg 10 + 5 x 2 = 20"
);
check(one(mk({ basis: "PER_KG", amount: 3, maxWeightKg: null }), customer(null)).inquiryReason === "WEIGHT_REQUIRED", "PER_KG without weight -> inquiry");
const parcelTiers = mk({
  basis: "TIERED_PER_PARCEL",
  maxWeightKg: null,
  tiers: [
    { minKg: 0, maxKg: 10, amount: 15 },
    { minKg: 10.01, maxKg: null, amount: 40 },
  ],
});
check(one(parcelTiers, customer(8)).methods[0]?.price.total === 15, "TIERED_PER_PARCEL band 1");
check(one(parcelTiers, customer(30)).methods[0]?.price.total === 40, "TIERED_PER_PARCEL band 2");
check(one(mk({ basis: "PER_KG", amount: 1, minCharge: 25, maxWeightKg: null }), customer(4)).methods[0]?.price.total === 25, "min charge applies");
check(one(mk({ handlingFee: 5 }), customer(10)).methods[0]?.price.total === 25, "handling fee adds to the flat price");
check(
  one(mk({ basis: "PER_KG", amount: 2, minChargeableWeightKg: 11, maxWeightKg: null }), customer(4)).methods[0]?.price.total === 22,
  "minimum chargeable weight"
);
const free = one(mk({ freeShippingOver: 500 }), customer(10, { declaredValue: 600 }));
check(free.methods[0]?.price.total === 0 && free.methods[0]?.price.discount === 20, "free shipping over threshold");
check(one(mk({ freeShippingOver: 500 }), customer(10, { declaredValue: 499 })).methods[0]?.price.total === 20, "below threshold pays");
const insured = one(mk({}), customer(10, { declaredValue: 1000 }), { ...DEFAULT_ENGINE_CONFIG, insuranceEnabled: true, insurancePercent: 2 });
check(insured.methods[0]?.price.insurance === 20 && insured.methods[0]?.price.total === 40, "insurance 2% when enabled");
check(one(mk({}), customer(10, { declaredValue: 1000 })).methods[0]?.price.insurance === 0, "insurance invisible while disabled");
check(
  one(mk({ basis: "PER_KG", amount: 3.333, maxWeightKg: null }), customer(3), { ...DEFAULT_ENGINE_CONFIG, roundingRule: "ceil_unit" }).methods[0]?.price.total === 10,
  "rounding: ceil to unit"
);
check(
  one(mk({ basis: "PER_KG", amount: 2, maxWeightKg: null }), customer(10), { ...DEFAULT_ENGINE_CONFIG, packagingKg: 1.5 }).methods[0]?.price.total === 23,
  "packaging weight only when configured"
);
check(
  one(mk({ basis: "PER_KG", amount: 2, maxWeightKg: null }), customer(10, { volumeCm3: 100000 }), { ...DEFAULT_ENGINE_CONFIG, volumetricDivisor: 5000 }).methods[0]?.price.total === 40,
  "volumetric weight only when a divisor is set"
);
check(one(mk({ audience: "TRADER" }), customer(10)).methods.length === 0, "trader-only rate hidden from customers");
check(one(mk({ active: false }), customer(10)).methods.length === 0, "inactive rate hidden");
check(one(mk({ validTo: new Date(Date.now() - 86_400_000) }), customer(10)).methods.length === 0, "expired rate hidden");
check(one(mk({ validFrom: new Date(Date.now() + 86_400_000) }), customer(10)).methods.length === 0, "future rate hidden");
const restricted = one(
  mk({ method: { ...base.method, allowedClasses: ["instrument"], description: "لا يُقبل شحن السوائل بهذه الطريقة" } }),
  customer(10, { classes: ["oil"] })
);
check(
  restricted.methods.length === 0 && restricted.restricted[0]?.reason === "لا يُقبل شحن السوائل بهذه الطريقة",
  "restricted class hides the method and carries the admin's reason"
);
section("each basis + modifiers + visibility rules", mark);

console.log(`\nShipping engine checks: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
