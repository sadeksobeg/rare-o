/**
 * Browser UI audit for internal chat ↔ admin inbox (local).
 * No WhatsApp outbound — uses platform channel helpers only.
 */
import { chromium } from "@playwright/test";
import { mkdirSync, writeFileSync, readFileSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { prisma } from "@/lib/db/prisma";
import {
  getTraderConversation,
  sendAdminPlatformMessage,
  sendTraderPlatformMessage,
} from "@/lib/whatsapp/messaging/trader-channel";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = path.join(ROOT, "docs/ui/wa-v/internal-chat");
mkdirSync(OUT, { recursive: true });

function loadDotEnv() {
  const envPath = path.join(ROOT, ".env");
  if (!existsSync(envPath)) return;
  for (const line of readFileSync(envPath, "utf8").split(/\r?\n/)) {
    if (!line || line.startsWith("#")) continue;
    const i = line.indexOf("=");
    if (i < 0) continue;
    const k = line.slice(0, i).trim();
    const v = line
      .slice(i + 1)
      .trim()
      .replace(/^["']|["']$/g, "");
    if (!(k in process.env) || !process.env[k]) process.env[k] = v;
  }
}
loadDotEnv();

const BASE = process.env.PLAYWRIGHT_BASE_URL || "http://127.0.0.1:3000";
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@rareoud.local";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "";
const TRADER_EMAIL = process.env.TRADER_EMAIL || "trader@rareoud.local";
const TRADER_PASSWORD = process.env.TRADER_PASSWORD || "ChangeMeNow!";

async function setVal(page: import("@playwright/test").Page, sel: string, val: string) {
  const loc = page.locator(sel).first();
  await loc.waitFor({ state: "visible", timeout: 20000 });
  await loc.click();
  await loc.fill("");
  await page.keyboard.type(val, { delay: 8 });
}

async function loginTrader(page: import("@playwright/test").Page) {
  await page.goto(`${BASE}/trader/login`, { waitUntil: "domcontentloaded" });
  await setVal(page, 'input[name="email"]', TRADER_EMAIL);
  await setVal(page, 'input[name="password"]', TRADER_PASSWORD);
  await Promise.all([
    page.waitForURL(
      (u) => u.pathname.startsWith("/trader") && !u.pathname.includes("/login"),
      { timeout: 30000 }
    ),
    page.getByRole("button", { name: /sign in|دخول|تسجيل الدخول/i }).click(),
  ]);
}

async function loginAdmin(page: import("@playwright/test").Page) {
  await page.goto(`${BASE}/admin/login`, { waitUntil: "domcontentloaded" });
  await setVal(page, 'input[name="email"]', ADMIN_EMAIL);
  await setVal(page, 'input[name="password"]', ADMIN_PASSWORD);
  await Promise.all([
    page.waitForURL((u) => !u.pathname.includes("/login"), { timeout: 30000 }),
    page.getByRole("button", { name: /sign in|دخول|تسجيل الدخول/i }).click(),
  ]);
}

const shots: { file: string; note: string }[] = [];
async function shot(page: import("@playwright/test").Page, name: string, note: string) {
  await page.screenshot({ path: path.join(OUT, name), fullPage: false });
  shots.push({ file: name, note });
  console.log(`SHOT ${name}: ${note}`);
}

async function main() {
  if (!ADMIN_PASSWORD) throw new Error("ADMIN_PASSWORD missing");
  const trader = await prisma.traderAccount.findUnique({
    where: { email: TRADER_EMAIL },
    select: { id: true, phone: true, displayName: true },
  });
  if (!trader) throw new Error("trader missing: " + TRADER_EMAIL);
  const admin = await prisma.adminUser.findFirst({ select: { id: true } });
  if (!admin) throw new Error("admin missing");

  const stamp = Date.now();
  await sendTraderPlatformMessage({
    traderId: trader.id,
    text: `تدقيق بوابة — رسالة تاجر ${stamp}`,
  });
  let conversationId =
    (await getTraderConversation(trader.id))?.conversationId ?? null;
  if (conversationId) {
    await sendAdminPlatformMessage({
      conversationId,
      adminId: admin.id,
      text: `تدقيق بوابة — رد إدارة ${stamp}`,
    });
  }
  conversationId =
    (await getTraderConversation(trader.id))?.conversationId ?? conversationId;

  const browser = await chromium.launch({ headless: true });
  const results: Record<string, unknown>[] = [];

  {
    const ctx = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      locale: "ar",
      colorScheme: "dark",
    });
    const page = await ctx.newPage();
    await loginTrader(page);
    await page.goto(`${BASE}/trader/messages`, { waitUntil: "networkidle" });
    await page.waitForTimeout(700);
    const platformLbl = await page.getByText(/عبر المنصة|via platform/i).count();
    const empty = await page.getByText(/لا رسائل|No messages/i).count();
    results.push({ scenario: "trader_ui_1440_dark", platformLbl, empty });
    await shot(
      page,
      "t-messages-dark-1440.png",
      `platformLbl=${platformLbl} empty=${empty}`
    );
    await ctx.close();
  }

  {
    const ctx = await browser.newContext({
      viewport: { width: 390, height: 844 },
      locale: "ar",
      colorScheme: "dark",
    });
    const page = await ctx.newPage();
    await loginTrader(page);
    await page.goto(`${BASE}/trader/messages`, { waitUntil: "networkidle" });
    await page.waitForTimeout(500);
    await shot(page, "t-messages-dark-390.png", "mobile trader chat");
    await ctx.close();
  }

  {
    const ctx = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      locale: "ar",
      colorScheme: "light",
    });
    const page = await ctx.newPage();
    await loginTrader(page);
    await page.goto(`${BASE}/trader/messages`, { waitUntil: "networkidle" });
    const themeBtn = page.locator(".rad-th2-tools button, [data-theme-toggle]").first();
    try {
      await themeBtn.click({ timeout: 2000 });
    } catch {
      /* optional */
    }
    await page.waitForTimeout(400);
    await shot(page, "t-messages-light-1440.png", "trader light attempt");
    await ctx.close();
  }

  {
    const ctx = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      locale: "ar",
      colorScheme: "dark",
    });
    const page = await ctx.newPage();
    await loginAdmin(page);
    await page.goto(
      conversationId ? `${BASE}/admin/inbox/${conversationId}` : `${BASE}/admin/inbox`,
      { waitUntil: "domcontentloaded" }
    );
    await page.locator(".rad-th, .rad-ibx").first().waitFor({ state: "visible", timeout: 25000 });
    await page.waitForTimeout(900);
    const plat = await page.getByText(/عبر منصة التاجر|via trader portal/i).count();
    results.push({ scenario: "admin_channel_label", platformLabels: plat });
    await shot(page, "a-inbox-thread-dark-1440.png", `platformLabels=${plat}`);

    await sendTraderPlatformMessage({
      traderId: trader.id,
      text: `تدقيق SSE — هل يظهر حياً؟ ${stamp}`,
    });
    await page.waitForTimeout(3500);
    const liveText = await page
      .getByText(`تدقيق SSE — هل يظهر حياً؟ ${stamp}`)
      .count();
    results.push({
      scenario: "admin_sse_live_after_platform_send",
      liveText,
      status: liveText > 0 ? "WORKS" : "BROKEN",
    });
    await shot(page, "a-inbox-after-platform-send-dark-1440.png", `liveText=${liveText}`);

    await page.goto(page.url(), { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(1200);
    const afterReload = await page
      .getByText(`تدقيق SSE — هل يظهر حياً؟ ${stamp}`)
      .count();
    results.push({
      scenario: "admin_reload_sees_platform",
      afterReload,
      status: afterReload > 0 ? "WORKS" : "BROKEN",
    });
    await shot(page, "a-inbox-reload-dark-1440.png", `reload=${afterReload}`);
    await ctx.close();
  }

  {
    const ctx = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      locale: "ar",
      colorScheme: "dark",
    });
    const page = await ctx.newPage();
    await loginTrader(page);
    await page.goto(`${BASE}/trader/messages`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(800);
    if (conversationId) {
      await sendAdminPlatformMessage({
        conversationId,
        adminId: admin.id,
        text: `رد حي للتاجر؟ ${stamp}`,
      });
    }
    await page.waitForTimeout(3500);
    const live = await page.getByText(`رد حي للتاجر؟ ${stamp}`).count();
    await page.goto(`${BASE}/trader/messages`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(800);
    const afterReload = await page.getByText(`رد حي للتاجر؟ ${stamp}`).count();
    results.push({
      scenario: "trader_live_vs_reload",
      liveWithoutReload: live,
      afterReload,
      status: live === 0 && afterReload > 0 ? "PARTIAL" : live > 0 ? "WORKS" : "BROKEN",
    });
    await shot(
      page,
      "t-messages-after-admin-reload-1440.png",
      `live=${live} reload=${afterReload}`
    );

    // Composer send from UI
    const box = page.locator("textarea").first();
    await box.fill(`رسالة من الواجهة ${stamp}`);
    await page.locator('button[type="submit"]').first().click();
    await page.waitForTimeout(1500);
    const sent = await page.getByText(`رسالة من الواجهة ${stamp}`).count();
    results.push({
      scenario: "trader_composer_send",
      sent,
      status: sent > 0 ? "WORKS" : "PARTIAL",
    });
    await shot(page, "t-messages-composer-send-1440.png", `sent=${sent}`);
    await ctx.close();
  }

  {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    await loginTrader(page);
    if (conversationId) {
      const res = await page.request.get(
        `${BASE}/api/media/whatsapp/${conversationId}/nope.bin`
      );
      results.push({
        scenario: "trader_media_api_status",
        statusCode: res.status(),
        status: res.status() === 404 ? "WORKS" : "PARTIAL",
      });
    }
    await ctx.close();
  }

  writeFileSync(
    path.join(OUT, "UI-RESULTS.json"),
    JSON.stringify({ at: new Date().toISOString(), conversationId, shots, results }, null, 2)
  );
  console.log(JSON.stringify({ shots: shots.length, results }, null, 2));
  await browser.close();
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
