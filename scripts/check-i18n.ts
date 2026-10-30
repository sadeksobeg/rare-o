/**
 * Fails if AR/EN dictionaries diverge in key shape, and ratchets down inline
 * locale ternaries (`locale === "ar" ? "..." : "..."`) outside the dictionary
 * itself — every string belongs in lib/i18n/dictionaries.ts.
 *
 * The ternary count is a ratchet, not a hard zero: MASTER-BUILD-PLAN.md Phase
 * 2 calls for migrating every one of these into the dictionary, but the
 * current count (BASELINE_ratchet.json, written below) is large enough that
 * fixing all of it in one batch is not realistic. This check fails if the
 * count goes UP (a new violation was introduced) and prints the exact
 * file:line list either way, so the remaining debt is always visible and
 * cannot silently grow. Lower BASELINE as violations are fixed.
 *
 * Usage: npx tsx scripts/check-i18n.ts
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { getDictionary } from "../lib/i18n/dictionaries";

function flatten(obj: unknown, prefix = ""): string[] {
  if (obj == null || typeof obj !== "object") return [prefix];
  const out: string[] = [];
  for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
    const path = prefix ? `${prefix}.${k}` : k;
    if (typeof v === "string") out.push(path);
    else if (typeof v === "object" && v !== null) out.push(...flatten(v, path));
    else out.push(path);
  }
  return out;
}

const ar = new Set(flatten(getDictionary("ar")));
const en = new Set(flatten(getDictionary("en")));

const missingInEn = [...ar].filter((k) => !en.has(k)).sort();
const missingInAr = [...en].filter((k) => !ar.has(k)).sort();

if (missingInEn.length || missingInAr.length) {
  console.error("i18n key parity failed");
  if (missingInEn.length) {
    console.error("Missing in EN:", missingInEn.join(", "));
  }
  if (missingInAr.length) {
    console.error("Missing in AR:", missingInAr.join(", "));
  }
  process.exit(1);
}

console.log(`i18n OK — ${ar.size} string keys match in AR and EN`);

// --- Inline locale-ternary ratchet -----------------------------------------

const TERNARY_RE = /locale\s*===\s*"ar"\s*\?/g;
const SCAN_DIRS = ["app", "components", "lib"];
const SKIP_FILES = new Set([
  join("lib", "i18n", "dictionaries.ts"),
  join("lib", "i18n", "config.ts"),
]);
const SKIP_DIR_SEGMENTS = new Set(["node_modules", ".next"]);

// Lower this as violations are migrated into the dictionary. Raising it
// requires a reason in the commit message — the gate exists to stop the
// count from growing silently, not to bless more of it.
const BASELINE = 50;

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    if (SKIP_DIR_SEGMENTS.has(entry)) continue;
    const full = join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) {
      walk(full, out);
    } else if (/\.(tsx?|jsx?)$/.test(entry)) {
      out.push(full);
    }
  }
  return out;
}

const violations: string[] = [];
for (const dir of SCAN_DIRS) {
  for (const file of walk(dir)) {
    if (SKIP_FILES.has(file)) continue;
    const text = readFileSync(file, "utf8");
    const lines = text.split("\n");
    lines.forEach((line, i) => {
      if (TERNARY_RE.test(line)) {
        violations.push(`${file}:${i + 1}`);
      }
      TERNARY_RE.lastIndex = 0;
    });
  }
}

console.log(
  `inline locale ternaries: ${violations.length} (ratchet baseline ${BASELINE})`
);
if (violations.length > 0) {
  console.log(violations.join("\n"));
}

if (violations.length > BASELINE) {
  console.error(
    `\ni18n ternary ratchet failed: ${violations.length} > baseline ${BASELINE}. ` +
      `Move new strings into lib/i18n/dictionaries.ts instead of adding inline ` +
      `locale === "ar" ? ... : ... ternaries.`
  );
  process.exit(1);
}
