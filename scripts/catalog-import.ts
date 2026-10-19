/**
 * Validate / import catalog rows from CSV (bilingual columns).
 *
 * Usage:
 *   npm run catalog:import -- --dry-run
 *   npm run catalog:import -- --file path/to.csv --apply
 *
 * Default: dry-run against docs/templates/catalog-import.csv
 */
import { readFile, access } from "node:fs/promises";
import path from "node:path";
import { parseArgs } from "node:util";

import { PrismaClient } from "@prisma/client";

import {
  PRODUCT_AVAILABILITIES,
  PRODUCT_STATUSES,
} from "../lib/catalog/constants";
import { isCurrencyCode } from "../lib/catalog/currency";

const prisma = new PrismaClient();

const REQUIRED_COLUMNS = [
  "slug",
  "nameAr",
  "nameEn",
  "category",
  "price",
  "currency",
  "descriptionAr",
  "descriptionEn",
  "specsAr",
  "specsEn",
  "availability",
  "imageFiles",
] as const;

type CsvRow = Record<(typeof REQUIRED_COLUMNS)[number], string> & {
  status?: string;
};

function parseCsv(text: string): CsvRow[] {
  const lines = text.replace(/^\uFEFF/, "").split(/\r?\n/);
  const nonEmpty = lines.filter((l) => l.trim().length > 0);
  if (nonEmpty.length < 2) return [];

  const header = splitCsvLine(nonEmpty[0]).map((h) => h.trim());
  const rows: CsvRow[] = [];

  for (let i = 1; i < nonEmpty.length; i += 1) {
    const cells = splitCsvLine(nonEmpty[i]);
    const record: Record<string, string> = {};
    header.forEach((key, idx) => {
      record[key] = (cells[idx] ?? "").trim();
    });
    rows.push(record as CsvRow);
  }
  return rows;
}

function splitCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') {
          cur += '"';
          i += 1;
        } else {
          inQuotes = false;
        }
      } else {
        cur += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      out.push(cur);
      cur = "";
    } else {
      cur += ch;
    }
  }
  out.push(cur);
  return out;
}

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

type RowIssue = { row: number; slug: string; issues: string[] };

function validateRow(row: CsvRow, rowNum: number): RowIssue {
  const issues: string[] = [];
  const slug = row.slug?.trim() ?? "";

  for (const col of REQUIRED_COLUMNS) {
    if (row[col] === undefined) {
      issues.push(`missing column ${col}`);
    }
  }

  if (!slug) issues.push("slug required");
  else if (!SLUG_RE.test(slug)) issues.push("invalid slug format");

  if (!row.nameAr?.trim() && !row.nameEn?.trim()) {
    issues.push("nameAr or nameEn required");
  }

  const category = row.category?.trim();
  if (!category) issues.push("category required");

  const priceRaw = row.price?.trim() ?? "";
  const currencyRaw = row.currency?.trim().toUpperCase() ?? "";
  const hasPrice = priceRaw.length > 0;
  const hasCurrency = currencyRaw.length > 0;
  if (hasPrice !== hasCurrency) {
    issues.push("price and currency must both be set or both empty");
  }
  if (hasPrice && Number.isNaN(Number(priceRaw))) {
    issues.push("price must be numeric");
  }
  if (hasCurrency && !isCurrencyCode(currencyRaw)) {
    issues.push("invalid currency code");
  }

  const availability = row.availability?.trim();
  if (
    availability &&
    !(PRODUCT_AVAILABILITIES as readonly string[]).includes(availability)
  ) {
    issues.push(`availability must be ${PRODUCT_AVAILABILITIES.join("|")}`);
  }

  const status = row.status?.trim() || "draft";
  if (!(PRODUCT_STATUSES as readonly string[]).includes(status)) {
    issues.push(`status must be ${PRODUCT_STATUSES.join("|")}`);
  }

  return { row: rowNum, slug: slug || `(row ${rowNum})`, issues };
}

async function resolveImagePaths(
  imageFiles: string,
  mediaDir: string
): Promise<string[]> {
  const names = imageFiles
    .split(/[;|]/)
    .map((s) => s.trim())
    .filter(Boolean);
  const resolved: string[] = [];
  for (const name of names) {
    const full = path.join(mediaDir, name);
    try {
      await access(full);
      resolved.push(full);
    } catch {
      throw new Error(`image not found: ${name}`);
    }
  }
  return resolved;
}

async function main() {
  const { values, positionals } = parseArgs({
    allowPositionals: true,
    options: {
      file: { type: "string" },
      "media-dir": { type: "string" },
      apply: { type: "boolean", default: false },
      "dry-run": { type: "boolean", default: false },
    },
  });

  const dryRun = values["dry-run"] || !values.apply;
  const file =
    values.file ||
    positionals[0] ||
    path.join("docs", "templates", "catalog-import.csv");
  const mediaDir =
    values["media-dir"] ||
    path.join(path.dirname(path.resolve(file)), "media");

  const raw = await readFile(file, "utf8");
  const rows = parseCsv(raw);

  console.log(`catalog-import: file=${path.resolve(file)}`);
  console.log(`mode=${dryRun ? "dry-run" : "apply"} rows=${rows.length}`);

  const categories = await prisma.category.findMany();
  const bySlug = new Map(categories.map((c) => [c.slug, c]));

  const report: RowIssue[] = [];
  let ok = 0;

  for (let i = 0; i < rows.length; i += 1) {
    const row = rows[i];
    const rowNum = i + 2;
    const v = validateRow(row, rowNum);
    if (v.issues.length) {
      report.push(v);
      continue;
    }

    const cat = bySlug.get(row.category.trim());
    if (!cat) {
      report.push({
        row: rowNum,
        slug: row.slug,
        issues: [`unknown category slug: ${row.category}`],
      });
      continue;
    }

    if (row.imageFiles?.trim()) {
      try {
        await resolveImagePaths(row.imageFiles, mediaDir);
      } catch (e) {
        report.push({
          row: rowNum,
          slug: row.slug,
          issues: [(e as Error).message],
        });
        continue;
      }
    }

    ok += 1;
    console.log(
      `OK row ${rowNum}: ${row.slug} → category=${cat.slug} status=${row.status?.trim() || "draft"}`
    );

    if (!dryRun) {
      const priceRaw = row.price?.trim() ?? "";
      const retailPrice = priceRaw ? Number(priceRaw) : null;
      const currency = row.currency?.trim()
        ? row.currency.trim().toUpperCase()
        : null;

      const existing = await prisma.product.findUnique({
        where: { slug: row.slug.trim() },
      });

      const data = {
        slug: row.slug.trim(),
        nameAr: row.nameAr?.trim() ?? "",
        nameEn: row.nameEn?.trim() ?? "",
        descriptionAr: row.descriptionAr ?? "",
        descriptionEn: row.descriptionEn ?? "",
        specsTextAr: row.specsAr ?? "",
        specsTextEn: row.specsEn ?? "",
        categoryId: cat.id,
        retailPrice,
        currency,
        status: row.status?.trim() || "draft",
        availability: row.availability?.trim() || "available",
      };

      if (existing) {
        await prisma.product.update({ where: { id: existing.id }, data });
      } else {
        await prisma.product.create({ data });
      }
    }
  }

  console.log("\n--- validate report ---");
  console.log(`valid: ${ok} / ${rows.length}`);
  if (report.length) {
    for (const r of report) {
      console.log(`FAIL row ${r.row} (${r.slug}): ${r.issues.join("; ")}`);
    }
    process.exitCode = 1;
  } else if (dryRun) {
    console.log("dry-run complete — re-run with --apply to write products");
  } else {
    console.log("apply complete");
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
