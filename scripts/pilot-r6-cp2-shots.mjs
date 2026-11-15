/**
 * Round 6 CP2 — frozen-theme captures (transition/animation none).
 */
import { chromium } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";
import { hideNextDevIndicator } from "./pilot-hide-next-indicator.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = path.join(ROOT, "docs/ui/pilot-r6");
const BASE = process.env.PLAYWRIGHT_BASE_URL || "http://127.0.0.1:3000";

for (const line of fs.readFileSync(path.join(ROOT, ".env"), "utf8").split(/\r?\n/)) {
  if (!line || line.startsWith("#")) continue;
  const i = line.indexOf("=");
  if (i < 0) continue;
  const k = line.slice(0, i).trim();
  let v = line.slice(i + 1).trim().replace(/^["']|["']$/g, "");
  if (k === "ADMIN_EMAIL" || k === "ADMIN_PASSWORD" || k === "DATABASE_URL") {
    process.env[k] = v;
  }
}
fs.mkdirSync(OUT, { recursive: true });

function prismaFirst(model) {
  try {
    const raw = execFileSync(
      process.execPath,
      [
        "-e",
        `const {PrismaClient}=require('@prisma/client');const p=new PrismaClient();p.${model}.findFirst({orderBy:{updatedAt:'desc'},select:{id:true}}).then(d=>{console.log(JSON.stringify(d));return p.$disconnect()})`,
      ],
      { cwd: ROOT, encoding: "utf8" }
    );
    return JSON.parse(raw.trim().split(/\r?\n/).pop())?.id ?? null;
  } catch {
    return null;
  }
}

async function setTheme(page, theme) {
  await page.evaluate((t) => {
    try {
      localStorage.setItem("ro-portal-theme-v5", t);
    } catch {
      /* ignore */
    }
  }, theme);
  const current = await page.evaluate(
    () =>
      document.querySelector('[data-portal="admin"]')?.getAttribute("data-theme") ||
      "dark"
  );
  if (current !== theme) {
    const btn = page.locator(".rad-top button[aria-pressed]");
    if ((await btn.count()) > 0) await btn.first().click();
  }
  await page.waitForFunction(
    (t) =>
      document.querySelector('[data-portal="admin"]')?.getAttribute("data-theme") === t,
    theme,
    { timeout: 10000 }
  );
}

async function freeze(page) {
  await page.addStyleTag({
    content: `*,*::before,*::after{transition:none!important;animation:none!important}`,
  });
  await page.evaluate(async () => {
    for (const a of document.getAnimations()) {
      try {
        a.finish();
      } catch {
        /* ignore */
      }
    }
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
  });
  await page.waitForTimeout(120);
}

async function shot(page, name, fullPage = true) {
  await hideNextDevIndicator(page);
  await freeze(page);
  const file = path.join(OUT, name);
  await page.screenshot({ path: file, fullPage });
  return name;
}

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto(`${BASE}/admin/login`, { waitUntil: "domcontentloaded" });
await page.fill('input[name="email"]', process.env.ADMIN_EMAIL);
await page.fill('input[name="password"]', process.env.ADMIN_PASSWORD);
await page.locator('button[type="submit"]').first().click();
await page.waitForURL((u) => !u.pathname.includes("/login"), { timeout: 20000 });

const files = [];
const productId = prismaFirst("product");
const broId = prismaFirst("brokerageRequest");
const dealId = prismaFirst("dealProposal");

async function go(theme, url) {
  // Seed theme before navigation so first paint is final (no mid-transition).
  await page.addInitScript((t) => {
    try {
      localStorage.setItem("ro-portal-theme-v5", t);
    } catch {
      /* ignore */
    }
  }, theme);
  await page.goto(`${BASE}${url}`, { waitUntil: "networkidle", timeout: 60000 });
  await setTheme(page, theme);
  await page.waitForFunction(
    (t) => {
      const root = document.querySelector('[data-portal="admin"]');
      if (!root || root.getAttribute("data-theme") !== t) return false;
      const inp = document.querySelector("input, textarea, .rad-inp");
      if (!inp) return true;
      const bg = getComputedStyle(inp).backgroundColor;
      // Dark theme inputs should not be cream; light should not be near-black.
      if (t === "dark") return !/245|239|230|251|247|241/.test(bg);
      return !/11,\s*8,\s*13|21,\s*16,\s*26|15,\s*10,\s*18/.test(bg);
    },
    theme,
    { timeout: 8000 }
  ).catch(() => {});
}

// Products editor + new
if (productId) {
  for (const theme of ["dark", "light"]) {
    await go(theme, `/admin/products/${productId}`);
    files.push(await shot(page, `r6-product-editor-${theme}-1440-ar.png`, true));
    await page.setViewportSize({ width: 390, height: 844 });
    files.push(await shot(page, `r6-product-editor-${theme}-390-ar.png`, true));
    await page.setViewportSize({ width: 1440, height: 900 });
  }
}
for (const theme of ["dark", "light"]) {
  await go(theme, "/admin/products/new");
  files.push(await shot(page, `r6-product-new-${theme}-1440-ar.png`, true));
  await page.setViewportSize({ width: 390, height: 844 });
  files.push(await shot(page, `r6-product-new-${theme}-390-ar.png`, true));
  await page.setViewportSize({ width: 1440, height: 900 });
}

// Products list + categories
for (const theme of ["dark", "light"]) {
  await go(theme, "/admin/products");
  files.push(await shot(page, `r6-products-list-${theme}-1440-ar.png`, false));
  await go(theme, "/admin/categories");
  files.push(await shot(page, `r6-categories-${theme}-1440-ar.png`, false));
}
await page.setViewportSize({ width: 390, height: 844 });
await go("dark", "/admin/products");
files.push(await shot(page, `r6-products-list-dark-390-ar.png`, false));
await page.setViewportSize({ width: 1440, height: 900 });

// Missing carry shots
await go("dark", "/admin/brokerage?view=kanban");
files.push(await shot(page, `r6-brokerage-kanban-dark-1440-ar.png`, false));
if (broId) {
  await go("dark", `/admin/brokerage/${broId}`);
  files.push(await shot(page, `r6-brokerage-detail-dark-1440-ar.png`, true));
}
if (dealId) {
  await go("dark", `/admin/deals/${dealId}`);
  // scroll negotiation into view if present
  await page.evaluate(() => {
    const el = [...document.querySelectorAll("h2,h3,.rad-ch")].find((n) =>
      /سجل التفاوض|Negotiation/i.test(n.textContent || "")
    );
    el?.scrollIntoView({ block: "start" });
  });
  files.push(await shot(page, `r6-deal-negotiation-dark-1440-ar.png`, true));
}

// Traders / offers if routes load
await go("dark", "/admin/traders");
files.push(await shot(page, `r6-traders-list-dark-1440-ar.png`, false));
await go("light", "/admin/traders");
files.push(await shot(page, `r6-traders-list-light-1440-ar.png`, false));
await go("dark", "/admin/offers");
files.push(await shot(page, `r6-offers-list-dark-1440-ar.png`, false));
await go("light", "/admin/offers");
files.push(await shot(page, `r6-offers-list-light-1440-ar.png`, false));

fs.writeFileSync(
  path.join(OUT, "r6-cp2-shots.json"),
  JSON.stringify({ files, productId, broId, dealId }, null, 2)
);
console.log(JSON.stringify({ files, productId, broId, dealId }, null, 2));
await browser.close();
