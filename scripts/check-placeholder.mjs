/**
 * Fail when user-visible storefront dictionary strings contain PLACEHOLDER.
 * Usage: npm run check:placeholders
 */
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);

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
  "privacy",
  "seo",
];

function flatten(obj, prefix = "") {
  if (obj == null || typeof obj !== "object") return [];
  const out = [];
  for (const [k, v] of Object.entries(obj)) {
    const path = prefix ? `${prefix}.${k}` : k;
    if (typeof v === "string") out.push([path, v]);
    else if (typeof v === "object" && v !== null) out.push(...flatten(v, path));
  }
  return out;
}

const { getDictionary } = require("../lib/i18n/dictionaries.ts");

let failed = 0;

for (const locale of ["ar", "en"]) {
  const dict = getDictionary(locale);
  const subset = {};
  for (const key of STOREFRONT_ROOTS) {
    if (dict[key] !== undefined) subset[key] = dict[key];
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
