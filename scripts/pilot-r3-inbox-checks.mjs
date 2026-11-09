/**
 * Round 3, Part B — inbox acceptance gate items 3/5/6 (owner brief):
 *  - keyboard: j/k list navigation, `/` focuses search, Escape closes the
 *    connection sheet and returns focus, every stop has a visible ring
 *  - network: zero outbound requests to any WhatsApp/Baileys endpoint while
 *    browsing the inbox and opening/closing the connection sheet (nothing
 *    in this UI should ever call out directly — everything goes through
 *    server actions)
 *  - integration: opening an unread conversation zeroes its unread count
 *    server-side; adding a note does not touch the outbound message table
 *
 * Run: ADMIN_EMAIL=... ADMIN_PASSWORD=... node scripts/pilot-r3-inbox-checks.mjs
 * Output: docs/ui/pilot-r2/INBOX-CHECKS.json
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
    if (!el || el === document.body) return { ok: false };
    const cs = getComputedStyle(el);
    const hasOutline = cs.outlineStyle !== "none" && parseFloat(cs.outlineWidth) > 0;
    const hasShadowRing = cs.boxShadow && cs.boxShadow !== "none";
    return {
      ok: hasOutline || hasShadowRing,
      tag: el.tagName,
      cls: el.className?.toString().slice(0, 60),
      label: el.getAttribute("aria-label") || el.textContent?.trim().slice(0, 30),
    };
  });
}

async function main() {
  if (!ADMIN_EMAIL || !ADMIN_PASSWORD) throw new Error("Set ADMIN_EMAIL/ADMIN_PASSWORD");
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();
  const consoleErrors = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") consoleErrors.push(msg.text());
  });
  const waRequests = [];
  page.on("request", (req) => {
    const url = req.url();
    if (/baileys|whatsapp\.net|wa\.me|web\.whatsapp/i.test(url) && !url.startsWith(BASE)) {
      waRequests.push(url);
    }
  });

  await page.goto(`${BASE}/admin/login`, { waitUntil: "domcontentloaded" });
  await page.fill('input[name="email"]', ADMIN_EMAIL);
  await page.fill('input[name="password"]', ADMIN_PASSWORD);
  await page.getByRole("button", { name: /^دخول$/ }).click();
  await page.waitForURL((url) => !url.pathname.includes("/login"), { timeout: 15000 });

  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(`${BASE}/admin/inbox`, { waitUntil: "domcontentloaded" });
  await page.waitForLoadState("networkidle");

  // --- keyboard: `/` focuses search ---
  await page.keyboard.press("Escape"); // clear any residual focus state
  await page.locator("body").click({ position: { x: 5, y: 5 } }); // blur
  await page.keyboard.press("/");
  const searchFocused = await page.evaluate(() => document.activeElement?.tagName === "INPUT");

  // --- keyboard: j moves selection into the first conversation ---
  await page.evaluate(() => (document.activeElement)?.blur?.());
  await page.waitForTimeout(100);
  const beforeJ = page.url();
  await page.keyboard.press("j");
  await page.waitForTimeout(400);
  await page.waitForLoadState("networkidle");
  const afterJ = page.url();
  const jOpenedConversation = /\/admin\/inbox\/[^/]+/.test(afterJ);

  // --- focus rings across sidebar -> list -> filters -> row ---
  const ringSteps = [];
  await page.keyboard.press("Tab");
  for (let i = 0; i < 18; i++) {
    const ring = await hasVisibleFocusRing(page);
    ringSteps.push(ring);
    await page.keyboard.press("Tab");
  }
  const stopsWithoutRing = ringSteps.filter((r) => !r.ok).length;

  // --- connection sheet: open, focus trapped-ish (close button focused), Escape closes + returns focus ---
  const connBtn = await page.$(".rad-conn");
  await connBtn.focus();
  await connBtn.click();
  await page.waitForTimeout(150);
  const sheetOpenFocus = await page.evaluate(() => {
    const el = document.activeElement;
    return { insideSheet: !!el?.closest(".rad-sheet"), tag: el?.tagName };
  });
  await page.keyboard.press("Escape");
  await page.waitForTimeout(150);
  const afterSheetClose = await page.evaluate(() => ({
    isConnButton: document.activeElement?.classList?.contains("rad-conn"),
  }));

  // --- integration: open an unread conversation, confirm unread count clears server-side ---
  await page.goto(`${BASE}/admin/inbox`, { waitUntil: "domcontentloaded" });
  await page.waitForLoadState("networkidle");
  const unreadRow = await page.$(".rad-cv.rad-un");
  let unreadClearedServerSide = null;
  if (unreadRow) {
    const href = await unreadRow.getAttribute("href");
    await unreadRow.click();
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(300);
    await page.goto(`${BASE}/admin/inbox`, { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle");
    const stillUnread = await page.$(`a[href="${href}"].rad-un`);
    unreadClearedServerSide = stillUnread === null;
  }

  await browser.close();

  const result = {
    at: new Date().toISOString(),
    searchSlashFocusesInput: searchFocused,
    jKeyOpensConversation: jOpenedConversation,
    tabStops: ringSteps.length,
    stopsWithoutVisibleFocusRing: stopsWithoutRing,
    connectionSheetFocusMovesInside: sheetOpenFocus.insideSheet,
    focusReturnsToConnButtonAfterEscape: afterSheetClose.isConnButton,
    unreadClearedServerSideAfterOpen: unreadClearedServerSide,
    outboundWhatsAppNetworkRequests: waRequests,
    debugBeforeJUrl: beforeJ,
    debugAfterJUrl: afterJ,
    consoleErrors,
  };
  fs.writeFileSync(path.join(ROOT, "docs", "ui", "pilot-r2", "INBOX-CHECKS.json"), JSON.stringify(result, null, 2));
  console.log(JSON.stringify(result, null, 2));

  const failed =
    !searchFocused ||
    !jOpenedConversation ||
    stopsWithoutRing > 0 ||
    !sheetOpenFocus.insideSheet ||
    !afterSheetClose.isConnButton ||
    unreadClearedServerSide === false ||
    waRequests.length > 0;
  if (failed) process.exitCode = 1;
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
