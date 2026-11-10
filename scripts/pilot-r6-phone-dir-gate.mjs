/**
 * Round 6 — masked phone `bdi` must start with +country and render LTR/isolate.
 */
import { chromium } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { hideNextDevIndicator } from "./pilot-hide-next-indicator.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT_DIR = path.join(ROOT, "docs/ui/pilot-r6");
const OUT = path.join(OUT_DIR, "phone-dir-gate.json");
const BASE = process.env.PLAYWRIGHT_BASE_URL || "http://127.0.0.1:3000";

function loadDotEnv() {
  const envPath = path.join(ROOT, ".env");
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
    if (!line || line.startsWith("#")) continue;
    const i = line.indexOf("=");
    if (i < 0) continue;
    const k = line.slice(0, i).trim();
    let v = line.slice(i + 1).trim().replace(/^["']|["']$/g, "");
    if (
      !(k in process.env) ||
      !process.env[k] ||
      k.startsWith("ADMIN_") ||
      k === "DATABASE_URL"
    ) {
      process.env[k] = v;
    }
  }
}
loadDotEnv();
fs.mkdirSync(OUT_DIR, { recursive: true });

const PHONE_PATTERN = /^\+\d/;

async function login(page) {
  await page.goto(`${BASE}/admin/login`, { waitUntil: "domcontentloaded" });
  await page.fill('input[name="email"]', process.env.ADMIN_EMAIL);
  await page.fill('input[name="password"]', process.env.ADMIN_PASSWORD);
  await page.locator('button[type="submit"]').first().click();
  await page.waitForURL((u) => !u.pathname.includes("/login"), { timeout: 20000 });
}

async function assessMaskedPhones(page) {
  return page.evaluate(
    ({ patternSource }) => {
      const pattern = new RegExp(patternSource);
      const candidates = [
        ...document.querySelectorAll('bdi[dir="ltr"]'),
        ...document.querySelectorAll("bdi"),
      ].filter((el, i, arr) => arr.indexOf(el) === i);

      const phones = candidates
        .map((bdi) => (bdi.textContent || "").trim())
        .filter((text) => text.includes("+"));

      const details = candidates
        .filter((bdi) => (bdi.textContent || "").includes("+"))
        .map((bdi) => {
          const text = (bdi.textContent || "").trim();
          const cs = getComputedStyle(bdi);
          const okPattern = pattern.test(text);
          const okDir =
            cs.direction === "ltr" ||
            bdi.getAttribute("dir") === "ltr" ||
            bdi.style.unicodeBidi === "isolate" ||
            cs.unicodeBidi === "isolate";
          return { text: text.slice(0, 48), okPattern, okDir, ok: okPattern && okDir };
        });

      return {
        count: details.length,
        allOk: details.length > 0 && details.every((d) => d.ok),
        phones,
        details,
      };
    },
    { patternSource: PHONE_PATTERN.source }
  );
}

const VIEWPORTS = [
  { name: "1440", width: 1440, height: 900 },
  { name: "390", width: 390, height: 844 },
];

const browser = await chromium.launch();
const context = await browser.newContext({ locale: "ar" });
const page = await context.newPage();
await login(page);

const results = [];
let failCount = 0;

async function checkScreen(key, pathName, viewport, afterNav) {
  await page.setViewportSize({ width: viewport.width, height: viewport.height });
  await page.goto(`${BASE}${pathName}`, { waitUntil: "networkidle", timeout: 60000 });
  await hideNextDevIndicator(page);
  if (afterNav) await afterNav();
  await page.waitForTimeout(200);
  const assessed = await assessMaskedPhones(page);
  const row = {
    key,
    path: pathName,
    viewport: viewport.name,
    ...assessed,
    ok: assessed.allOk,
  };
  if (!row.ok) failCount += 1;
  results.push(row);
}

for (const vp of VIEWPORTS) {
  await checkScreen("requests-list", "/admin/requests", vp);

  await page.setViewportSize({ width: vp.width, height: vp.height });
  await page.goto(`${BASE}/admin/requests`, { waitUntil: "networkidle", timeout: 60000 });
  await hideNextDevIndicator(page);
  const hasRow = await page.locator(".rad-dt tbody tr").first().count();
  if (hasRow > 0) {
    await page.locator(".rad-dt tbody tr").first().click();
    await page.waitForTimeout(500);
    const detailPath = new URL(page.url()).pathname;
    await checkScreen("request-detail", detailPath, vp);
  } else {
    results.push({
      key: "request-detail",
      path: "(no rows)",
      viewport: vp.name,
      ok: false,
      count: 0,
      allOk: false,
      skip: "empty requests list",
    });
    failCount += 1;
  }

  await checkScreen("customers-list", "/admin/customers", vp);

  await page.goto(`${BASE}/admin/customers`, { waitUntil: "networkidle", timeout: 60000 });
  await hideNextDevIndicator(page);
  const custRow = await page.locator(".rad-dt tbody tr").first().count();
  if (custRow > 0) {
    await page.locator(".rad-dt tbody tr").first().click();
    await page.waitForTimeout(500);
    const custPath = new URL(page.url()).pathname;
    await checkScreen("customer-detail", custPath, vp);
  } else {
    results.push({
      key: "customer-detail",
      path: "(no rows)",
      viewport: vp.name,
      ok: false,
      count: 0,
      allOk: false,
      skip: "empty customers list",
    });
    failCount += 1;
  }
}

const payload = {
  generatedAt: new Date().toISOString(),
  pass: failCount === 0,
  failCount,
  pattern: PHONE_PATTERN.source,
  rule:
    "Masked phone bdi: text matches /^\\+\\d/ and direction ltr or unicode-bidi isolate",
  results,
};

fs.writeFileSync(OUT, JSON.stringify(payload, null, 2));
console.log(JSON.stringify({ pass: payload.pass, failCount, out: OUT }, null, 2));
await browser.close();
process.exit(failCount > 0 ? 1 : 0);
