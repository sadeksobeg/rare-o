#!/usr/bin/env node
/**
 * Closure E2 / F5 — concurrent load smoke (p95 latency, error rate).
 * Run: npm run test:e2-load
 * Env: BASE or PLAYWRIGHT_BASE_URL (default http://127.0.0.1:3000)
 * Writes: docs/pro-readiness/F5-LOAD.json
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

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
  try {
    const res = await fetch(url, { redirect: "follow" });
    const ms = performance.now() - start;
    return { ok: res.ok, status: res.status, ms };
  } catch (e) {
    const ms = performance.now() - start;
    return {
      ok: false,
      status: 0,
      ms,
      error: e instanceof Error ? e.message : "fetch failed",
    };
  }
}

async function runBatch(url) {
  const jobs = Array.from({ length: CONCURRENCY }, () => fetchOne(url));
  return Promise.all(jobs);
}

async function main() {
  console.log(`e2-load: BASE=${BASE} concurrency=${CONCURRENCY}`);
  let worstP95 = 0;
  let anyFail = false;
  /** @type {object[]} */
  const reportPaths = [];

  for (const p of paths) {
    const url = `${BASE}${p}`;
    const results = await runBatch(url);
    const ms = results.map((r) => r.ms).sort((a, b) => a - b);
    const p95 = percentile(ms, 95);
    const okCount = results.filter((r) => r.ok).length;
    const errorRate = (CONCURRENCY - okCount) / CONCURRENCY;
    worstP95 = Math.max(worstP95, p95);
    if (okCount < CONCURRENCY) anyFail = true;
    reportPaths.push({
      path: p,
      url,
      concurrency: CONCURRENCY,
      ok: okCount,
      errors: CONCURRENCY - okCount,
      errorRate,
      p50Ms: Number(percentile(ms, 50).toFixed(1)),
      p95Ms: Number(p95.toFixed(1)),
      maxMs: Number((ms[ms.length - 1] ?? 0).toFixed(1)),
    });
    console.log(
      `${p}: ok=${okCount}/${CONCURRENCY} errRate=${(errorRate * 100).toFixed(1)}% p50=${percentile(ms, 50).toFixed(0)}ms p95=${p95.toFixed(0)}ms max=${ms[ms.length - 1]?.toFixed(0)}ms`
    );
  }

  const payload = {
    generatedAt: new Date().toISOString(),
    base: BASE,
    concurrency: CONCURRENCY,
    worstP95Ms: Number(worstP95.toFixed(1)),
    paths: reportPaths,
  };
  const outFile = path.join(root, "docs/pro-readiness/F5-LOAD.json");
  fs.mkdirSync(path.dirname(outFile), { recursive: true });
  fs.writeFileSync(outFile, JSON.stringify(payload, null, 2));

  console.log(`\nSummary: worst p95=${worstP95.toFixed(0)}ms`);
  console.log(`Wrote ${outFile}`);
  if (anyFail) {
    console.error("e2-load: one or more requests failed");
    process.exit(1);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
