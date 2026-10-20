/**
 * Fail when storefront (non-legal) dictionary strings contain PLACEHOLDER.
 * Privacy/legal stubs are OWNER-ACTION and excluded from the build gate.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dictPath = path.join(root, "lib/i18n/dictionaries.ts");
const src = fs.readFileSync(dictPath, "utf8");
const lines = src.split("\n");

/** Skip privacy / terms / cookies legal stub namespaces (OWNER-ACTION). */
function isLegalStubContext(lineIndex) {
  // Look backward for nearest top-level key like privacy: / terms: / cookies:
  for (let i = lineIndex; i >= Math.max(0, lineIndex - 80); i -= 1) {
    const t = lines[i].trim();
    if (/^(privacy|terms|cookies)\s*:/.test(t)) return true;
    if (/^(brand|nav|home|catalog|product|cart|request|offers|contact|seo)\s*:/.test(t))
      return false;
  }
  return false;
}

const hits = [];
for (let i = 0; i < lines.length; i += 1) {
  const line = lines[i];
  if (!line.includes("PLACEHOLDER")) continue;
  if (/^\s*\/\//.test(line) || /^\s*\*/.test(line)) continue;
  if (isLegalStubContext(i)) continue;
  hits.push({ line: i + 1, text: line.trim().slice(0, 120) });
}

if (hits.length) {
  console.error("check:placeholders FAILED — PLACEHOLDER found:");
  for (const h of hits) console.error(`  L${h.line}: ${h.text}`);
  process.exit(1);
}

console.log(
  "check:placeholders OK — no PLACEHOLDER outside privacy/terms/cookies stubs"
);
