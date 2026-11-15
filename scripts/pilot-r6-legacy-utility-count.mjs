/**
 * Count remaining legacy Tailwind utilities under admin-relevant paths.
 * Fix is TOKEN-level (styles/tokens.css bridge) — this is the inventory.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = path.join(ROOT, "docs/ui/pilot-r6/legacy-utility-count.json");
const PATTERN =
  "text-ro-ink|bg-ro-paper|text-ro-muted|border-ro-line|bg-ro-sunken|bg-ro-canvas|text-ro-canvas|bg-ro-elevated|text-ro-plum|bg-ro-paper|text-ro-text|border-ro-border";

const globs = [
  "components/admin",
  "app/admin",
  "components/ui",
  "components/deals",
  "components/brokerage",
];

let raw = "";
try {
  raw = execSync(
    `rg -c --glob "*.tsx" --glob "*.ts" "${PATTERN}" ${globs.join(" ")}`,
    { cwd: ROOT, encoding: "utf8" }
  );
} catch (e) {
  raw = e.stdout || "";
}

const byFile = {};
let total = 0;
for (const line of raw.split(/\r?\n/)) {
  if (!line.trim()) continue;
  const i = line.lastIndexOf(":");
  if (i < 0) continue;
  const file = line.slice(0, i).replace(/\\/g, "/");
  const count = Number(line.slice(i + 1));
  if (!Number.isFinite(count)) continue;
  byFile[file] = count;
  total += count;
}

const payload = {
  generatedAt: new Date().toISOString(),
  pattern: PATTERN,
  totalHits: total,
  fileCount: Object.keys(byFile).length,
  byFile,
  fix:
    "TOKEN-LEVEL bridge on .ro-portal[data-portal=admin] remaps --ro-ink-*, --ro-sand-*, --color-ro-*, --ro-text*, --ro-bg* → --rad-*. No per-component class rewrites required for these utilities under admin.",
};

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, JSON.stringify(payload, null, 2));
console.log(JSON.stringify({ totalHits: total, fileCount: payload.fileCount }, null, 2));
