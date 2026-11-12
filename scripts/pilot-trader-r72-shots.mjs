/**
 * R7.2 — trader login + home × light/dark × 1440/1280/768/390 + overflow/console/axe.
 */
import { chromium } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
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
const VIEWPORTS = [
  { w: 1440, h: 900 },
  { w: 1280, h: 800 },
  { w: 768, h: 1024 },
  { w: 390, h: 844 },
];
const THEMES = ["light", "dark"];

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
      ""
  );
  if (current !== theme) {
    await page.reload({ waitUntil: "domcontentloaded", timeout: 90000 });
  }
  await page
    .waitForFunction(
      (t) =>
        document.querySelector(".ro-portal[data-portal]")?.getAttribute("data-theme") ===
        t,
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
  await page.waitForTimeout(300);
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
    await new Promise((r) =>
      requestAnimationFrame(() => requestAnimationFrame(r))
    );
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

async function overflowCheck(page) {
  return page.evaluate(() => {
    const doc = document.documentElement;
    return {
      ok: doc.scrollWidth <= doc.clientWidth + 1,
      scrollWidth: doc.scrollWidth,
      clientWidth: doc.clientWidth,
    };
  });
}

function seeLine(meta) {
  const bits = [];
  if (meta.route === "/trader/login") bits.push("login form");
  if (meta.route === "/trader") bits.push("home hero+kpi+waiting");
  bits.push(`${meta.theme}@${meta.w}`);
  if (meta.overflow?.ok === false) bits.push("H-OVERFLOW");
  if (meta.consoleErrors?.length) bits.push(`console×${meta.consoleErrors.length}`);
  if (meta.axeViolations > 0) bits.push(`axe×${meta.axeViolations}`);
  if (meta.heroText) bits.push(`hero:"${meta.heroText.slice(0, 48)}"`);
  if (meta.waitingLink) bits.push(`waitLink:"${meta.waitingLink}"`);
  if (meta.kpiCols) bits.push(`kpiCols=${meta.kpiCols}`);
  if (meta.offerCount != null) bits.push(`offers=${meta.offerCount}`);
  if (meta.localeContrast) bits.push(`localeLum=${meta.localeContrast}`);
  return bits.join(" · ");
}

async function probeHome(page) {
  return page.evaluate(() => {
    const heroP = document.querySelector(".rad-thero p")?.textContent?.trim() || "";
    const waitingLink =
      document.querySelector(".rad-tsh a")?.textContent?.trim() || "";
    const tstat = document.querySelector(".rad-tstat");
    let kpiCols = 0;
    if (tstat) {
      const cs = getComputedStyle(tstat);
      kpiCols = (cs.gridTemplateColumns || "").split(" ").filter(Boolean).length;
    }
    const offerCount = document.querySelectorAll(".rad-tocard").length;
    const localeBtn = document.querySelector(
      '.rad-th2-tools button[aria-label], .rad-th2-tools form button'
    );
    let localeContrast = null;
    if (localeBtn) {
      const c = getComputedStyle(localeBtn).color;
      localeContrast = c;
    }
    const waitingCard = document.querySelector(".rad-tsh + .rad-card");
    const waitingMinH = waitingCard
      ? getComputedStyle(waitingCard).minHeight
      : null;
    return {
      heroText: heroP,
      waitingLink,
      kpiCols,
      offerCount,
      localeContrast,
      waitingMinH,
    };
  });
}

const browser = await chromium.launch();
const results = [];
const evidence = {};

{
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1,
    locale: "ar",
  });
  const page = await context.newPage();
  const consoleErrors = [];
  page.on("pageerror", (e) => consoleErrors.push(String(e.message || e)));
  page.on("console", (msg) => {
    if (msg.type() === "error") consoleErrors.push(msg.text());
  });

  for (const theme of THEMES) {
    for (const vp of VIEWPORTS) {
      consoleErrors.length = 0;
      await page.setViewportSize({ width: vp.w, height: vp.h });
      await seedTheme(page, theme);
      await page.goto(`${BASE}/trader/login`, {
        waitUntil: "networkidle",
        timeout: 90000,
      });
      // Login page forces its own data-theme; still record.
      await waitSettled(page);
      await hideNextDevIndicator(page);
      await page.evaluate(() => {
        const el = document.activeElement;
        if (el instanceof HTMLElement) el.blur();
      });
      await freeze(page);
      await sizeToDocument(page);
      const name = `r72-trader-login-${theme}-${vp.w}-ar.png`;
      await page.screenshot({ path: path.join(OUT, name), fullPage: false });
      const overflow = await overflowCheck(page);
      let axeViolations = 0;
      try {
        const axe = await new AxeBuilder({ page })
          .withTags(["wcag2a", "wcag2aa"])
          .analyze();
        axeViolations = axe.violations.length;
      } catch (e) {
        consoleErrors.push(`axe:${e}`);
      }
      const themeAttr = await page.evaluate(
        () =>
          document.querySelector(".ro-portal[data-portal]")?.getAttribute(
            "data-theme"
          ) || null
      );
      const meta = {
        route: "/trader/login",
        theme,
        w: vp.w,
        file: name,
        overflow,
        consoleErrors: [...consoleErrors],
        axeViolations,
        themeAttr,
      };
      meta.see = seeLine(meta);
      results.push(meta);
      evidence[name] = meta.see;
      console.log("wrote", name, "—", meta.see);
    }
  }

  // Login once then home matrix
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(`${BASE}/trader/login`, {
    waitUntil: "networkidle",
    timeout: 90000,
  });
  await page.locator("#email").fill(TRADER_EMAIL);
  await page.locator("#password").fill(TRADER_PASSWORD);
  await page.getByRole("button", { name: /دخول|Sign in/i }).click();
  await page.waitForURL((u) => !u.pathname.includes("/login"), {
    timeout: 45000,
  });

  for (const theme of THEMES) {
    for (const vp of VIEWPORTS) {
      consoleErrors.length = 0;
      await page.setViewportSize({ width: vp.w, height: vp.h });
      await seedTheme(page, theme);
      await page.goto(`${BASE}/trader`, {
        waitUntil: "domcontentloaded",
        timeout: 90000,
      });
      await setTheme(page, theme);
      await waitSettled(page);
      await hideNextDevIndicator(page);
      await page.evaluate(() => {
        const el = document.activeElement;
        if (el instanceof HTMLElement) el.blur();
      });
      await freeze(page);
      await sizeToDocument(page);
      const name = `r72-trader-home-${theme}-${vp.w}-ar.png`;
      await page.screenshot({ path: path.join(OUT, name), fullPage: false });
      const overflow = await overflowCheck(page);
      const probe = await probeHome(page);
      let axeViolations = 0;
      try {
        const axe = await new AxeBuilder({ page })
          .withTags(["wcag2a", "wcag2aa"])
          .analyze();
        axeViolations = axe.violations.length;
      } catch (e) {
        consoleErrors.push(`axe:${e}`);
      }
      const meta = {
        route: "/trader",
        theme,
        w: vp.w,
        file: name,
        overflow,
        consoleErrors: [...consoleErrors],
        axeViolations,
        ...probe,
      };
      meta.see = seeLine(meta);
      results.push(meta);
      evidence[name] = meta.see;
      console.log("wrote", name, "—", meta.see);
    }
  }

  await context.close();
}

const gates = {
  overflowFail: results.filter((r) => !r.overflow?.ok).map((r) => r.file),
  consoleFail: results.filter((r) => r.consoleErrors?.length).map((r) => r.file),
  axeFail: results.filter((r) => r.axeViolations > 0).map((r) => ({
    file: r.file,
    n: r.axeViolations,
  })),
  pluralOk: !results.some(
    (r) => r.heroText && /1\s+أمور/.test(r.heroText)
  ),
  waitingLinkOk: !results.some(
    (r) => r.waitingLink && /صفقاتي\s*\(0\)/.test(r.waitingLink)
  ),
  kpi390Ok: results
    .filter((r) => r.route === "/trader" && r.w === 390)
    .every((r) => r.kpiCols === 3),
};

const manifest = {
  at: new Date().toISOString(),
  base: BASE,
  evidence,
  gates,
  results,
  files: fs
    .readdirSync(OUT)
    .filter((f) => f.startsWith("r72-") && f.endsWith(".png")),
};
fs.writeFileSync(path.join(OUT, "r72-shots.json"), JSON.stringify(manifest, null, 2));
console.log(JSON.stringify({ gates, files: manifest.files.length }, null, 2));
await browser.close();

const hardFail =
  gates.overflowFail.length ||
  gates.consoleFail.length ||
  gates.axeFail.length ||
  !gates.pluralOk ||
  !gates.waitingLinkOk ||
  !gates.kpi390Ok;
process.exit(hardFail ? 1 : 0);
