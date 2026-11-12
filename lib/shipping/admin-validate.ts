/**
 * Pure validation + CSV helpers for the shipping admin. No DB — shared by the
 * server actions, the rate editor (instant feedback) and the tests.
 */
import type { RateBasis, RateTier } from "@/lib/shipping/engine-core";

export const RATE_BASES: RateBasis[] = [
  "PER_PARCEL",
  "PER_KG",
  "TIERED_PER_KG",
  "TIERED_PER_PARCEL",
];
export const RATE_AUDIENCES = ["BOTH", "CUSTOMER", "TRADER"] as const;
export const RATE_CURRENCIES = ["USD", "EUR", "AED", "SAR", "JOD", "TRY"] as const;
export const METHOD_MODES = ["LAND", "AIR", "SEA", "OTHER"] as const;
export const METHOD_SPEEDS = ["SLOW", "NORMAL", "FAST"] as const;
export const METHOD_SECURITY = ["NORMAL", "HIGH"] as const;
export const SHIPPING_CLASSES = ["instrument", "accessory", "oil", "wood", "other"] as const;

export type RateInput = {
  countryCode: string;
  methodId: string;
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
  audience: (typeof RATE_AUDIENCES)[number];
  validFrom: string | null;
  validTo: string | null;
  active: boolean;
  verified: boolean;
  packageLabel: string | null;
  note: string;
};

export type RateIssue = { field: string; code: string };

const isMoney = (n: unknown): n is number =>
  typeof n === "number" && Number.isFinite(n) && n >= 0 && n < 1_000_000;

export function validateRateInput(input: RateInput): RateIssue[] {
  const issues: RateIssue[] = [];
  const bad = (field: string, code: string) => issues.push({ field, code });

  if (!input.countryCode.trim()) bad("countryCode", "REQUIRED");
  if (!input.methodId.trim()) bad("methodId", "REQUIRED");
  if (!RATE_BASES.includes(input.basis)) bad("basis", "INVALID");
  if (!/^[A-Z]{3}$/.test(input.currency)) bad("currency", "INVALID");
  if (!RATE_AUDIENCES.includes(input.audience)) bad("audience", "INVALID");
  if (!isMoney(input.amount)) bad("amount", "INVALID");

  const optional: (keyof RateInput)[] = [
    "firstKgAmount",
    "additionalKgAmount",
    "minCharge",
    "maxWeightKg",
    "minChargeableWeightKg",
    "handlingFee",
    "freeShippingOver",
  ];
  for (const key of optional) {
    const v = input[key];
    if (v != null && !isMoney(v)) bad(key, "INVALID");
  }

  const tiered = input.basis === "TIERED_PER_KG" || input.basis === "TIERED_PER_PARCEL";
  if (tiered) {
    const tiers = input.tiers ?? [];
    if (tiers.length === 0) bad("tiers", "REQUIRED");
    const sorted = [...tiers].sort((a, b) => a.minKg - b.minKg);
    sorted.forEach((t, i) => {
      if (!Number.isFinite(t.minKg) || t.minKg < 0) bad("tiers", "MIN_INVALID");
      if (t.maxKg != null && t.maxKg < t.minKg) bad("tiers", "RANGE_INVERTED");
      const next = sorted[i + 1];
      if (next && (t.maxKg == null || next.minKg <= t.maxKg)) bad("tiers", "OVERLAP");
      if (input.basis === "TIERED_PER_KG") {
        const legs = Object.values(t.perKg ?? {}).filter((v) => v != null);
        if (legs.length === 0 || legs.some((v) => !isMoney(v) || v === 0)) bad("tiers", "PRICE_MISSING");
      } else if (!isMoney(t.amount) || t.amount === 0) {
        bad("tiers", "PRICE_MISSING");
      }
    });
  } else if (input.basis === "PER_KG") {
    const split = input.firstKgAmount != null || input.additionalKgAmount != null;
    if (split && (input.firstKgAmount == null || input.additionalKgAmount == null)) {
      bad("firstKgAmount", "BOTH_REQUIRED");
    }
    if (!split && input.amount === 0) bad("amount", "ZERO");
  } else if (input.amount === 0) {
    bad("amount", "ZERO");
  }

  if (input.validFrom && input.validTo && input.validFrom > input.validTo) {
    bad("validTo", "RANGE_INVERTED");
  }
  if (input.note.length > 500) bad("note", "TOO_LONG");
  return issues;
}

// ------------------------------------------------------------------- CSV

export const CSV_COLUMNS = [
  "countryCode",
  "methodCode",
  "basis",
  "amount",
  "currency",
  "firstKgAmount",
  "additionalKgAmount",
  "minCharge",
  "maxWeightKg",
  "minChargeableWeightKg",
  "handlingFee",
  "freeShippingOver",
  "audience",
  "active",
  "note",
  "tiers",
] as const;

/** Neutralise spreadsheet formulas and markup in free-text cells. */
export function sanitizeText(value: string): string {
  return value
    .replace(/[<>]/g, "")
    .replace(/^[\s=+\-@\t\r]+/, "")
    .trim()
    .slice(0, 500);
}

function csvCell(value: unknown): string {
  let s = value == null ? "" : String(value);
  // A cell a spreadsheet would evaluate is exported as text.
  if (/^[=+\-@\t\r]/.test(s) && Number.isNaN(Number(s))) s = `'${s}`;
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function toCsv(rows: Record<string, unknown>[]): string {
  const lines = [CSV_COLUMNS.join(",")];
  for (const row of rows) lines.push(CSV_COLUMNS.map((c) => csvCell(row[c])).join(","));
  return lines.join("\r\n") + "\r\n";
}

/** Minimal RFC 4180 parser (quoted cells, escaped quotes, CRLF). */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  const src = text.replace(/^﻿/, "");
  for (let i = 0; i < src.length; i++) {
    const ch = src[i]!;
    if (quoted) {
      if (ch === '"' && src[i + 1] === '"') {
        cell += '"';
        i += 1;
      } else if (ch === '"') quoted = false;
      else cell += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ",") {
      row.push(cell);
      cell = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && src[i + 1] === "\n") i += 1;
      row.push(cell);
      cell = "";
      if (row.some((c) => c.trim() !== "")) rows.push(row);
      row = [];
    } else cell += ch;
  }
  row.push(cell);
  if (row.some((c) => c.trim() !== "")) rows.push(row);
  return rows;
}

export type CsvRateRow = {
  line: number;
  countryCode: string;
  methodCode: string;
  input: Omit<RateInput, "methodId" | "verified" | "validFrom" | "validTo" | "packageLabel"> | null;
  error: string | null;
};

const numOrNull = (raw: string | undefined): number | null | "bad" => {
  const v = (raw ?? "").trim();
  if (v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : "bad";
};

export function parseRateCsv(text: string): { rows: CsvRateRow[]; headerError: string | null } {
  const table = parseCsv(text);
  if (table.length === 0) return { rows: [], headerError: "EMPTY" };
  const header = table[0]!.map((h) => h.trim());
  for (const required of ["countryCode", "methodCode", "basis", "amount"]) {
    if (!header.includes(required)) return { rows: [], headerError: `MISSING_COLUMN:${required}` };
  }
  const col = (r: string[], name: string) => r[header.indexOf(name)];

  const rows: CsvRateRow[] = table.slice(1, 2001).map((r, i) => {
    const line = i + 2;
    const countryRaw = (col(r, "countryCode") ?? "").trim();
    const methodCode = (col(r, "methodCode") ?? "").trim();
    const basis = (col(r, "basis") ?? "").trim().toUpperCase() as RateBasis;
    const fail = (error: string): CsvRateRow => ({ line, countryCode: countryRaw, methodCode, input: null, error });

    const nums: Record<string, number | null> = {};
    for (const key of [
      "amount",
      "firstKgAmount",
      "additionalKgAmount",
      "minCharge",
      "maxWeightKg",
      "minChargeableWeightKg",
      "handlingFee",
      "freeShippingOver",
    ]) {
      const parsed = numOrNull(col(r, key));
      if (parsed === "bad") return fail(`NOT_A_NUMBER:${key}`);
      nums[key] = parsed;
    }
    let tiers: RateTier[] | null = null;
    const tiersRaw = (col(r, "tiers") ?? "").trim();
    if (tiersRaw) {
      try {
        const parsed = JSON.parse(tiersRaw);
        if (!Array.isArray(parsed)) return fail("TIERS_NOT_ARRAY");
        tiers = parsed as RateTier[];
      } catch {
        return fail("TIERS_BAD_JSON");
      }
    }
    const activeRaw = (col(r, "active") ?? "true").trim().toLowerCase();
    const audience = ((col(r, "audience") ?? "").trim().toUpperCase() || "BOTH") as RateInput["audience"];
    return {
      line,
      countryCode: countryRaw,
      methodCode,
      error: null,
      input: {
        countryCode: countryRaw,
        basis,
        amount: nums.amount ?? 0,
        currency: ((col(r, "currency") ?? "").trim().toUpperCase() || "USD"),
        tiers,
        firstKgAmount: nums.firstKgAmount ?? null,
        additionalKgAmount: nums.additionalKgAmount ?? null,
        minCharge: nums.minCharge ?? null,
        maxWeightKg: nums.maxWeightKg ?? null,
        minChargeableWeightKg: nums.minChargeableWeightKg ?? null,
        handlingFee: nums.handlingFee ?? null,
        freeShippingOver: nums.freeShippingOver ?? null,
        audience,
        active: !["false", "0", "no"].includes(activeRaw),
        note: sanitizeText(col(r, "note") ?? ""),
      },
    };
  });
  return { rows, headerError: null };
}
