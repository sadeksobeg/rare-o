/**
 * Shipping admin — data layer. Every mutation takes the acting admin and
 * writes ShippingRateHistory (rates) so any change can be reverted in one
 * click. Authorization, rate limiting and the audit log live in the server
 * actions (app/shipping-admin-actions.ts); nothing here is callable from a
 * client without going through them.
 */
import { Prisma, type PrismaClient } from "@prisma/client";
import { prisma as defaultPrisma } from "@/lib/db/prisma";
import {
  CSV_COLUMNS,
  parseRateCsv,
  sanitizeText,
  toCsv,
  validateRateInput,
  type RateInput,
  type RateIssue,
} from "@/lib/shipping/admin-validate";
import { normalizeDestinationCode } from "@/lib/shipping/engine";

type Db = PrismaClient;
type RateRow = Prisma.ShippingRateGetPayload<object>;

export type ServiceResult<T = undefined> =
  | { ok: true; data: T }
  | { ok: false; error: string; issues?: RateIssue[] };

const ok = <T>(data: T): ServiceResult<T> => ({ ok: true, data });
const fail = (error: string, issues?: RateIssue[]): ServiceResult<never> => ({ ok: false, error, issues });

/** Plain-JSON image of a rate row — what history stores and revert restores. */
export function snapshotRate(row: RateRow): Prisma.InputJsonObject {
  const n = (v: Prisma.Decimal | null) => (v == null ? null : Number(v));
  return {
    countryCode: row.countryCode,
    methodId: row.methodId,
    basis: row.basis,
    amount: Number(row.amount),
    currency: row.currency,
    tiers: (row.tiers ?? null) as Prisma.InputJsonValue,
    firstKgAmount: n(row.firstKgAmount),
    additionalKgAmount: n(row.additionalKgAmount),
    minCharge: n(row.minCharge),
    maxWeightKg: n(row.maxWeightKg),
    minChargeableWeightKg: n(row.minChargeableWeightKg),
    handlingFee: n(row.handlingFee),
    freeShippingOver: n(row.freeShippingOver),
    audience: row.audience,
    validFrom: row.validFrom?.toISOString() ?? null,
    validTo: row.validTo?.toISOString() ?? null,
    active: row.active,
    verified: row.verified,
    packageLabel: row.packageLabel,
    note: row.note,
  };
}

function rateData(input: RateInput) {
  return {
    basis: input.basis,
    amount: input.amount,
    currency: input.currency,
    tiers: input.tiers ? (input.tiers as unknown as Prisma.InputJsonValue) : Prisma.JsonNull,
    firstKgAmount: input.firstKgAmount,
    additionalKgAmount: input.additionalKgAmount,
    minCharge: input.minCharge,
    maxWeightKg: input.maxWeightKg,
    minChargeableWeightKg: input.minChargeableWeightKg,
    handlingFee: input.handlingFee,
    freeShippingOver: input.freeShippingOver,
    audience: input.audience,
    validFrom: input.validFrom ? new Date(input.validFrom) : null,
    validTo: input.validTo ? new Date(input.validTo) : null,
    active: input.active,
    packageLabel: input.packageLabel,
    note: sanitizeText(input.note),
  };
}

async function writeHistory(
  db: Db | Prisma.TransactionClient,
  rateId: string,
  action: string,
  before: Prisma.InputJsonObject | null,
  after: Prisma.InputJsonObject | null,
  actor: string
) {
  await db.shippingRateHistory.create({
    data: {
      rateId,
      action,
      before: before ?? undefined,
      after: after ?? undefined,
      actor,
    },
  });
}

const isUniqueViolation = (e: unknown) =>
  typeof e === "object" && e !== null && (e as { code?: string }).code === "P2002";

// ------------------------------------------------------------------ rates

export async function saveRate(
  input: RateInput & { id?: string },
  actor: string,
  db: Db = defaultPrisma
): Promise<ServiceResult<{ id: string; created: boolean }>> {
  const normalized: RateInput = {
    ...input,
    countryCode: normalizeDestinationCode(input.countryCode),
  };
  const issues = validateRateInput(normalized);
  if (issues.length) return fail("VALIDATION", issues);

  const [country, method] = await Promise.all([
    db.shippingCountry.findUnique({ where: { code: normalized.countryCode }, select: { code: true } }),
    db.shippingMethod.findUnique({ where: { id: normalized.methodId }, select: { id: true } }),
  ]);
  if (!country) return fail("COUNTRY_NOT_FOUND");
  if (!method) return fail("METHOD_NOT_FOUND");

  const now = new Date();
  try {
    if (input.id) {
      const before = await db.shippingRate.findUnique({ where: { id: input.id } });
      if (!before) return fail("NOT_FOUND");
      const becameVerified = normalized.verified && !before.verified;
      const after = await db.$transaction(async (tx) => {
        const row = await tx.shippingRate.update({
          where: { id: input.id },
          data: {
            ...rateData(normalized),
            verified: normalized.verified,
            verifiedAt: normalized.verified ? (becameVerified ? now : before.verifiedAt) : null,
            verifiedBy: normalized.verified ? (becameVerified ? actor : before.verifiedBy) : null,
            needsConfirmNote: normalized.verified ? null : before.needsConfirmNote,
          },
        });
        await writeHistory(tx, row.id, "update", snapshotRate(before), snapshotRate(row), actor);
        return row;
      });
      return ok({ id: after.id, created: false });
    }
    const created = await db.$transaction(async (tx) => {
      const row = await tx.shippingRate.create({
        data: {
          countryCode: normalized.countryCode,
          methodId: normalized.methodId,
          ...rateData(normalized),
          verified: normalized.verified,
          verifiedAt: normalized.verified ? now : null,
          verifiedBy: normalized.verified ? actor : null,
          source: "ADMIN",
        },
      });
      await writeHistory(tx, row.id, "create", null, snapshotRate(row), actor);
      return row;
    });
    return ok({ id: created.id, created: true });
  } catch (e) {
    if (isUniqueViolation(e)) return fail("DUPLICATE");
    throw e;
  }
}

export async function setRatesVerified(
  ids: string[],
  verified: boolean,
  actor: string,
  db: Db = defaultPrisma
): Promise<ServiceResult<{ changed: number }>> {
  const rows = await db.shippingRate.findMany({ where: { id: { in: ids }, verified: !verified } });
  const now = new Date();
  await db.$transaction(async (tx) => {
    for (const before of rows) {
      const row = await tx.shippingRate.update({
        where: { id: before.id },
        data: {
          verified,
          verifiedAt: verified ? now : null,
          verifiedBy: verified ? actor : null,
          needsConfirmNote: verified ? null : before.needsConfirmNote,
        },
      });
      await writeHistory(tx, row.id, verified ? "verify" : "unverify", snapshotRate(before), snapshotRate(row), actor);
    }
  });
  return ok({ changed: rows.length });
}

export async function setRatesActive(
  ids: string[],
  active: boolean,
  actor: string,
  db: Db = defaultPrisma
): Promise<ServiceResult<{ changed: number }>> {
  const rows = await db.shippingRate.findMany({ where: { id: { in: ids }, active: !active } });
  await db.$transaction(async (tx) => {
    for (const before of rows) {
      const row = await tx.shippingRate.update({ where: { id: before.id }, data: { active } });
      await writeHistory(tx, row.id, active ? "activate" : "deactivate", snapshotRate(before), snapshotRate(row), actor);
    }
  });
  return ok({ changed: rows.length });
}

/** Bulk price change: percent (e.g. +10 / -5) or a fixed delta, never below zero. */
export async function bulkAdjustRates(
  ids: string[],
  change: { kind: "percent" | "fixed"; value: number },
  actor: string,
  db: Db = defaultPrisma
): Promise<ServiceResult<{ changed: number }>> {
  if (!Number.isFinite(change.value) || Math.abs(change.value) > 100_000) return fail("VALIDATION");
  if (change.kind === "percent" && change.value <= -100) return fail("VALIDATION");
  const apply = (n: number) =>
    Math.max(0, Math.round((change.kind === "percent" ? n * (1 + change.value / 100) : n + change.value) * 100) / 100);

  const rows = await db.shippingRate.findMany({ where: { id: { in: ids } } });
  await db.$transaction(async (tx) => {
    for (const before of rows) {
      const tiers = Array.isArray(before.tiers)
        ? (before.tiers as unknown as { perKg?: Record<string, number | null>; amount?: number }[]).map((t) => ({
            ...t,
            ...(t.perKg
              ? { perKg: Object.fromEntries(Object.entries(t.perKg).map(([c, v]) => [c, v == null ? null : apply(Number(v))])) }
              : {}),
            ...(t.amount != null ? { amount: apply(Number(t.amount)) } : {}),
          }))
        : null;
      const row = await tx.shippingRate.update({
        where: { id: before.id },
        data: {
          amount: apply(Number(before.amount)),
          firstKgAmount: before.firstKgAmount == null ? null : apply(Number(before.firstKgAmount)),
          additionalKgAmount: before.additionalKgAmount == null ? null : apply(Number(before.additionalKgAmount)),
          ...(tiers ? { tiers: tiers as unknown as Prisma.InputJsonValue } : {}),
        },
      });
      await writeHistory(tx, row.id, "bulk_adjust", snapshotRate(before), snapshotRate(row), actor);
    }
  });
  return ok({ changed: rows.length });
}

/** Copies one rate to other countries (same method). Copies start unverified. */
export async function copyRateToCountries(
  rateId: string,
  countryCodes: string[],
  actor: string,
  db: Db = defaultPrisma
): Promise<ServiceResult<{ created: number; skipped: string[] }>> {
  const source = await db.shippingRate.findUnique({ where: { id: rateId } });
  if (!source) return fail("NOT_FOUND");
  const codes = [...new Set(countryCodes.map(normalizeDestinationCode))].filter((c) => c !== source.countryCode);
  const known = new Set(
    (await db.shippingCountry.findMany({ where: { code: { in: codes } }, select: { code: true } })).map((c) => c.code)
  );
  const skipped: string[] = [];
  let created = 0;
  for (const code of codes) {
    if (!known.has(code)) {
      skipped.push(code);
      continue;
    }
    const exists = await db.shippingRate.findFirst({
      where: { countryCode: code, methodId: source.methodId, basis: source.basis },
      select: { id: true },
    });
    if (exists) {
      skipped.push(code);
      continue;
    }
    const { id: _id, createdAt: _c, updatedAt: _u, verifiedAt: _va, verifiedBy: _vb, ...rest } = source;
    void _id; void _c; void _u; void _va; void _vb;
    const row = await db.shippingRate.create({
      data: {
        ...rest,
        tiers: (rest.tiers ?? undefined) as Prisma.InputJsonValue | undefined,
        altAmounts: (rest.altAmounts ?? undefined) as Prisma.InputJsonValue | undefined,
        countryCode: code,
        verified: false,
        source: "ADMIN",
        needsConfirmNote: null,
      },
    });
    await writeHistory(db, row.id, "copy", null, snapshotRate(row), actor);
    created += 1;
  }
  return ok({ created, skipped });
}

async function rateUsedByOrders(row: RateRow, methodCode: string, db: Db): Promise<boolean> {
  const snapshotMatch = { path: ["method", "rateId"], equals: row.id };
  const [retailByCode, retail, wholesale, brokerage, shipments] = await Promise.all([
    db.retailRequest.count({ where: { shippingMethodCode: methodCode, destinationCode: { equals: row.countryCode, mode: "insensitive" } } }),
    db.retailRequest.count({ where: { shippingQuoteSnapshot: snapshotMatch } }),
    db.wholesaleRequest.count({ where: { shippingQuoteSnapshot: snapshotMatch } }),
    db.brokerageRequest.count({ where: { shippingQuoteSnapshot: snapshotMatch } }),
    db.shipment.count({ where: { methodCode, destCountry: { equals: row.countryCode, mode: "insensitive" } } }),
  ]);
  return retailByCode + retail + wholesale + brokerage + shipments > 0;
}

/**
 * Soft delete by default (deactivate — keeps history and old orders
 * resolvable). Hard delete only when asked AND no order ever used the rate.
 */
export async function deleteRate(
  id: string,
  opts: { hard: boolean },
  actor: string,
  db: Db = defaultPrisma
): Promise<ServiceResult<{ mode: "soft" | "hard" }>> {
  const row = await db.shippingRate.findUnique({ where: { id }, include: { method: { select: { code: true } } } });
  if (!row) return fail("NOT_FOUND");
  if (!opts.hard) {
    await setRatesActive([id], false, actor, db);
    return ok({ mode: "soft" });
  }
  if (await rateUsedByOrders(row, row.method.code, db)) return fail("IN_USE");
  await db.shippingRate.delete({ where: { id } });
  return ok({ mode: "hard" });
}

export async function listRateHistory(rateId: string, db: Db = defaultPrisma) {
  return db.shippingRateHistory.findMany({ where: { rateId }, orderBy: { at: "desc" }, take: 30 });
}

/** One-click revert: restores the `before` image of a history entry. */
export async function revertRate(
  historyId: string,
  actor: string,
  db: Db = defaultPrisma
): Promise<ServiceResult<{ rateId: string }>> {
  const entry = await db.shippingRateHistory.findUnique({ where: { id: historyId } });
  if (!entry) return fail("NOT_FOUND");
  if (!entry.before || typeof entry.before !== "object") return fail("NOTHING_TO_REVERT");
  const target = entry.before as unknown as RateInput & { verified: boolean };
  const current = await db.shippingRate.findUnique({ where: { id: entry.rateId } });
  if (!current) return fail("NOT_FOUND");
  try {
    await db.$transaction(async (tx) => {
      const row = await tx.shippingRate.update({
        where: { id: entry.rateId },
        data: {
          ...rateData({ ...target, note: target.note ?? "" }),
          verified: target.verified,
          verifiedAt: target.verified ? (current.verifiedAt ?? new Date()) : null,
          verifiedBy: target.verified ? (current.verifiedBy ?? actor) : null,
        },
      });
      await writeHistory(tx, row.id, "revert", snapshotRate(current), snapshotRate(row), actor);
    });
  } catch (e) {
    if (isUniqueViolation(e)) return fail("DUPLICATE");
    throw e;
  }
  return ok({ rateId: entry.rateId });
}

// -------------------------------------------------------------- warnings

export type RateWarning = { rateId: string; code: "ZERO_AMOUNT" | "DUPLICATE" | "UNVERIFIED" | "EXPIRED" | "NO_MAX_WEIGHT_FLAT" };

export function computeRateWarnings(
  rates: { id: string; countryCode: string; methodId: string; basis: string; amount: number; verified: boolean; active: boolean; validTo: Date | null; maxWeightKg: number | null; tiers: unknown }[]
): RateWarning[] {
  const out: RateWarning[] = [];
  const seen = new Map<string, string>();
  const now = Date.now();
  for (const r of rates) {
    if (!r.active) continue;
    const tiered = r.basis.startsWith("TIERED");
    if (!tiered && r.amount === 0) out.push({ rateId: r.id, code: "ZERO_AMOUNT" });
    if (!r.verified) out.push({ rateId: r.id, code: "UNVERIFIED" });
    if (r.validTo && r.validTo.getTime() < now) out.push({ rateId: r.id, code: "EXPIRED" });
    const key = `${r.countryCode}|${r.methodId}`;
    const first = seen.get(key);
    if (first) {
      out.push({ rateId: r.id, code: "DUPLICATE" });
      if (!out.some((w) => w.rateId === first && w.code === "DUPLICATE")) out.push({ rateId: first, code: "DUPLICATE" });
    } else seen.set(key, r.id);
  }
  return out;
}

// ------------------------------------------------------------- countries

export async function saveCountry(
  input: { code: string; nameAr: string; nameEn: string; region: string; active: boolean; inquiryEnabled: boolean; note: string; sortOrder?: number; create?: boolean },
  db: Db = defaultPrisma
): Promise<ServiceResult<{ code: string }>> {
  const code = normalizeDestinationCode(input.code);
  if (!/^[A-Za-z][A-Za-z0-9-]{1,23}$/.test(code)) return fail("VALIDATION");
  const nameAr = sanitizeText(input.nameAr);
  if (!nameAr) return fail("VALIDATION");
  const data = {
    nameAr,
    nameEn: sanitizeText(input.nameEn),
    region: sanitizeText(input.region) || "other",
    active: input.active,
    inquiryEnabled: input.inquiryEnabled,
    note: sanitizeText(input.note),
    ...(input.sortOrder != null ? { sortOrder: input.sortOrder } : {}),
  };
  const existing = await db.shippingCountry.findUnique({ where: { code }, select: { code: true } });
  if (input.create) {
    if (existing) return fail("DUPLICATE");
    await db.shippingCountry.create({ data: { code, ...data } });
  } else {
    if (!existing) return fail("NOT_FOUND");
    await db.shippingCountry.update({ where: { code }, data });
  }
  return ok({ code });
}

/** Hard delete only for a country no rate, order or shipment references. */
export async function deleteCountry(code: string, db: Db = defaultPrisma): Promise<ServiceResult<{ mode: "soft" | "hard" }>> {
  const row = await db.shippingCountry.findUnique({ where: { code }, include: { _count: { select: { rates: true } } } });
  if (!row) return fail("NOT_FOUND");
  const used =
    row._count.rates +
    (await db.retailRequest.count({ where: { destinationCode: { equals: code, mode: "insensitive" } } })) +
    (await db.shipment.count({ where: { destCountry: { equals: code, mode: "insensitive" } } }));
  if (used > 0) {
    await db.shippingCountry.update({ where: { code }, data: { active: false } });
    return ok({ mode: "soft" });
  }
  await db.shippingCountry.delete({ where: { code } });
  return ok({ mode: "hard" });
}

// --------------------------------------------------------------- methods

export type MethodInput = {
  id?: string;
  code: string;
  labelAr: string;
  labelEn: string;
  mode: string;
  speed: string | null;
  security: string | null;
  consolidation: boolean;
  consolidationNote: string;
  carrierLabel: string;
  trackingUrlTemplate: string | null;
  etaMinDays: number | null;
  etaMaxDays: number | null;
  description: string;
  allowedClasses: string[];
  active: boolean;
  sortOrder: number;
};

export async function saveMethod(input: MethodInput, db: Db = defaultPrisma): Promise<ServiceResult<{ id: string }>> {
  const code = input.code.trim();
  if (!/^[A-Za-z0-9:_-]{2,64}$/.test(code)) return fail("VALIDATION", [{ field: "code", code: "INVALID" }]);
  const labelAr = sanitizeText(input.labelAr);
  if (!labelAr) return fail("VALIDATION", [{ field: "labelAr", code: "REQUIRED" }]);
  const tracking = input.trackingUrlTemplate?.trim() || null;
  if (tracking && !/^https:\/\/[^\s<>"']+$/.test(tracking)) return fail("VALIDATION", [{ field: "trackingUrlTemplate", code: "INVALID" }]);
  const eta = (n: number | null) => (n != null && Number.isInteger(n) && n >= 0 && n <= 365 ? n : null);
  const data = {
    labelAr,
    labelEn: sanitizeText(input.labelEn),
    mode: input.mode,
    speed: input.speed || null,
    security: input.security || null,
    consolidation: input.consolidation,
    consolidationNote: sanitizeText(input.consolidationNote),
    carrierLabel: sanitizeText(input.carrierLabel),
    trackingUrlTemplate: tracking,
    etaMinDays: eta(input.etaMinDays),
    etaMaxDays: eta(input.etaMaxDays),
    description: sanitizeText(input.description),
    allowedClasses: input.allowedClasses.map((c) => sanitizeText(c)).filter(Boolean).slice(0, 12),
    active: input.active,
    sortOrder: Number.isInteger(input.sortOrder) ? input.sortOrder : 0,
  };
  try {
    if (input.id) {
      // The code of an existing method is immutable — old orders reference it.
      const row = await db.shippingMethod.update({ where: { id: input.id }, data });
      return ok({ id: row.id });
    }
    const row = await db.shippingMethod.create({ data: { code, source: "ADMIN", ...data } });
    return ok({ id: row.id });
  } catch (e) {
    if (isUniqueViolation(e)) return fail("DUPLICATE");
    throw e;
  }
}

export async function deleteMethod(id: string, db: Db = defaultPrisma): Promise<ServiceResult<{ mode: "soft" | "hard" }>> {
  const row = await db.shippingMethod.findUnique({ where: { id }, include: { _count: { select: { rates: true } } } });
  if (!row) return fail("NOT_FOUND");
  const used =
    row._count.rates +
    (await db.retailRequest.count({ where: { shippingMethodCode: row.code } })) +
    (await db.shipment.count({ where: { methodCode: row.code } }));
  if (used > 0) {
    await db.shippingMethod.update({ where: { id }, data: { active: false } });
    return ok({ mode: "soft" });
  }
  await db.shippingMethod.delete({ where: { id } });
  return ok({ mode: "hard" });
}

// ---------------------------------------------------------------- config

export type ConfigInput = {
  roundingRule: string;
  volumetricDivisor: number | null;
  packagingKg: number;
  globalFreeShippingOver: number | null;
  insuranceEnabled: boolean;
  insurancePercent: number | null;
  whatsappOptInTextAr: string;
  whatsappOptInTextEn: string;
  inquiryNoteAr: string;
  inquiryNoteEn: string;
};

export async function saveConfig(input: ConfigInput, db: Db = defaultPrisma): Promise<ServiceResult> {
  if (!["legacy_2dp", "ceil_unit", "ceil_5", "none"].includes(input.roundingRule)) return fail("VALIDATION");
  const pos = (n: number | null, max: number) => n == null || (Number.isFinite(n) && n >= 0 && n <= max);
  if (!pos(input.volumetricDivisor, 100_000) || !pos(input.packagingKg, 100) || !pos(input.globalFreeShippingOver, 1_000_000) || !pos(input.insurancePercent, 100)) {
    return fail("VALIDATION");
  }
  if (input.insuranceEnabled && !(input.insurancePercent && input.insurancePercent > 0)) return fail("VALIDATION");
  const data = {
    roundingRule: input.roundingRule,
    volumetricDivisor: input.volumetricDivisor || null,
    packagingKg: input.packagingKg,
    globalFreeShippingOver: input.globalFreeShippingOver,
    insuranceEnabled: input.insuranceEnabled,
    insurancePercent: input.insurancePercent,
    whatsappOptInTextAr: sanitizeText(input.whatsappOptInTextAr),
    whatsappOptInTextEn: sanitizeText(input.whatsappOptInTextEn),
    inquiryNoteAr: sanitizeText(input.inquiryNoteAr),
    inquiryNoteEn: sanitizeText(input.inquiryNoteEn),
  };
  await db.shippingConfig.upsert({ where: { id: "default" }, create: { id: "default", ...data }, update: data });
  return ok(undefined);
}

// ------------------------------------------------------------- inquiries

export async function updateInquiry(
  input: { id: string; status: string; notes: string; assignee: string | null },
  db: Db = defaultPrisma
): Promise<ServiceResult> {
  if (!["NEW", "CONTACTED", "QUOTED", "CLOSED"].includes(input.status)) return fail("VALIDATION");
  const row = await db.shippingInquiry.findUnique({ where: { id: input.id }, select: { id: true } });
  if (!row) return fail("NOT_FOUND");
  await db.shippingInquiry.update({
    where: { id: input.id },
    data: { status: input.status, notes: sanitizeText(input.notes), assignee: input.assignee ? sanitizeText(input.assignee) : null },
  });
  return ok(undefined);
}

// ------------------------------------------------------------------- CSV

export async function exportRatesCsv(db: Db = defaultPrisma): Promise<string> {
  const rows = await db.shippingRate.findMany({
    include: { method: { select: { code: true } } },
    orderBy: [{ countryCode: "asc" }, { methodId: "asc" }],
  });
  return toCsv(
    rows.map((r) => {
      const snap = snapshotRate(r) as Record<string, unknown>;
      return {
        ...Object.fromEntries(CSV_COLUMNS.map((c) => [c, snap[c] ?? ""])),
        methodCode: r.method.code,
        tiers: r.tiers ? JSON.stringify(r.tiers) : "",
      };
    })
  );
}

export type CsvDiffRow = {
  line: number;
  key: string;
  action: "create" | "update" | "unchanged" | "error";
  changes: { field: string; from: unknown; to: unknown }[];
  error: string | null;
};

/**
 * Dry-run by default: returns the diff and writes nothing. With apply=true
 * the same diff is executed. New rows are always created unverified — an
 * import can change prices but can never make a rate public by itself.
 */
export async function importRatesCsv(
  text: string,
  opts: { apply: boolean },
  actor: string,
  db: Db = defaultPrisma
): Promise<ServiceResult<{ diff: CsvDiffRow[]; applied: boolean; counts: Record<CsvDiffRow["action"], number> }>> {
  if (text.length > 1_000_000) return fail("TOO_LARGE");
  const parsed = parseRateCsv(text);
  if (parsed.headerError) return fail(parsed.headerError);

  const methods = new Map((await db.shippingMethod.findMany({ select: { id: true, code: true } })).map((m) => [m.code, m.id]));
  const countries = new Set((await db.shippingCountry.findMany({ select: { code: true } })).map((c) => c.code));
  const diff: CsvDiffRow[] = [];
  const todo: { input: RateInput & { id?: string } }[] = [];
  const seenKeys = new Set<string>();

  for (const row of parsed.rows) {
    const key = `${row.countryCode} · ${row.methodCode}`;
    const err = (error: string) => diff.push({ line: row.line, key, action: "error", changes: [], error });
    if (row.error || !row.input) {
      err(row.error ?? "INVALID");
      continue;
    }
    const countryCode = normalizeDestinationCode(row.countryCode);
    const methodId = methods.get(row.methodCode);
    if (!countries.has(countryCode)) {
      err("COUNTRY_NOT_FOUND");
      continue;
    }
    if (!methodId) {
      err("METHOD_NOT_FOUND");
      continue;
    }
    const dedupe = `${countryCode}|${methodId}|${row.input.basis}`;
    if (seenKeys.has(dedupe)) {
      err("DUPLICATE_IN_FILE");
      continue;
    }
    seenKeys.add(dedupe);

    const existing = await db.shippingRate.findFirst({ where: { countryCode, methodId, basis: row.input.basis } });
    const input: RateInput = {
      ...row.input,
      countryCode,
      methodId,
      verified: existing?.verified ?? false,
      validFrom: existing?.validFrom?.toISOString() ?? null,
      validTo: existing?.validTo?.toISOString() ?? null,
      packageLabel: existing?.packageLabel ?? null,
    };
    const issues = validateRateInput(input);
    if (issues.length) {
      err(`VALIDATION:${issues.map((i) => `${i.field}=${i.code}`).join(",")}`);
      continue;
    }
    if (!existing) {
      diff.push({ line: row.line, key, action: "create", changes: [{ field: "amount", from: null, to: input.amount }], error: null });
      todo.push({ input });
      continue;
    }
    const before = snapshotRate(existing) as Record<string, unknown>;
    const after = { ...before, ...rateDataPlain(input) };
    const changes = Object.keys(after)
      .filter((f) => JSON.stringify(before[f] ?? null) !== JSON.stringify(after[f] ?? null))
      .map((f) => ({ field: f, from: before[f] ?? null, to: after[f] ?? null }));
    if (changes.length === 0) {
      diff.push({ line: row.line, key, action: "unchanged", changes: [], error: null });
    } else {
      diff.push({ line: row.line, key, action: "update", changes, error: null });
      todo.push({ input: { ...input, id: existing.id } });
    }
  }

  const counts = { create: 0, update: 0, unchanged: 0, error: 0 };
  for (const d of diff) counts[d.action] += 1;

  if (opts.apply) {
    if (counts.error > 0) return fail("HAS_ERRORS");
    for (const item of todo) {
      const res = await saveRate(item.input, actor, db);
      if (!res.ok) return fail(`APPLY_FAILED:${res.error}`);
    }
  }
  return ok({ diff, applied: opts.apply, counts });
}

function rateDataPlain(input: RateInput): Record<string, unknown> {
  return {
    basis: input.basis,
    amount: input.amount,
    currency: input.currency,
    tiers: input.tiers,
    firstKgAmount: input.firstKgAmount,
    additionalKgAmount: input.additionalKgAmount,
    minCharge: input.minCharge,
    maxWeightKg: input.maxWeightKg,
    minChargeableWeightKg: input.minChargeableWeightKg,
    handlingFee: input.handlingFee,
    freeShippingOver: input.freeShippingOver,
    audience: input.audience,
    active: input.active,
    note: input.note,
  };
}
