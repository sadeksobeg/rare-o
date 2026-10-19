#!/usr/bin/env node
/**
 * Closure E2 — concurrent load smoke (p95 latency).
 * Run: npm run test:e2-load
 * Env: BASE or PLAYWRIGHT_BASE_URL (default http://127.0.0.1:3000)
 */
const BASE = (
  process.env.BASE ||
  process.env.PLAYWRIGHT_BASE_URL ||
  "http://127.0.0.1:3000"
).replace(/\/$/, "");

const CONCURRENCY = Number(process.env.E2_LOAD_CONCURRENCY || 50);
const PRODUCT_SLUG = process.env.E2_LOAD_PRODUCT_SLUG || "demo-string-instrument";

const paths = ["/", "/catalog", `/en/product/${PRODUCT_SLUG}`];

function percentile(sorted, p) {
  if (sorted.length === 0) return 0;
  const idx = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.max(0, idx)];
}

async function fetchOne(url) {
  const start = performance.now();
  const res = await fetch(url, { redirect: "follow" });
  const ms = performance.now() - start;
  return { ok: res.ok, status: res.status, ms };
}

async function runBatch(url) {
  const jobs = Array.from({ length: CONCURRENCY }, () => fetchOne(url));
  return Promise.all(jobs);
}

async function main() {
  console.log(`e2-load: BASE=${BASE} concurrency=${CONCURRENCY}`);
  let worstP95 = 0;
  let anyFail = false;

  for (const p of paths) {
    const url = `${BASE}${p}`;
    const results = await runBatch(url);
    const ms = results.map((r) => r.ms).sort((a, b) => a - b);
    const p95 = percentile(ms, 95);
    const ok = results.filter((r) => r.ok).length;
    worstP95 = Math.max(worstP95, p95);
    if (ok < CONCURRENCY) anyFail = true;
    console.log(
      `${p}: ok=${ok}/${CONCURRENCY} p50=${percentile(ms, 50).toFixed(0)}ms p95=${p95.toFixed(0)}ms max=${ms[ms.length - 1]?.toFixed(0)}ms`
    );
  }

  console.log(`\nSummary: worst p95=${worstP95.toFixed(0)}ms`);
  if (anyFail) {
    console.error("e2-load: one or more requests failed");
    process.exit(1);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
