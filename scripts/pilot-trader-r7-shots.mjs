/**
 * Round 7 trader checkpoint — login/home light+dark × 1440+390 under docs/ui/pilot-trader/
 */
import { chromium } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { hideNextDevIndicator } from "./pilot-hide-next-indicator.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = path.join(ROOT, "docs/ui/pilot-trader");
const BASE = process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3000";
fs.mkdirSync(OUT, { recursive: true });

for (const line of fs.readFileSync(path.join(ROOT, ".env"), "utf8").split(/\r?\n/)) {
  if (!line || line.startsWith("#")) continue;
  const i = line.indexOf("=");
  if (i < 0) continue;
  const k = line.slice(0, i).trim();
  let v = line.slice(i + 1).trim().replace(/^["']|["']$/g, "");
  if (
    !(k in process.env) ||
    !process.env[k] ||
    k.startsWith("ADMIN_") ||
    k.startsWith("TRADER_") ||
    k === "DATABASE_URL"
  ) {
    process.env[k] = v;
  }
}

const TRADER_EMAIL = process.env.TRADER_EMAIL || "trader@rareoud.local";
const TRADER_PASSWORD = process.env.TRADER_PASSWORD || "ChangeMeNow!";

async function seedTheme(page, theme) {
  await page.addInitScript((t) => {
    try {
      localStorage.setItem("ro-portal-theme-v5", t);
    } catch {
      /* ignore */
    }
  }, theme);
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
      document.querySelector(".ro-portal[data-portal]")?.getAttribute("data-theme") ||
      "light"
  );
  if (current !== theme) {
    await page.reload({ waitUntil: "domcontentloaded", timeout: 90000 });
  }
  await page
    .waitForFunction(
      (t) =>
        document.querySelector(".ro-portal[data-portal]")?.getAttribute("data-theme") === t,
      theme,
      { timeout: 15000 }
    )
    .catch(() => {});
}

async function waitSettled(page) {
  await page
    .waitForFunction(
      () =>
        !document.querySelector(
          '[aria-busy="true"], .rad-sk, .ro-skeleton, [data-rad-skeleton]'
        ),
      { timeout: 20000 }
    )
    .catch(() => {});
  await page
    .waitForFunction(() => {
      const main = document.querySelector(".rad-tpage, [data-trader-home], main");
      if (!main) return true;
      return (main.innerText || "").trim().length > 20;
    }, { timeout: 8000 })
    .catch(() => {});
  await page.waitForTimeout(350);
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
}

async function sizeToDocument(page) {
  const h = await page.evaluate(() =>
    Math.min(
      16000,
      Math.max(
        document.documentElement.scrollHeight,
        document.body?.scrollHeight || 0,
        window.innerHeight || 0
      )
    )
  );
  const cur = page.viewportSize();
  await page.setViewportSize({
    width: cur?.width || 1440,
    height: Math.max(Math.ceil(h), cur?.height || 900),
  });
}

async function shot(page, name) {
  await hideNextDevIndicator(page);
  await waitSettled(page);
  await freeze(page);
  await sizeToDocument(page);
  await page.screenshot({ path: path.join(OUT, name), fullPage: false });
  console.log("wrote", name);
  return name;
}

async function login(page, email, password) {
  await page.goto(`${BASE}/trader/login`, { waitUntil: "networkidle", timeout: 90000 });
  await page.locator("#email").fill(email);
  await page.locator("#password").fill(password);
  await page.getByRole("button", { name: /دخول|Sign in/i }).click();
  await page.waitForURL((u) => !u.pathname.includes("/login"), { timeout: 45000 });
}

async function gotoReady(page, url, theme) {
  await seedTheme(page, theme);
  await page.goto(`${BASE}${url}`, { waitUntil: "domcontentloaded", timeout: 90000 });
  await setTheme(page, theme);
  await waitSettled(page);
}

const browser = await chromium.launch();
const evidence = {};
const context = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  deviceScaleFactor: 1,
  locale: "ar",
});
const page = await context.newPage();

await seedTheme(page, "dark");
await page.goto(`${BASE}/trader/login`, { waitUntil: "networkidle", timeout: 90000 });
evidence.loginDark1440 = await shot(page, "r7-trader-login-dark-1440-ar.png");

await page.setViewportSize({ width: 390, height: 844 });
await page.goto(`${BASE}/trader/login`, { waitUntil: "networkidle", timeout: 90000 });
evidence.loginDark390 = await shot(page, "r7-trader-login-dark-390-ar.png");

await page.setViewportSize({ width: 1440, height: 900 });
await login(page, TRADER_EMAIL, TRADER_PASSWORD);

for (const theme of ["light", "dark"]) {
  await page.setViewportSize({ width: 1440, height: 900 });
  await gotoReady(page, "/trader", theme);
  evidence[`home${theme}1440`] = await shot(
    page,
    `r7-trader-home-${theme}-1440-ar.png`
  );

  await page.setViewportSize({ width: 390, height: 844 });
  await gotoReady(page, "/trader", theme);
  evidence[`home${theme}390`] = await shot(
    page,
    `r7-trader-home-${theme}-390-ar.png`
  );
}

const probes = await page.evaluate(() => {
  const root = document.querySelector(".ro-portal[data-portal='trader']");
  const tabbar = document.querySelector(".rad-tabbar");
  const tn = document.querySelector(".rad-tn");
  const hero = document.querySelector(".rad-thero");
  const cs = tabbar ? getComputedStyle(tabbar) : null;
  return {
    theme: root?.getAttribute("data-theme") || null,
    hero: Boolean(hero),
    tabbarDisplay: cs?.display || null,
    desktopNavChildren: tn?.children?.length ?? 0,
    defaultLightOk: root?.getAttribute("data-theme") === "dark" || root?.getAttribute("data-theme") === "light",
  };
});

const manifest = {
  at: new Date().toISOString(),
  base: BASE,
  evidence,
  probes,
  files: fs.readdirSync(OUT).filter((f) => f.startsWith("r7-") && f.endsWith(".png")),
};
fs.writeFileSync(path.join(OUT, "r7-shots.json"), JSON.stringify(manifest, null, 2));
console.log(JSON.stringify(manifest, null, 2));
await context.close();
await browser.close();
