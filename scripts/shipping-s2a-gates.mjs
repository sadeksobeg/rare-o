/**
 * Release 2a viewport gates (not full-page): request + trader wholesale + health.
 * dark+light × 1440/1280/768/390, overflow, console, axe, honest SEE lines.
 */
import { chromium } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { SignJWT } from "jose";
import { PrismaClient } from "@prisma/client";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { hideNextDevIndicator } from "./pilot-hide-next-indicator.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = path.join(ROOT, "docs/shipping/s2a");
const BASE = process.env.PLAYWRIGHT_BASE_URL || "http://127.0.0.1:3000";
const WIDTHS = [1440, 1280, 768, 390];
const THEMES = ["light", "dark"];

for (const line of fs.readFileSync(path.join(ROOT, ".env"), "utf8").split(/\r?\n/)) {
  if (!line || line.startsWith("#")) continue;
  const i = line.indexOf("=");
  if (i < 0) continue;
  const k = line.slice(0, i).trim();
  let v = line.slice(i + 1).trim().replace(/^["']|["']$/g, "");
  if (!(k in process.env) || !process.env[k] || k === "DATABASE_URL") process.env[k] = v;
}

fs.mkdirSync(OUT, { recursive: true });

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

const health = await fetch(`${BASE}/api/health`).then((r) => r.json());
const quoteDe = await fetch(`${BASE}/api/shipping/quote`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ destinationCode: "DE", weightKg: 20, audience: "CUSTOMER" }),
}).then((r) => r.json());

const browser = await chromium.launch();
const evidence = {
  health,
  quoteDe: {
    ok: quoteDe.ok,
    methods: (quoteDe.methods || []).map((m) => `${m.code}:${m.amount}${m.currency}`),
  },
  shots: {},
};
let fail = false;

async function shot(page, route, theme, w, file, prep) {
  const h = w <= 390 ? 844 : w <= 768 ? 1024 : 900;
  await page.setViewportSize({ width: w, height: h });
  await page.addInitScript((t) => {
    localStorage.setItem("ro-portal-theme-v5", t);
    localStorage.setItem("ro-theme", t);
  }, theme);
  const cons = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") cons.push(msg.text());
  });
  page.on("pageerror", (err) => cons.push(String(err)));
  await page.goto(`${BASE}${route}`, { waitUntil: "networkidle", timeout: 90000 });
  await page.waitForTimeout(600);
  if (prep) await prep(page);
  await hideNextDevIndicator(page);
  await page.waitForTimeout(400);
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1
  );
  const axe = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();
  // Viewport capture only — never fullPage for STOP-2a.
  await page.screenshot({ path: path.join(OUT, file), fullPage: false });
  const body = (await page.evaluate(() => document.body.innerText))
    .replace(/\s+/g, " ")
    .slice(0, 220);
  const see = `${route} · ${theme}@${w} · overflow=${overflow ? "ok" : "FAIL"} · axe×${axe.violations.length} · console×${cons.length} · ${body}`;
  evidence.shots[file] = { see, axe: axe.violations.map((v) => v.id), console: cons.slice(0, 5) };
  console.log(file, "—", see.slice(0, 160));
  if (!overflow || axe.violations.length || cons.length) fail = true;
  page.removeAllListeners("console");
  page.removeAllListeners("pageerror");
}

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

async function pickDe(page) {
  const sel = page.locator('select').filter({ has: page.locator('option[value="DE"]') }).first();
  if (await sel.count()) {
    await sel.selectOption("DE");
    await page.waitForTimeout(1200);
  }
}

for (const theme of THEMES) {
  for (const w of WIDTHS) {
    await shot(
      page,
      "/request",
      theme,
      w,
      `s2a-request-${theme}-${w}-ar.png`,
      pickDe
    );
    await shot(
      page,
      "/trader/wholesale",
      theme,
      w,
      `s2a-trader-ws-${theme}-${w}-ar.png`,
      null
    );
  }
}

fs.writeFileSync(path.join(OUT, "GATES.json"), JSON.stringify(evidence, null, 2));
await browser.close();
console.log(fail ? "GATES FAIL" : "GATES PASS");
process.exit(fail ? 1 : 0);
