/**
 * Fails if AR/EN dictionaries diverge in key shape.
 * Usage: npx tsx scripts/check-i18n.ts
 */
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
