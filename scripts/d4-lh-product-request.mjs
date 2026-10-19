/**
 * Isolated Lighthouse for product + request (avoids long multi-route Chrome crashes).
 */
import { createRequire } from "node:module";
import lighthouse from "lighthouse";
import fs from "node:fs";
import path from "node:path";

const require = createRequire(import.meta.url);
const chromeLauncher = require("chrome-launcher");

const BASE = process.env.PLAYWRIGHT_BASE_URL || "http://127.0.0.1:3001";
const ROOT = process.cwd();

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

async function once(url) {
  const chrome = await chromeLauncher.launch({
    chromeFlags: [
      "--headless=new",
      "--no-sandbox",
      "--disable-gpu",
      "--disable-dev-shm-usage",
    ],
  });
  try {
    const result = await lighthouse(url, {
      port: chrome.port,
      output: "json",
      logLevel: "error",
      onlyCategories: ["performance", "accessibility"],
      formFactor: "mobile",
      screenEmulation: {
        mobile: true,
        width: 390,
        height: 844,
        deviceScaleFactor: 2,
        disabled: false,
      },
    });
    return {
      performance: result.lhr.categories.performance?.score ?? 0,
      accessibility: result.lhr.categories.accessibility?.score ?? 0,
    };
  } finally {
    try {
      await chrome.kill();
    } catch {
      /* ignore */
    }
  }
}

async function audit(name, url) {
  const runs = [];
  for (let i = 0; i < 3; i += 1) {
    for (let attempt = 0; attempt < 3; attempt += 1) {
      try {
        const r = await once(url);
        runs.push(r);
        console.log(`[d4-lh] ${name} run ${i + 1}/3 perf=${r.performance} a11y=${r.accessibility}`);
        break;
      } catch (e) {
        console.warn(`[d4-lh] ${name} run ${i + 1} attempt ${attempt + 1}: ${e.message}`);
        await new Promise((r) => setTimeout(r, 2000));
      }
    }
  }
  if (!runs.length) throw new Error(`${name}: no successful runs`);
  return {
    name,
    url,
    runs,
    median: {
      performance: median(runs.map((r) => r.performance)),
      accessibility: median(runs.map((r) => r.accessibility)),
    },
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
if (!product?.slug) throw new Error("no published product");

const productRow = await audit(
  "product",
  `${BASE}/product/${product.slug}?lang=ar`
);
const requestRow = await audit("request", `${BASE}/request?lang=ar`);

const out = { at: new Date().toISOString(), base: BASE, routes: [productRow, requestRow] };
fs.writeFileSync(
  path.join(ROOT, "docs/pro-readiness/D4-LH-PRODUCT-REQUEST.json"),
  JSON.stringify(out, null, 2)
);
console.log(
  `[d4-lh] medians product=${productRow.median.performance} request=${requestRow.median.performance}`
);
