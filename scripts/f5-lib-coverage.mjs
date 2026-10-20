#!/usr/bin/env node
/**
 * Closure F5 — run unit harness + lib coverage proxy for lib/auth, lib/db, lib/deals.
 * Run: node scripts/f5-lib-coverage.mjs
 * Writes: docs/pro-readiness/F5-COVERAGE.txt, F5-LIB-COVERAGE.json
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const outTxt = path.join(root, "docs/pro-readiness/F5-COVERAGE.txt");
const outJson = path.join(root, "docs/pro-readiness/F5-LIB-COVERAGE.json");

const SCOPES = ["lib/auth", "lib/db", "lib/deals"];

function listTsUnder(relDir) {
  const abs = path.join(root, relDir);
  if (!fs.existsSync(abs)) return [];
  /** @type {string[]} */
  const out = [];
  for (const ent of fs.readdirSync(abs, { withFileTypes: true })) {
    if (ent.isFile() && ent.name.endsWith(".ts")) {
      out.push(`${relDir}/${ent.name}`.replace(/\\/g, "/"));
    }
  }
  return out;
}

/** @param {string} rel */
function lineCount(rel) {
  return fs.readFileSync(path.join(root, rel), "utf8").split(/\r?\n/).length;
}

/** @param {string[]} scripts */
function importedModules(scripts) {
  /** @type {Set<string>} */
  const hit = new Set();
  const re =
    /(?:from\s+["']@\/(lib\/(?:auth|db|deals)[^"']+)["']|from\s+["']\.\.\/(lib\/(?:auth|db|deals)[^"']+)["'])/g;
  for (const script of scripts) {
    const src = fs.readFileSync(path.join(root, script), "utf8");
    let m;
    while ((m = re.exec(src))) {
      const p = (m[1] || m[2]).replace(/\\/g, "/");
      hit.add(p.endsWith(".ts") ? p : `${p}.ts`);
    }
  }
  return hit;
}

function runHarness() {
  const tsx = path.join(root, "node_modules/tsx/dist/cli.mjs");
  const steps = [
    ["scripts/e2-unit-checks.ts", "e2-unit-checks"],
    ["scripts/f5-lib-unit.ts", "f5-lib-unit"],
    ["scripts/f5-action-contracts.ts", "f5-action-contracts"],
    ["scripts/f5-security-checks.ts", "f5-security-checks"],
  ];
  /** @type {{ name: string; ok: boolean; code: number | null }}[]} */
  const results = [];
  for (const [rel, name] of steps) {
    const r = spawnSync(process.execPath, [tsx, rel], {
      cwd: root,
      env: process.env,
      stdio: "inherit",
    });
    results.push({ name, ok: r.status === 0, code: r.status });
  }
  return results;
}

function main() {
  const allFiles = SCOPES.flatMap(listTsUnder);
  const totalLines = allFiles.reduce((n, f) => n + lineCount(f), 0);

  const scriptSources = [
    "scripts/e2-unit-checks.ts",
    "scripts/f5-lib-unit.ts",
    "scripts/f5-action-contracts.ts",
    "scripts/f5-security-checks.ts",
  ];
  const imports = importedModules(scriptSources);
  const exercised = allFiles.filter((f) => imports.has(f));
  const exercisedLines = exercised.reduce((n, f) => n + lineCount(f), 0);
  const pct = totalLines ? (exercisedLines / totalLines) * 100 : 0;
  const pctRounded = Math.round(pct * 10) / 10;
  const targetMet = pctRounded >= 70;

  console.log("\n=== F5 lib coverage harness ===\n");
  const runs = runHarness();

  const report = {
    generatedAt: new Date().toISOString(),
    scopes: SCOPES,
    totalLines,
    exercisedLines,
    percentLinesProxy: pctRounded,
    gatePercent: 70,
    pass: targetMet,
    exercisedModules: exercised,
    allModules: allFiles,
    harnessRuns: runs,
  };

  fs.mkdirSync(path.dirname(outTxt), { recursive: true });
  fs.writeFileSync(outJson, JSON.stringify(report, null, 2));

  const lines = [
    "F5 lib coverage (lib/auth, lib/db, lib/deals)",
    `Generated: ${report.generatedAt}`,
    "",
    `Total lines in scope: ${totalLines}`,
    `Lines in modules imported by e2-unit + f5 scripts: ${exercisedLines}`,
    `Estimated coverage (import-line proxy): ${pctRounded}%`,
    `Target >= 70%: ${targetMet ? "MET" : "BELOW (see exercised list)"}`,
    "",
    "Exercised modules:",
    ...exercised.sort().map((f) => `  - ${f}`),
    "",
    "Harness:",
    ...runs.map((r) => `  - ${r.name}: ${r.ok ? "PASS" : `FAIL (${r.code})`}`),
    "",
    "Note: Full Istanbul coverage needs Next request context for cookie-bound actions;",
    "proxy counts direct imports from F5 harness scripts. JSON: F5-LIB-COVERAGE.json",
  ];
  fs.writeFileSync(outTxt, lines.join("\n"));

  console.log(`\nWrote ${outTxt}`);
  console.log(`Wrote ${outJson}`);
  console.log(
    `Coverage proxy: ${pctRounded}% (${exercised.length}/${allFiles.length} files)`
  );

  const anyFail = runs.some((r) => !r.ok);
  if (anyFail) process.exit(1);
  if (!targetMet) {
    console.warn("Coverage proxy below 70% — documented in F5-COVERAGE.txt");
  }
}

main();
