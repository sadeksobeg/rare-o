/**
 * Parent driver: spawn d4-lh-once.mjs per attempt so Chrome protocol crashes
 * cannot kill the whole suite. Merges into LIGHTHOUSE.json with home/catalog
 * from prior D4 partial run when present.
 */
import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import fs from "node:fs";
import path from "node:path";

const require = createRequire(import.meta.url);
const ROOT = process.cwd();
const BASE = process.env.PLAYWRIGHT_BASE_URL || "http://127.0.0.1:3001";
const OUT = path.join(ROOT, "docs/pro-readiness/LIGHTHOUSE.json");
const THRESHOLD = 0.85;

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
    throw new Error((r.stderr || r.stdout || "lh-once failed").slice(0, 300));
  }
  const line = (r.stdout || "").trim().split(/\r?\n/).pop();
  return JSON.parse(line);
}

function audit(name, url, runsWanted = 3) {
  const runs = [];
  // warmup
  try {
    once(url);
  } catch (e) {
    console.warn(`[d4-lh] ${name} warmup skipped:`, e.message);
  }
  for (let i = 0; i < runsWanted; i += 1) {
    let ok = false;
    for (let a = 0; a < 4; a += 1) {
      try {
        const score = once(url);
        runs.push({ ...score, run: i + 1 });
        console.log(
          `[d4-lh] ${name} run ${i + 1}/${runsWanted} perf=${score.performance} a11y=${score.accessibility}`
        );
        ok = true;
        break;
      } catch (e) {
        console.warn(`[d4-lh] ${name} run ${i + 1} retry ${a + 1}: ${e.message}`);
      }
    }
    if (!ok) console.error(`[d4-lh] ${name} run ${i + 1} gave up`);
  }
  if (!runs.length) {
    return { name, url, error: "no successful runs", passed: false };
  }
  const perf = median(runs.map((r) => r.performance));
  const a11y = median(runs.map((r) => r.accessibility));
  return {
    name,
    url,
    runs,
    median: { performance: perf, accessibility: a11y },
    passed: perf >= THRESHOLD && a11y >= THRESHOLD,
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
  { name: "home", url: `${BASE}/?lang=ar` },
  { name: "catalog", url: `${BASE}/catalog?lang=ar` },
  {
    name: "product",
    url: product?.slug
      ? `${BASE}/product/${product.slug}?lang=ar`
      : `${BASE}/catalog?lang=ar`,
  },
  { name: "request", url: `${BASE}/request?lang=ar` },
];

const routes = [];
for (const t of targets) {
  const row = audit(t.name, t.url);
  routes.push(row);
  if (row.passed) {
    console.log(
      `[d4-lh] OK ${t.name}: median perf=${row.median.performance} a11y=${row.median.accessibility}`
    );
  } else if (row.median) {
    console.error(
      `[d4-lh] FAIL ${t.name}: median perf=${row.median.performance} a11y=${row.median.accessibility}`
    );
  } else {
    console.error(`[d4-lh] FAIL ${t.name}: ${row.error}`);
  }
}

const out = {
  at: new Date().toISOString(),
  base: BASE,
  threshold: THRESHOLD,
  runsPerRoute: 3,
  mobile: { width: 390, height: 844 },
  note: "D4 clean-install; each LH run in child process (Chrome crash isolation).",
  routes,
  passed: routes.every((r) => r.passed),
};
fs.writeFileSync(OUT, JSON.stringify(out, null, 2));
console.log("[d4-lh] wrote", OUT);
process.exit(out.passed ? 0 : 1);
