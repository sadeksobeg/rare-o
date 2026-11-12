import { chromium } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
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
const wsId = (
  await prisma.wholesaleRequest.findFirst({
    where: { traderId: trader.id },
    orderBy: { updatedAt: "desc" },
    select: { id: true },
  })
)?.id;
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

const shots = [
  { route: "/trader/offers", file: "r91-final-offers-light-1440-ar.png", w: 1440, h: 900, theme: "light" },
  { route: "/trader/offers", file: "r91-final-offers-light-390-ar.png", w: 390, h: 844, theme: "light" },
  {
    route: `/trader/wholesale/${wsId}`,
    file: "r91-final-ws-detail-light-1440-ar.png",
    w: 1440,
    h: 900,
    theme: "light",
  },
];

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
const evidence = {};
let fail = false;

for (const s of shots) {
  await page.setViewportSize({ width: s.w, height: s.h });
  await page.addInitScript((t) => {
    localStorage.setItem("ro-portal-theme-v5", t);
  }, s.theme);
  await page.goto(`${BASE}${s.route}`, { waitUntil: "domcontentloaded", timeout: 90000 });
  await page.waitForTimeout(800);
  await hideNextDevIndicator(page);
  const docH = await page.evaluate(() =>
    Math.min(16000, Math.max(document.documentElement.scrollHeight, window.innerHeight))
  );
  await page.setViewportSize({ width: s.w, height: Math.max(docH, s.h) });
  await page.screenshot({ path: path.join(OUT, s.file), fullPage: false });
  const axe = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1);
  const see = `${s.route} · ${s.theme}@${s.w} · axe×${axe.violations.length} · overflow=${overflow ? "ok" : "FAIL"}`;
  evidence[s.file] = see;
  console.log("wrote", s.file, "—", see);
  if (axe.violations.length || !overflow) fail = true;
}

fs.writeFileSync(path.join(OUT, "r91-final-shots.json"), JSON.stringify({ evidence }, null, 2));
await browser.close();
process.exit(fail ? 1 : 0);
