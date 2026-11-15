import { chromium } from "@playwright/test";
import { SignJWT } from "jose";
import { PrismaClient } from "@prisma/client";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { hideNextDevIndicator } from "./pilot-hide-next-indicator.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = path.join(ROOT, "docs/ui/pilot-trader");
const BASE = process.env.PLAYWRIGHT_BASE_URL || "http://127.0.0.1:3000";

for (const line of fs.readFileSync(path.join(ROOT, ".env"), "utf8").split(/\r?\n/)) {
  if (!line || line.startsWith("#")) continue;
  const i = line.indexOf("=");
  if (i < 0) continue;
  const k = line.slice(0, i).trim();
  let v = line.slice(i + 1).trim().replace(/^["']|["']$/g, "");
  if (!(k in process.env) || !process.env[k] || k === "DATABASE_URL") {
    process.env[k] = v;
  }
}

const prisma = new PrismaClient();
const trader = await prisma.traderAccount.findUnique({
  where: { email: "trader@rareoud.local" },
});
const token = await new SignJWT({
  email: trader.email,
  displayName: trader.displayName,
  role: "trader",
  mustChangePassword: false,
  pwv: trader.passwordChangedAt?.getTime() ?? 0,
})
  .setProtectedHeader({ alg: "HS256" })
  .setSubject(trader.id)
  .setIssuedAt()
  .setExpirationTime("12h")
  .sign(new TextEncoder().encode(process.env.AUTH_SECRET));
await prisma.$disconnect();

const browser = await chromium.launch();
const context = await browser.newContext({ locale: "ar" });
await context.addCookies([
  {
    name: "ro_trader_session",
    value: token,
    url: BASE,
    httpOnly: true,
    sameSite: "Lax",
  },
]);
const page = await context.newPage();
await page.setViewportSize({ width: 1440, height: 900 });
await page.addInitScript(() => {
  localStorage.setItem("ro-portal-theme-v5", "light");
});
await page.goto(`${BASE}/trader/offers`, { waitUntil: "networkidle", timeout: 90000 });
await page.waitForSelector("article.rad-card", { timeout: 20000 });
await page.waitForTimeout(1800);
await hideNextDevIndicator(page);
const info = await page.evaluate(() => ({
  articles: document.querySelectorAll("article.rad-card").length,
  imgs: [...document.querySelectorAll("article img")].map((i) => ({
    src: i.getAttribute("src"),
    w: i.naturalWidth,
    h: i.naturalHeight,
    cls: i.className,
  })),
  text: document.body.innerText.slice(0, 600),
}));
console.log(JSON.stringify(info, null, 2));
const docH = await page.evaluate(() =>
  Math.min(16000, Math.max(document.documentElement.scrollHeight, window.innerHeight))
);
await page.setViewportSize({ width: 1440, height: Math.max(docH, 900) });
await page.waitForTimeout(500);
await page.screenshot({
  path: path.join(OUT, "r91-final-offers-light-1440-ar.png"),
  fullPage: false,
});
console.log("rewrote r91-final-offers-light-1440-ar.png docH=", docH);
await browser.close();
