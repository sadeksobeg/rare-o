/**
 * E1 Lighthouse: median of 5 mobile runs per route via child process.
 * Fails if any of Home/Catalog/Product/Request < 0.85 performance.
 * Also records admin + trader homes (soft gate ≥0.85).
 */
import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import fs from "node:fs";
import path from "node:path";

const require = createRequire(import.meta.url);
const ROOT = process.cwd();
const BASE = process.env.PLAYWRIGHT_BASE_URL || "http://127.0.0.1:3001";
const OUT = path.join(ROOT, "docs/pro-readiness/LIGHTHOUSE.json");
const THRESHOLD = Number(process.env.LH_THRESHOLD || 0.85);
const RUNS = Number(process.env.LH_RUNS || 5);

const envPath = path.join(ROOT, ".env");
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (!m) continue;
    if (!process.env[m[1]]) process.env[m[1]] = m[2].replace(/^"|"$/g, "");
  }
}

function median(nums) {
  const s = [...nums].sort((a, b) => a - b);
  return s[Math.floor(s.length / 2)];
}

function once(url) {
  const r = spawnSync(process.execPath, ["scripts/d4-lh-once.mjs", url], {
    cwd: ROOT,
    encoding: "utf8",
    timeout: 180_000,
    env: process.env,
  });
  if (r.status !== 0) {
    throw new Error((r.stderr || r.stdout || "lh-once failed").slice(0, 400));
  }
  const line = (r.stdout || "").trim().split(/\r?\n/).pop();
  return JSON.parse(line);
}

function warm(url, passes) {
  for (let w = 0; w < passes; w += 1) {
    try {
      once(url);
    } catch (e) {
      console.warn(`[e1-lh] warmup ${w + 1}/${passes} skipped:`, e.message);
    }
  }
}

function audit(name, url, hardGate, { warmups = 1 } = {}) {
  const runs = [];
  warm(url, warmups);
  for (let i = 0; i < RUNS; i += 1) {
    let ok = false;
    for (let a = 0; a < 4; a += 1) {
      try {
        const score = once(url);
        runs.push({ ...score, run: i + 1 });
        console.log(
          `[e1-lh] ${name} ${i + 1}/${RUNS} perf=${score.performance} a11y=${score.accessibility}`
        );
        ok = true;
        break;
      } catch (e) {
        console.warn(`[e1-lh] ${name} retry:`, e.message.slice(0, 120));
      }
    }
    if (!ok) console.error(`[e1-lh] ${name} run ${i + 1} failed`);
  }
  if (!runs.length) {
    return { name, url, error: "no runs", passed: false, hardGate };
  }
  const perf = median(runs.map((r) => r.performance));
  const a11y = median(runs.map((r) => r.accessibility));
  const passed = perf >= THRESHOLD && a11y >= THRESHOLD;
  return {
    name,
    url,
    runs,
    median: { performance: perf, accessibility: a11y },
    passed,
    hardGate,
  };
}

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const product = await prisma.product.findFirst({
  where: { status: "published" },
  orderBy: { updatedAt: "desc" },
  select: { slug: true },
});
await prisma.$disconnect();

const targets = [
  { name: "home", url: `${BASE}/?lang=ar`, hardGate: true },
  { name: "catalog", url: `${BASE}/catalog?lang=ar`, hardGate: true },
  {
    name: "product",
    url: product?.slug
      ? `${BASE}/product/${product.slug}?lang=ar`
      : `${BASE}/catalog?lang=ar`,
    hardGate: true,
  },
  { name: "request", url: `${BASE}/request?lang=ar`, hardGate: true },
  { name: "admin-home", url: `${BASE}/admin`, hardGate: false },
  { name: "trader-home", url: `${BASE}/trader`, hardGate: false },
];

const routes = [];
for (const t of targets) {
  const warmups = t.name === "product" ? 2 : 1;
  const row = audit(t.name, t.url, t.hardGate, { warmups });
  routes.push(row);
  const tag = row.passed ? "OK" : "FAIL";
  console.log(
    `[e1-lh] ${tag} ${t.name}: median perf=${row.median?.performance ?? "n/a"}`
  );
}

const hard = routes.filter((r) => r.hardGate);
const out = {
  at: new Date().toISOString(),
  base: BASE,
  threshold: THRESHOLD,
  runsPerRoute: RUNS,
  budgetFile: "lighthouse-budget.json",
  note: "E1: median of 5; hard gate on storefront routes only.",
  routes,
  passed: hard.every((r) => r.passed),
};
fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, JSON.stringify(out, null, 2));
console.log("[e1-lh] wrote", OUT);
process.exit(out.passed ? 0 : 1);
