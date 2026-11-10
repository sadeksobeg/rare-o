/**
 * Round 2.1 — keyboard navigation check (owner item 6).
 * Tabs through sidebar -> header -> opens/closes the command palette with
 * focus return -> cards, and verifies every stop along the way has a
 * visible focus ring (outline or box-shadow, not `outline: none` with
 * nothing standing in for it).
 *
 * Run: ADMIN_EMAIL=... ADMIN_PASSWORD=... node scripts/pilot-r2-keyboard-nav.mjs
 */
import { chromium } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const BASE = process.env.PLAYWRIGHT_BASE_URL || "http://127.0.0.1:3000";
const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

async function hasVisibleFocusRing(page) {
  return page.evaluate(() => {
    const el = document.activeElement;
    if (!el || el === document.body) return { ok: false, reason: "no active element" };
    const cs = getComputedStyle(el);
    const hasOutline = cs.outlineStyle !== "none" && parseFloat(cs.outlineWidth) > 0;
    const hasShadowRing = cs.boxShadow && cs.boxShadow !== "none";
    return {
      ok: hasOutline || hasShadowRing,
      tag: el.tagName,
      cls: el.className?.toString().slice(0, 60),
      label: el.getAttribute("aria-label") || el.textContent?.trim().slice(0, 30),
      outlineStyle: cs.outlineStyle,
      outlineWidth: cs.outlineWidth,
      boxShadow: cs.boxShadow?.slice(0, 40),
    };
  });
}

async function main() {
  if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
    throw new Error("Set ADMIN_EMAIL/ADMIN_PASSWORD in env.");
  }
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1440, height: 900 });

  await page.goto(`${BASE}/admin/login`, { waitUntil: "domcontentloaded" });
  await page.fill('input[name="email"]', ADMIN_EMAIL);
  await page.fill('input[name="password"]', ADMIN_PASSWORD);
  await page.getByRole("button", { name: /^دخول$/ }).click();
  await page.waitForURL((url) => !url.pathname.includes("/login"), { timeout: 15_000 });
  await page.waitForLoadState("domcontentloaded");
  await page.waitForTimeout(500);

  const steps = [];
  let noRingCount = 0;

  // 1) Tab through the sidebar + header (first ~14 stops covers both on
  // this layout: brand is not focusable, so this starts on the first nav
  // link).
  await page.keyboard.press("Tab");
  for (let i = 0; i < 14; i++) {
    const ring = await hasVisibleFocusRing(page);
    steps.push({ step: `tab-${i + 1}`, ...ring });
    if (!ring.ok) noRingCount++;
    await page.keyboard.press("Tab");
  }

  // 2) Open the command palette with Ctrl+K, verify the input is focused.
  await page.keyboard.press("Control+k");
  await page.waitForTimeout(150);
  const paletteOpenFocus = await page.evaluate(() => {
    const el = document.activeElement;
    return { tag: el?.tagName, inPalette: !!el?.closest(".rad-pal") };
  });
  steps.push({ step: "ctrl-k-open", ...paletteOpenFocus });
  const paletteOpened = paletteOpenFocus.inPalette === true;

  // 3) Close with Escape, verify focus returns somewhere sane (not lost to
  // <body>).
  await page.keyboard.press("Escape");
  await page.waitForTimeout(150);
  const afterClose = await page.evaluate(() => ({
    tag: document.activeElement?.tagName,
    isBody: document.activeElement === document.body,
  }));
  steps.push({ step: "escape-close", ...afterClose });
  const focusReturnedProperly = afterClose.isBody !== true;

  // 4) Continue tabbing into the KPI cards / action-queue rows and check
  // focus rings there too.
  for (let i = 0; i < 10; i++) {
    await page.keyboard.press("Tab");
    const ring = await hasVisibleFocusRing(page);
    steps.push({ step: `tab-card-${i + 1}`, ...ring });
    if (!ring.ok) noRingCount++;
  }

  await browser.close();

  const result = {
    at: new Date().toISOString(),
    totalStops: steps.filter((s) => s.step.startsWith("tab")).length,
    stopsWithoutVisibleFocusRing: noRingCount,
    paletteOpenedViaCtrlK: paletteOpened,
    focusReturnedAfterEscape: focusReturnedProperly,
    steps,
  };

  fs.writeFileSync(
    path.join(ROOT, "docs", "ui", "pilot-r2", "KEYBOARD-NAV.json"),
    JSON.stringify(result, null, 2)
  );

  console.log(
    `[kbd] ${result.totalStops} tab stops, ${noRingCount} without a visible focus ring. ` +
      `Ctrl+K opened palette: ${paletteOpened}. Focus returned after Escape: ${focusReturnedProperly}.`
  );
  if (noRingCount > 0 || !paletteOpened || !focusReturnedProperly) {
    process.exitCode = 1;
  }
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
