import { chromium } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = path.join(ROOT, "docs/chat/shots/f2");
const BASE = process.env.PLAYWRIGHT_BASE_URL || "http://127.0.0.1:3000";
const TRADER_EMAIL = process.env.TRADER_EMAIL || "trader@rareoud.local";
const TRADER_PASSWORD = process.env.TRADER_PASSWORD || "ChangeMeNow!";

for (const line of fs.readFileSync(path.join(ROOT, ".env"), "utf8").split(/\r?\n/)) {
  if (!line || line.startsWith("#")) continue;
  const i = line.indexOf("=");
  if (i < 0) continue;
  const k = line.slice(0, i).trim();
  const v = line.slice(i + 1).trim().replace(/^["']|["']$/g, "");
  if (!(k in process.env) || !process.env[k]) process.env[k] = v;
}

async function setVal(page, sel, val) {
  const loc = page.locator(sel).first();
  await loc.waitFor({ state: "visible", timeout: 30000 });
  await loc.click();
  await loc.fill("");
  await page.keyboard.type(val, { delay: 5 });
}

async function loginTrader(page) {
  await page.goto(`${BASE}/trader/login`, { waitUntil: "domcontentloaded" });
  await setVal(page, 'input[name="email"]', TRADER_EMAIL);
  await setVal(page, 'input[name="password"]', TRADER_PASSWORD);
  await Promise.all([
    page.waitForURL(
      (u) => u.pathname.startsWith("/trader") && !u.pathname.includes("/login"),
      { timeout: 60000 }
    ),
    page.getByRole("button", { name: /sign in|دخول|تسجيل الدخول/i }).click(),
  ]);
}

const browser = await chromium.launch({ headless: true });
const notes = [];
try {
  for (const width of [1440, 390]) {
    const ctx = await browser.newContext({
      viewport: { width, height: width === 390 ? 844 : 900 },
      locale: "ar-SA",
      colorScheme: "dark",
      isMobile: width === 390,
      hasTouch: width === 390,
    });
    const page = await ctx.newPage();
    try {
      await loginTrader(page);
    } catch (e) {
      await page.screenshot({
        path: path.join(OUT, `f2-trader-login-fail-${width}.png`),
      });
      const t = await page.locator("body").innerText().catch(() => "");
      const err = await page.locator("[role='alert'], .text-destructive, [class*='err']").allTextContents().catch(() => []);
      throw new Error(
        `trader login failed @${width} url=${page.url()} alerts=${JSON.stringify(err)} body=${t.slice(0, 500)} cause=${e}`
      );
    }
    await page.goto(`${BASE}/trader/messages`, {
      waitUntil: "domcontentloaded",
      timeout: 90000,
    });
    await page.waitForTimeout(1200);
    const body = await page.locator("body").innerText();
    const hasWa = /F2-WA/i.test(body);
    const hasPlat = /F2-PLAT/i.test(body);
    console.log(JSON.stringify({ width, hasWa, hasPlat, url: page.url() }));
    if (!hasWa || !hasPlat) {
      await page.screenshot({ path: path.join(OUT, `f2-trader-debug-${width}.png`) });
      throw new Error(`missing channels @${width} snippet=${body.slice(0, 300)}`);
    }
    const geom =
      width === 390
        ? await page.evaluate(() => {
            const ta = document.querySelector("textarea");
            const composer = ta?.closest("form") || ta?.parentElement;
            const navs = [...document.querySelectorAll("nav")];
            const tab = navs[navs.length - 1];
            const cr = composer?.getBoundingClientRect();
            const tr = tab?.getBoundingClientRect();
            return { gap: cr && tr ? Math.round(tr.top - cr.bottom) : null };
          })
        : null;
    const name =
      width === 1440 ? "f2-merged-trader-1440.png" : "f2-merged-trader-390.png";
    await page.screenshot({
      path: path.join(OUT, name),
      fullPage: false,
      animations: "disabled",
    });
    const see =
      width === 1440
        ? `Trader /messages @1440 same merge: SEE F2-WA + F2-PLAT (wa=${hasWa} plat=${hasPlat}).`
        : `Trader @390: SEE composer above tabs gap=${geom?.gap}; channels wa=${hasWa} plat=${hasPlat}.`;
    notes.push({ file: name, see });
    console.log("SEE", name, see);
    if (width === 390 && geom?.gap != null && geom.gap < -4) {
      throw new Error("composer overlaps " + JSON.stringify(geom));
    }
    await ctx.close();
  }
} finally {
  await browser.close();
}

const prev = path.join(OUT, "FEATURE-NOTES.md");
const existing = fs.existsSync(prev) ? fs.readFileSync(prev, "utf8") : "";
const block = notes.map((n) => `- **${n.file}:** ${n.see}`).join("\n");
fs.writeFileSync(prev, `${existing}${existing.endsWith("\n") ? "" : "\n"}${block}\n`);
console.log("TRADER_SHOTS_DONE", notes.length);
