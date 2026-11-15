/**
 * Browser audit shots for internal chat (local only).
 * Uses platform channel via DB seed helpers invoked in-page actions — no WA send.
 */
import { chromium } from "playwright";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const BASE = process.env.BASE_URL || "http://127.0.0.1:3000";
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@rareoud.local";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "";
const TRADER_EMAIL = process.env.TRADER_EMAIL || "trader@rareoud.local";
const TRADER_PASSWORD = process.env.TRADER_PASSWORD || "ChangeMeNow!";
const OUT = path.join("docs", "ui", "wa-v", "internal-chat");
mkdirSync(OUT, { recursive: true });

async function setVal(page, sel, val) {
  await page.locator(sel).first().waitFor({ state: "visible", timeout: 20000 });
  await page.evaluate(
    ({ sel, val }) => {
      const el = document.querySelector(sel);
      if (!el) throw new Error("missing " + sel);
      el.focus();
      el.value = val;
      el.dispatchEvent(new Event("input", { bubbles: true }));
      el.dispatchEvent(new Event("change", { bubbles: true }));
    },
    { sel, val }
  );
}

async function loginAdmin(page) {
  await page.goto(`${BASE}/admin/login`, { waitUntil: "domcontentloaded" });
  await setVal(page, 'input[name="email"], input[type="email"]', ADMIN_EMAIL);
  await setVal(page, 'input[name="password"]', ADMIN_PASSWORD);
  await page.locator('button[type="submit"]').first().click();
  await page.waitForURL((u) => !u.pathname.includes("/login"), { timeout: 30000 });
}

async function loginTrader(page) {
  await page.goto(`${BASE}/trader/login`, { waitUntil: "domcontentloaded" });
  await setVal(page, 'input[name="email"], input[type="email"]', TRADER_EMAIL);
  await setVal(page, 'input[name="password"]', TRADER_PASSWORD);
  await page.locator('button[type="submit"]').first().click();
  await page.waitStart?.();
  await page.waitForURL((u) => u.pathname.startsWith("/trader") && !u.pathname.includes("/login"), {
    timeout: 30000,
  });
}

const shots = [];
async function shot(page, name, note) {
  const file = path.join(OUT, name);
  await page.screenshot({ path: file, fullPage: false });
  shots.push({ file: name, note });
  console.log(`SHOT ${name}: ${note}`);
}

async function main() {
  if (!ADMIN_PASSWORD) throw new Error("ADMIN_PASSWORD missing");
  const trader = await prisma.traderAccount.findUnique({
    where: { email: TRADER_EMAIL },
    select: { id: true, phone: true, displayName: true },
  });
  if (!trader) throw new Error("trader seed missing: " + TRADER_EMAIL);

  // Ensure a platform message exists for UI (text only, no WA)
  const { sendTraderPlatformMessage, sendAdminPlatformMessage, getTraderConversation } =
    await import("../lib/whatsapp/messaging/trader-channel.ts");
  const stamp = Date.now();
  await sendTraderPlatformMessage({
    traderId: trader.id,
    text: `تدقيق بوابة — رسالة تاجر ${stamp}`,
  });
  const conv = await getTraderConversation(trader.id);
  const admin = await prisma.adminUser.findFirst({ select: { id: true } });
  if (conv?.conversationId && admin) {
    await sendAdminPlatformMessage({
      conversationId: conv.conversationId,
      adminId: admin.id,
      text: `تدقيق بوابة — رد إدارة ${stamp}`,
    });
  }
  const conversationId = conv?.conversationId;

  const browser = await chromium.launch({ headless: true });
  const results = [];

  // Trader 1440 dark
  {
    const ctx = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      locale: "ar",
      colorScheme: "dark",
    });
    const page = await ctx.newPage();
    await loginTrader(page);
    await page.goto(`${BASE}/trader/messages`, { waitUntil: "networkidle" });
    await page.waitForTimeout(800);
    await shot(page, "t-messages-dark-1440.png", "trader messages 1440 dark — SEE empty/thread");
    // capture HTML snippet for channel labels
    const labels = await page.locator("article").count();
    const platformLbl = await page.getByText(/عبر المنصة|via platform/i).count();
    results.push({ scenario: "trader_ui_1440", labels, platformLbl });
    await ctx.close();
  }

  // Trader 390
  {
    const ctx = await browser.newContext({
      viewport: { width: 390, height: 844 },
      locale: "ar",
      colorScheme: "dark",
    });
    const page = await ctx.newPage();
    await loginTrader(page);
    await page.goto(`${BASE}/trader/messages`, { waitUntil: "networkidle" });
    await page.waitForTimeout(600);
    await shot(page, "t-messages-dark-390.png", "trader messages 390 dark");
    await ctx.close();
  }

  // Trader light 1440
  {
    const ctx = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      locale: "ar",
      colorScheme: "light",
    });
    const page = await ctx.newPage();
    await loginTrader(page);
    await page.goto(`${BASE}/trader/messages`, { waitUntil: "networkidle" });
    // force light if toggle exists
    const theme = page.locator('[aria-label*="فاتح"], [aria-label*="Light"], button:has-text("فاتح")');
    if (await theme.count()) {
      try {
        await theme.first().click({ timeout: 2000 });
      } catch {}
    }
    await page.waitForTimeout(500);
    await shot(page, "t-messages-light-1440.png", "trader messages 1440 light");
    await ctx.close();
  }

  // Admin inbox for same conversation
  {
    const ctx = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      locale: "ar",
      colorScheme: "dark",
    });
    const page = await ctx.newPage();
    await loginAdmin(page);
    if (conversationId) {
      await page.goto(`${BASE}/admin/inbox/${conversationId}`, {
        waitUntil: "networkidle",
      });
    } else {
      await page.goto(`${BASE}/admin/inbox`, { waitUntil: "networkidle" });
    }
    await page.waitForTimeout(1000);
    await shot(page, "a-inbox-thread-dark-1440.png", "admin thread for portal trader 1440 dark");
    const plat = await page.getByText(/عبر منصة|via trader portal|platform/i).count();
    results.push({ scenario: "admin_channel_label", platformLabels: plat });

    // Live check: trader sends while admin has SSE open — watch for auto refresh
    const before = await page.locator("[data-msg-id], article, .rad-msg").count();
    await sendTraderPlatformMessage({
      traderId: trader.id,
      text: `تدقيق SSE — هل يظهر حياً؟ ${stamp}`,
    });
    await page.waitForTimeout(3500);
    const after = await page.locator("[data-msg-id], article, .rad-msg").count();
    // also check preview text
    const liveText = await page.getByText(`تدقيق SSE — هل يظهر حياً؟ ${stamp}`).count();
    results.push({
      scenario: "admin_sse_live_after_platform_send",
      before,
      after,
      liveText,
      status: liveText > 0 ? "WORKS" : "BROKEN",
    });
    await shot(page, "a-inbox-after-platform-send-dark-1440.png", `SSE liveText=${liveText}`);

    // Reload shows message
    await page.reload({ waitUntil: "networkidle" });
    await page.waitForTimeout(800);
    const afterReload = await page.getByText(`تدقيق SSE — هل يظهر حياً؟ ${stamp}`).count();
    results.push({
      scenario: "admin_reload_sees_platform",
      afterReload,
      status: afterReload > 0 ? "WORKS" : "BROKEN",
    });
    await shot(page, "a-inbox-reload-dark-1440.png", `reload sees platform msg=${afterReload}`);
    await ctx.close();
  }

  // Trader sees admin reply only after navigation (no live)
  {
    const ctx = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      locale: "ar",
      colorScheme: "dark",
    });
    const page = await ctx.newPage();
    await loginTrader(page);
    await page.goto(`${BASE}/trader/messages`, { waitUntil: "networkidle" });
    await page.waitForTimeout(500);
    const before = await page.getByText(`تدقيق بوابة — رد إدارة ${stamp}`).count();
    // Admin sends while trader page open
    if (conversationId && admin) {
      await sendAdminPlatformMessage({
        conversationId,
        adminId: admin.id,
        text: `رد حي للتاجر؟ ${stamp}`,
      });
    }
    await page.waitForTimeout(3500);
    const live = await page.getByText(`رد حي للتاجر؟ ${stamp}`).count();
    await page.reload({ waitUntil: "networkidle" });
    await page.waitForTimeout(600);
    const afterReload = await page.getByText(`رد حي للتاجر؟ ${stamp}`).count();
    results.push({
      scenario: "trader_live_vs_reload",
      before,
      liveWithoutReload: live,
      afterReload,
      status: live === 0 && afterReload > 0 ? "PARTIAL" : live > 0 ? "WORKS" : "BROKEN",
    });
    await shot(
      page,
      "t-messages-after-admin-reload-1440.png",
      `live=${live} reload=${afterReload}`
    );
    await ctx.close();
  }

  // Security: trader media URL without admin cookie
  if (conversationId) {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    await loginTrader(page);
    const res = await page.request.get(
      `${BASE}/api/media/whatsapp/${conversationId}/does-not-exist.bin`
    );
    results.push({
      scenario: "trader_media_api",
      status: res.status(),
      expect: "404 without admin",
    });
    await ctx.close();
  }

  writeFileSync(
    path.join(OUT, "UI-RESULTS.json"),
    JSON.stringify({ at: new Date().toISOString(), shots, results, conversationId }, null, 2)
  );
  console.log(JSON.stringify({ shots: shots.length, results }, null, 2));
  await browser.close();
  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
