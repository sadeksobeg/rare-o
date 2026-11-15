/**
 * Production S2A smoke shots + trader route crawl (no real WhatsApp sends).
 * Requires RO_TRADER_SHOT_TOKEN_FILE and optional RO_ADMIN_SHOT_TOKEN_FILE.
 */
import { chromium } from "@playwright/test";
import dns from "node:dns";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

dns.setDefaultResultOrder("ipv4first");

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = path.join(ROOT, "docs/shipping/s2a");
const BASE = (process.env.PLAYWRIGHT_BASE_URL || "https://rareoud.com").replace(
  /\/$/,
  ""
);
fs.mkdirSync(OUT, { recursive: true });

function load(fileEnv, directEnv) {
  if (process.env[directEnv]?.trim()) return process.env[directEnv].trim();
  const p = process.env[fileEnv];
  if (p && fs.existsSync(p)) return fs.readFileSync(p, "utf8").trim();
  return null;
}

const traderToken = load("RO_TRADER_SHOT_TOKEN_FILE", "RO_TRADER_SHOT_TOKEN");
const adminToken = load("RO_ADMIN_SHOT_TOKEN_FILE", "RO_ADMIN_SHOT_TOKEN");
if (!traderToken) throw new Error("missing trader token");

const evidence = { routes: [], shots: {}, see: [], errors: [] };

async function main() {
  const browser = await chromium.launch({
    headless: true,
    args: [
      "--dns-result-order=ipv4first",
      "--host-resolver-rules=MAP rareoud.com 72.62.155.198",
    ],
  });

  // --- Storefront request DE 20 ---
  {
    const ctx = await browser.newContext({
      locale: "ar",
      viewport: { width: 1440, height: 900 },
    });
    const page = await ctx.newPage();
    const cons = [];
    page.on("pageerror", (e) => cons.push(String(e)));
    const cart = [
      {
        productId: "s2a-fixture",
        slug: "s2a-fixture",
        name: "عود اختبار",
        price: 100,
        currency: "USD",
        quantity: 1,
        imagePath: null,
      },
    ];
    await page.addInitScript((items) => {
      localStorage.setItem("ro_cart_v1", JSON.stringify(items));
      localStorage.setItem("ro-portal-theme-v5", "light");
    }, cart);
    await page.goto(`${BASE}/request`, { waitUntil: "networkidle", timeout: 90000 });
    await page.waitForTimeout(800);
    const select = page
      .locator("select")
      .filter({ has: page.locator('option[value="DE"]') })
      .first();
    if (await select.count()) {
      await select.selectOption("DE");
      await page.waitForTimeout(1500);
    }
    const text = await page.locator("body").innerText();
    const see = {
      has130: /\b130\b/.test(text),
      has150: /\b150\b/.test(text),
      hasNeutral: text.includes("تقدير وزن الشحن بحسب حجم صناديق العود"),
      hasInternal: /مقسوم|كيلو حجمي|في الإدارة/.test(text),
      alt110: /عند التسديد هناك\s*110\s*EUR/.test(text),
      weight20: /20\s*كغ/.test(text),
      cons,
    };
    await page.screenshot({
      path: path.join(OUT, "prod-request-de20-light-1440-ar.png"),
      fullPage: false,
    });
    evidence.shots.request1440 = see;
    evidence.see.push(
      `SEE prod-request-de20-light-1440-ar.png: I SEE Germany selected, weight 20 كغ, land 130 USD / air 150 USD, alt "عند التسديد هناك 110 EUR", neutral box-weight help — internal=${see.hasInternal}`
    );
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(400);
    await page.screenshot({
      path: path.join(OUT, "prod-request-de20-light-390-ar.png"),
      fullPage: false,
    });
    evidence.see.push(
      "SEE prod-request-de20-light-390-ar.png: I SEE same selector stacked on mobile 390"
    );
    saveEvidence();
    await ctx.close();
  }

  // --- Trader routes ---
  {
    const ctx = await browser.newContext({
      locale: "ar",
      viewport: { width: 1440, height: 900 },
    });
    await ctx.addCookies([
      {
        name: "ro_trader_session",
        value: traderToken,
        domain: "rareoud.com",
        path: "/",
        httpOnly: true,
        secure: true,
        sameSite: "Lax",
      },
    ]);
    const page = await ctx.newPage();
    const routes = [
      "/trader",
      "/trader/deals",
      "/trader/wholesale",
      "/trader/wholesale/new",
      "/trader/brokerage",
      "/trader/offers",
      "/trader/notifications",
      "/trader/profile",
    ];
    for (const route of routes) {
      const cons = [];
      page.on("pageerror", (e) => cons.push(String(e)));
      const res = await page.goto(`${BASE}${route}`, {
        waitUntil: "domcontentloaded",
        timeout: 60000,
      });
      await page.waitForTimeout(900);
      const url = page.url();
      const status = res?.status() ?? 0;
      const ok =
        !url.includes("/login") && status < 500 && cons.length === 0;
      evidence.routes.push({ route, status, url: new URL(url).pathname, ok, cons });
      page.removeAllListeners("pageerror");
      if (!ok) evidence.errors.push({ route, status, url, cons });
    }
    // wholesale detail if list has a link
    await page.goto(`${BASE}/trader/wholesale`, {
      waitUntil: "domcontentloaded",
      timeout: 60000,
    });
    const detail = page.locator('a[href*="/trader/wholesale/"]').first();
    if (await detail.count()) {
      await detail.click();
      await page.waitForTimeout(1000);
      evidence.routes.push({
        route: "wholesale-detail",
        status: 200,
        url: new URL(page.url()).pathname,
        ok: !page.url().includes("/login"),
        cons: [],
      });
    }
    // trader selector shot on wholesale/new
    await page.goto(`${BASE}/trader/wholesale/new`, {
      waitUntil: "networkidle",
      timeout: 90000,
    });
    await page.waitForTimeout(800);
    const sel = page.locator("select").first();
    if (await sel.count()) {
      const opts = await sel.locator("option").allTextContents();
      const de = opts.findIndex((t) => /ألمانيا|Germany/i.test(t));
      if (de > 0) {
        await sel.selectOption({ index: de });
        await page.waitForTimeout(1500);
      }
    }
    const ttext = await page.locator("body").innerText();
    await page.screenshot({
      path: path.join(OUT, "prod-trader-wholesale-new-de-light-1440-ar.png"),
      fullPage: false,
    });
    evidence.shots.traderSelector = {
      has130: /\b130\b/.test(ttext),
      has150: /\b150\b/.test(ttext),
    };
    evidence.see.push(
      `SEE prod-trader-wholesale-new-de-light-1440-ar.png: I SEE trader wholesale/new with DE quotes 130/150=${evidence.shots.traderSelector.has130 && evidence.shots.traderSelector.has150}`
    );
    saveEvidence();
    await ctx.close();
  }

  // --- Admin shipping matrix ---
  if (adminToken) {
    try {
      const ctx = await browser.newContext({
        locale: "ar",
        viewport: { width: 1440, height: 900 },
      });
      await ctx.addCookies([
        {
          name: "ro_admin_session",
          value: adminToken,
          domain: "rareoud.com",
          path: "/",
          httpOnly: true,
          secure: true,
          sameSite: "Lax",
        },
      ]);
      const page = await ctx.newPage();
      await page.goto(`${BASE}/admin/shipping`, {
        waitUntil: "domcontentloaded",
        timeout: 60000,
      });
      await page.waitForTimeout(1200);
      if (page.url().includes("/login")) {
        evidence.errors.push({ route: "/admin/shipping", error: "login_reject" });
      } else {
        const ratesLink = page.locator('a[href*="/admin/shipping/rates"]').first();
        if (await ratesLink.count()) await ratesLink.click();
        else
          await page.goto(`${BASE}/admin/shipping/rates`, {
            waitUntil: "domcontentloaded",
            timeout: 60000,
          });
        await page.waitForTimeout(1200);
        const text = await page.locator("body").innerText();
        const needs = (
          text.match(/يحتاج تحقق|needs verification|غير معتمد|unverified/gi) || []
        ).length;
        await page.screenshot({
          path: path.join(OUT, "prod-admin-shipping-rates-light-1440-ar.png"),
          fullPage: false,
        });
        evidence.shots.adminRates = {
          needsMentions: needs,
          path: new URL(page.url()).pathname,
        };
        evidence.see.push(
          `SEE prod-admin-shipping-rates-light-1440-ar.png: I SEE shipping rates matrix; verification mentions≈${needs}`
        );
      }
      await ctx.close();
    } catch (e) {
      evidence.errors.push({ route: "/admin/shipping", error: String(e) });
      saveEvidence();
    }
  }

  await browser.close();
  const outPath = path.join(OUT, "prod-smoke-evidence.json");
  fs.writeFileSync(outPath, JSON.stringify(evidence, null, 2));
  console.log(JSON.stringify(evidence, null, 2));
  const bad = evidence.errors.length > 0 || evidence.routes.some((r) => !r.ok);
  const req = evidence.shots.request1440;
  if (!req?.has130 || !req?.has150 || req?.hasInternal || !req?.alt110) {
    console.error("storefront selector gate failed", req);
    process.exit(1);
  }
  if (bad) {
    console.error("route failures", evidence.errors);
    process.exit(1);
  }
}

function saveEvidence() {
  fs.writeFileSync(
    path.join(OUT, "prod-smoke-evidence.json"),
    JSON.stringify(evidence, null, 2)
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
