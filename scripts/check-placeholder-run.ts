/**
 * Core placeholder scan (invoked via tsx from check-placeholder.mjs).
 */
import { getDictionary } from "../lib/i18n/dictionaries";

/** Top-level dict namespaces shown on the public storefront. */
const STOREFRONT_ROOTS = [
  "brand",
  "nav",
  "home",
  "catalog",
  "product",
  "cart",
  "request",
  "offers",
  "contact",
  "seo",
] as const;

/** Legal copy under `privacy` may keep PLACEHOLDER until owner supplies text (E5 / OWNER-ASSETS). */

function flatten(obj: unknown, prefix = ""): [string, string][] {
  if (obj == null || typeof obj !== "object") return [];
  const out: [string, string][] = [];
  for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
    const path = prefix ? `${prefix}.${k}` : k;
    if (typeof v === "string") out.push([path, v]);
    else if (typeof v === "object" && v !== null) out.push(...flatten(v, path));
  }
  return out;
}

let failed = 0;

for (const locale of ["ar", "en"] as const) {
  const dict = getDictionary(locale);
  const subset: Record<string, unknown> = {};
  for (const key of STOREFRONT_ROOTS) {
    if (dict[key as keyof typeof dict] !== undefined) {
      subset[key] = dict[key as keyof typeof dict];
    }
  }
  for (const [path, value] of flatten(subset)) {
    if (value.includes("PLACEHOLDER")) {
      console.error(`${locale}: ${path} contains PLACEHOLDER`);
      failed += 1;
    }
  }
}

if (failed) {
  console.error(`check:placeholders FAILED (${failed} string(s))`);
  process.exit(1);
}

console.log("check:placeholders OK — no PLACEHOLDER in storefront dictionaries");
