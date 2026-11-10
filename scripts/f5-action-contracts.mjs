/**
 * Inventory Server Actions and assert each has a contract check entry.
 * Lightweight: greps "use server" files for export async function *Action
 * and verifies scripts/f5-action-contract-cases.json covers them.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const casesPath = path.join(root, "scripts/f5-action-contract-cases.json");
const cases = JSON.parse(fs.readFileSync(casesPath, "utf8"));

function walk(dir, out = []) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    if (ent.name === "node_modules" || ent.name === ".next") continue;
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(p, out);
    else if (/\.(ts|tsx)$/.test(ent.name)) out.push(p);
  }
  return out;
}

const actionFiles = walk(path.join(root, "app")).filter((f) => {
  const src = fs.readFileSync(f, "utf8");
  return src.includes('"use server"') || src.includes("'use server'");
});

const exported = new Set();
const re = /export\s+async\s+function\s+(\w+Action)\s*\(/g;
for (const f of actionFiles) {
  const src = fs.readFileSync(f, "utf8");
  let m;
  while ((m = re.exec(src))) exported.add(m[1]);
}

const covered = new Set(cases.map((c) => c.action));
const missing = [...exported].filter((a) => !covered.has(a));
const orphan = [...covered].filter((a) => !exported.has(a));

console.log(`actions found: ${exported.size}`);
console.log(`cases: ${cases.length}`);
if (missing.length) {
  console.error("MISSING contract cases:", missing.join(", "));
}
if (orphan.length) {
  console.warn("ORPHAN cases (not found):", orphan.join(", "));
}

const out = {
  generatedAt: new Date().toISOString(),
  actions: [...exported].sort(),
  missing,
  orphan,
  cases: cases.length,
};
fs.mkdirSync(path.join(root, "docs/pro-readiness"), { recursive: true });
fs.writeFileSync(
  path.join(root, "docs/pro-readiness/F5-ACTION-CONTRACTS.json"),
  JSON.stringify(out, null, 2)
);

if (missing.length) process.exit(1);
console.log("f5-action-contracts: PASS");
