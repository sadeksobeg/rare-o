/**
 * Carry-over visual proof shots (dark 1440) + phone dir gate sample.
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
  if (k === "ADMIN_EMAIL" || k === "ADMIN_PASSWORD" || k === "DATABASE_URL") process.env[k] = v;
}
fs.mkdirSync(OUT, { recursive: true });

function prismaFirst(model) {
  try {
    const raw = execFileSync(
      process.execPath,
      ["-e", `const {PrismaClient}=require('@prisma/client');const p=new PrismaClient();p.${model}.findFirst({orderBy:{updatedAt:'desc'},select:{id:true}}).then(d=>{console.log(JSON.stringify(d));return p.$disconnect()})`],
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
  const current = await page.evaluate(() => {
    const root = document.querySelector('[data-portal="admin"]');
    return root?.getAttribute("data-theme") || "dark";
  });
  if (current !== theme) {
    const themeBtn = page.locator(".rad-top button[aria-pressed]");
    if ((await themeBtn.count()) > 0) await themeBtn.first().click();
  }
  await page.waitForFunction(
    (t) =>
      document.querySelector('[data-portal="admin"]')?.getAttribute("data-theme") ===
      t,
    theme,
    { timeout: 10000 }
  );
}

async function idle(page) {
  await page.evaluate(async () => {
    const finite = () =>
      document.getAnimations().filter(
        (a) => a.effect && a.playState !== "finished" && a.effect.getTiming().iterations !== Infinity
      );
    for (let i = 0; i < 5; i++) {
      await Promise.all(finite().map((a) => a.finished.catch(() => {})));
      if (!finite().length) break;
    }
  });
  await page.waitForTimeout(250);
}

const browser = await chromium.launch();
const page = await (await browser.newContext({ locale: "ar" })).newPage();
await page.setViewportSize({ width: 1440, height: 900 });
await page.goto(`${BASE}/admin/login`);
await page.fill('input[name="email"]', process.env.ADMIN_EMAIL);
await page.fill('input[name="password"]', process.env.ADMIN_PASSWORD);
await page.locator('button[type="submit"]').first().click();
await page.waitForURL((u) => !u.pathname.includes("/login"), { timeout: 20000 });

const files = [];
const shot = async (file) => {
  await hideNextDevIndicator(page);
  await idle(page);
  await page.screenshot({ path: path.join(OUT, file), fullPage: false });
  files.push(file);
};

await page.goto(`${BASE}/admin/brokerage`, { waitUntil: "networkidle" });
await setTheme(page, "dark");
await shot("r6-brokerage-kanban-dark-1440-ar.png");

const brId = prismaFirst("brokerageRequest") || (await page.evaluate(() => {
  const a = document.querySelector('a[href^="/admin/brokerage/"]');
  return a?.getAttribute("href")?.split("/").pop() || null;
}));
if (brId) {
  await page.goto(`${BASE}/admin/brokerage/${brId}`, { waitUntil: "networkidle" });
  await setTheme(page, "dark");
  await shot("r6-brokerage-detail-dark-1440-ar.png");
}

await page.goto(`${BASE}/admin/customers`, { waitUntil: "networkidle" });
const custHref = await page.evaluate(() => {
  const a = [...document.querySelectorAll('a[href^="/admin/customers/"]')].find(
    (el) => (el.getAttribute("href") || "").split("/").filter(Boolean).length >= 3
  );
  return a?.getAttribute("href");
});
if (custHref) {
  await page.goto(`${BASE}${custHref}`, { waitUntil: "networkidle" });
  await setTheme(page, "dark");
  await shot("r6-customer-detail-edit-dark-1440-ar.png");
}

const dealId = prismaFirst("dealProposal");
if (dealId) {
  await page.goto(`${BASE}/admin/deals/${dealId}`, { waitUntil: "networkidle" });
  await setTheme(page, "dark");
  await shot("r6-deal-negotiation-dark-1440-ar.png");
}

const whId = prismaFirst("wholesaleRequest");
if (whId) {
  await page.goto(`${BASE}/admin/wholesale/${whId}`, { waitUntil: "networkidle" });
  await setTheme(page, "dark");
  await shot("r6-wholesale-ops-dark-1440-ar.png");
}

// Products / categories for Round 6 first checkpoint
await page.goto(`${BASE}/admin/products`, { waitUntil: "networkidle" });
await setTheme(page, "dark");
await shot("r6-products-list-dark-1440-ar.png");
await setTheme(page, "light");
await shot("r6-products-list-light-1440-ar.png");
await page.setViewportSize({ width: 390, height: 844 });
await setTheme(page, "dark");
await shot("r6-products-list-dark-390-ar.png");

await page.setViewportSize({ width: 1440, height: 900 });
await page.goto(`${BASE}/admin/categories`, { waitUntil: "networkidle" });
await setTheme(page, "dark");
await shot("r6-categories-dark-1440-ar.png");
await setTheme(page, "light");
await shot("r6-categories-light-1440-ar.png");

// Phone direction sample
await page.setViewportSize({ width: 390, height: 844 });
await page.goto(`${BASE}/admin/requests`, { waitUntil: "networkidle" });
await setTheme(page, "dark");
const phoneGate = await page.evaluate(() => {
  const bdis = [...document.querySelectorAll("bdi[dir='ltr']")].filter((el) =>
    /^\+\d/.test((el.textContent || "").trim())
  );
  return bdis.slice(0, 5).map((el) => {
    const cs = getComputedStyle(el);
    return {
      text: (el.textContent || "").trim(),
      direction: cs.direction,
      unicodeBidi: cs.unicodeBidi,
      startsPlus: /^\+\d/.test((el.textContent || "").trim()),
      ok:
        /^\+\d/.test((el.textContent || "").trim()) &&
        (cs.direction === "ltr" || cs.unicodeBidi.includes("isolate")),
    };
  });
});
fs.writeFileSync(
  path.join(OUT, "phone-dir-gate.json"),
  JSON.stringify({ pass: phoneGate.every((x) => x.ok), samples: phoneGate }, null, 2)
);

fs.writeFileSync(
  path.join(OUT, "r6-carry-shots.json"),
  JSON.stringify({ files, phoneGate }, null, 2)
);
console.log(JSON.stringify({ files, phoneGate }, null, 2));
await browser.close();
