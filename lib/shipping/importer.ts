/**
 * Idempotent shipping catalog importer.
 *  - legacy code tables  -> verified, source=LEGACY (behaviour unchanged)
 *  - owner notebook      -> unverified, source=NOTEBOOK (hidden until verified)
 *  - every other ISO country -> a row with no rate (inquiry flow)
 * Create-if-missing only: a re-run never overwrites a row the admin edited.
 */
import type { PrismaClient } from "@prisma/client";
import {
  buildLegacyCatalog,
  buildNotebookCatalog,
  DOMESTIC_REGION,
  type NotebookSeedFile,
  type SeedCountry,
  type SeedMethod,
  type SeedRate,
} from "@/lib/shipping/catalog-seed";
import { ISO_COUNTRY_CODES, regionForCountry } from "@/lib/shipping/iso-countries";

export type ImportCounts = {
  countries: { created: number; existing: number };
  methods: { created: number; existing: number };
  rates: {
    legacyCreated: number;
    notebookCreated: number;
    existing: number;
  };
  configCreated: boolean;
};

function isoCountries(): SeedCountry[] {
  const ar = new Intl.DisplayNames(["ar"], { type: "region" });
  const en = new Intl.DisplayNames(["en"], { type: "region" });
  return ISO_COUNTRY_CODES.map((code) => ({
    code,
    nameAr: ar.of(code) ?? code,
    nameEn: en.of(code) ?? code,
    region: regionForCountry(code),
  }));
}

export async function importShippingCatalog(
  db: PrismaClient,
  notebook: NotebookSeedFile,
  opts: { dryRun?: boolean } = {}
): Promise<ImportCounts> {
  const dryRun = opts.dryRun === true;
  const legacy = buildLegacyCatalog();
  const nb = buildNotebookCatalog(notebook);

  // Seed names win over Intl names for countries the business already names.
  const countries = new Map<string, SeedCountry>();
  for (const c of isoCountries()) countries.set(c.code, c);
  for (const c of [...legacy.countries, ...nb.countries]) countries.set(c.code, c);

  const methods: SeedMethod[] = [...legacy.methods, ...nb.methods];
  const rates: SeedRate[] = [...legacy.rates, ...nb.rates];

  const counts: ImportCounts = {
    countries: { created: 0, existing: 0 },
    methods: { created: 0, existing: 0 },
    rates: { legacyCreated: 0, notebookCreated: 0, existing: 0 },
    configCreated: false,
  };

  const haveCountries = new Set(
    (await db.shippingCountry.findMany({ select: { code: true } })).map((c) => c.code)
  );
  let sort = 0;
  for (const c of countries.values()) {
    sort += 1;
    if (haveCountries.has(c.code)) {
      counts.countries.existing += 1;
      continue;
    }
    counts.countries.created += 1;
    if (!dryRun) {
      await db.shippingCountry.create({
        data: {
          code: c.code,
          nameAr: c.nameAr,
          nameEn: c.nameEn,
          region: c.region,
          // Syria itself is served through its governorates, not as a country row.
          inquiryEnabled: c.region !== DOMESTIC_REGION,
          sortOrder: sort,
        },
      });
    }
  }

  const methodIds = new Map(
    (await db.shippingMethod.findMany({ select: { id: true, code: true } })).map((m) => [m.code, m.id])
  );
  for (const m of methods) {
    if (methodIds.has(m.code)) {
      counts.methods.existing += 1;
      continue;
    }
    counts.methods.created += 1;
    if (!dryRun) {
      const row = await db.shippingMethod.create({
        data: {
          code: m.code,
          labelAr: m.labelAr,
          labelEn: m.labelEn,
          mode: m.mode,
          speed: m.speed,
          security: m.security,
          consolidation: m.consolidation,
          consolidationNote: m.consolidationNote,
          carrierLabel: m.carrierLabel,
          source: m.source,
          sortOrder: m.sortOrder,
        },
      });
      methodIds.set(m.code, row.id);
    }
  }

  for (const r of rates) {
    const methodId = methodIds.get(r.methodCode);
    const exists = methodId
      ? await db.shippingRate.findFirst({
          where: { countryCode: r.countryCode, methodId, source: r.source },
          select: { id: true },
        })
      : null;
    if (exists) {
      counts.rates.existing += 1;
      continue;
    }
    if (r.source === "LEGACY") counts.rates.legacyCreated += 1;
    else counts.rates.notebookCreated += 1;
    if (!dryRun && methodId) {
      const now = new Date();
      await db.shippingRate.create({
        data: {
          countryCode: r.countryCode,
          methodId,
          basis: r.basis,
          amount: r.amount,
          currency: r.currency,
          tiers: r.tiers ?? undefined,
          maxWeightKg: r.maxWeightKg,
          verified: r.verified,
          verifiedAt: r.verified ? now : null,
          verifiedBy: r.verified ? "import:legacy" : null,
          source: r.source,
          packageLabel: r.packageLabel,
          needsConfirmNote: r.verified ? null : "سعر من دفتر المالك — بانتظار الاعتماد",
        },
      });
    }
  }

  const config = await db.shippingConfig.findUnique({ where: { id: "default" } });
  if (!config) {
    counts.configCreated = true;
    if (!dryRun) await db.shippingConfig.create({ data: { id: "default" } });
  }

  return counts;
}
