import { chromium } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";
import { hideNextDevIndicator } from "./pilot-hide-next-indicator.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = path.join(ROOT, "docs/ui/pilot-r6");
const BASE = process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3000";

for (const line of fs.readFileSync(path.join(ROOT, ".env"), "utf8").split(/\r?\n/)) {
  if (!line || line.startsWith("#")) continue;
  const i = line.indexOf("=");
  if (i < 0) continue;
  const k = line.slice(0, i).trim();
  let v = line.slice(i + 1).trim().replace(/^["']|["']$/g, "");
  if (k === "ADMIN_EMAIL" || k === "ADMIN_PASSWORD") process.env[k] = v;
}

function broId() {
  try {
    const raw = execFileSync(
      process.execPath,
      [
        "-e",
        "const {PrismaClient}=require('@prisma/client');const p=new PrismaClient();p.brokerageRequest.findFirst({orderBy:{updatedAt:'desc'},select:{id:true}}).then(d=>{console.log(JSON.stringify(d));return p.$disconnect()})",
      ],
      { cwd: ROOT, encoding: "utf8" }
    );
    return JSON.parse(raw.trim().split(/\r?\n/).pop())?.id ?? null;
  } catch {
    return null;
  }
}

async function settle(page) {
  await page
    .waitForFunction(
      () =>
        !document.querySelector(
          '[aria-busy="true"], .rad-sk, .ro-skeleton, [data-rad-skeleton]'
        ),
      { timeout: 45000 }
    )
    .catch(() => {});
}

async function shot(page, name) {
  await hideNextDevIndicator(page);
  await settle(page);
  const h = await page.evaluate(() =>
    Math.min(
      16000,
      Math.max(
        document.documentElement.scrollHeight,
        document.body?.scrollHeight || 0,
        900
      )
    )
  );
  await page.setViewportSize({ width: 1440, height: h });
  await page.screenshot({ path: path.join(OUT, name), fullPage: false });
  console.log("wrote", name);
}

const id = broId();
const browser = await chromium.launch();
const page = await browser.newPage({
  viewport: { width: 1440, height: 900 },
  locale: "ar",
});
await page.addInitScript(() => localStorage.setItem("ro-portal-theme-v5", "dark"));
await page.goto(`${BASE}/admin/login`, { waitUntil: "networkidle", timeout: 90000 });
await page.fill('input[name="email"]', process.env.ADMIN_EMAIL);
await page.fill('input[name="password"]', process.env.ADMIN_PASSWORD);
await page.locator('button[type="submit"]').first().click();
await page.waitForURL((u) => !u.pathname.includes("/login"), { timeout: 45000 });

await page.goto(`${BASE}/admin/brokerage`, {
  waitUntil: "domcontentloaded",
  timeout: 60000,
});
await shot(page, "r61-brokerage-table-dark-1440-ar.png");
await page.evaluate(() => localStorage.setItem("ro-portal-theme-v5", "light"));
await page.reload({ waitUntil: "domcontentloaded" });
await shot(page, "r61-brokerage-table-light-1440-ar.png");

if (id) {
  await page.evaluate(() => localStorage.setItem("ro-portal-theme-v5", "dark"));
  await page.goto(`${BASE}/admin/brokerage/${id}`, {
    waitUntil: "domcontentloaded",
    timeout: 60000,
  });
  await shot(page, "r61-brokerage-detail-dark-1440-ar.png");
  const text = await page.locator("main").innerText();
  const enums = text.match(/\b[A-Z]{3,}(_[A-Z0-9]+)+\b/g) || [];
  console.log("enums_in_detail", [...new Set(enums)]);
  await page.evaluate(() => localStorage.setItem("ro-portal-theme-v5", "light"));
  await page.reload({ waitUntil: "domcontentloaded" });
  await shot(page, "r61-brokerage-detail-light-1440-ar.png");
}

await browser.close();
