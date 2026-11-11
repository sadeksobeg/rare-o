/**
 * CHAT-F2 — ≤4 local shots for reconnect-banner clearance above first bubble.
 *   node scripts/chat-f2-banner-shots.mjs
 */
import { chromium } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = path.join(ROOT, "docs/chat/shots/f2");
const BASE = process.env.PLAYWRIGHT_BASE_URL || "http://127.0.0.1:3000";

function loadDotEnv() {
  const envPath = path.join(ROOT, ".env");
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
    if (!line || line.startsWith("#")) continue;
    const i = line.indexOf("=");
    if (i < 0) continue;
    const key = line.slice(0, i).trim();
    const v = line.slice(i + 1).trim().replace(/^["']|["']$/g, "");
    if (!(key in process.env) || !process.env[key]) process.env[key] = v;
  }
}
loadDotEnv();

const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

async function setVal(page, sel, val) {
  const loc = page.locator(sel).first();
  await loc.waitFor({ state: "visible", timeout: 20000 });
  await loc.click();
  await loc.fill("");
  await page.keyboard.type(val, { delay: 5 });
}

async function loginAdmin(page) {
  await page.goto(`${BASE}/admin/login`, { waitUntil: "domcontentloaded" });
  await setVal(page, 'input[name="email"]', ADMIN_EMAIL);
  await setVal(page, 'input[name="password"]', ADMIN_PASSWORD);
  await Promise.all([
    page.waitForURL((u) => !u.pathname.includes("/login"), { timeout: 30000 }),
    page.getByRole("button", { name: /sign in|دخول|تسجيل الدخول/i }).click(),
  ]);
}

async function hideDevOverlays(page) {
  await page
    .addStyleTag({
      content: `
      nextjs-portal, [data-nextjs-toast], [data-next-badge], #__next-build-watcher,
      [data-nextjs-dialog-overlay], [data-nextjs-dev-overlay] { display: none !important; }
    `,
    })
    .catch(() => {});
}

async function openThreadWithMessages(page) {
  await page.goto(`${BASE}/admin/inbox`, {
    waitUntil: "domcontentloaded",
    timeout: 60000,
  });
  await page.waitForSelector('a[href^="/admin/inbox/"]', { timeout: 30000 });
  await page.waitForTimeout(400);
  const links = page.locator('a[href^="/admin/inbox/"]');
  const n = await links.count();
  let target = null;
  let href = null;
  for (let i = 0; i < n; i++) {
    const a = links.nth(i);
    const text = ((await a.innerText().catch(() => "")) || "").trim();
    const h = await a.getAttribute("href");
    if (!h || h === "/admin/inbox" || !h.slice("/admin/inbox/".length)) continue;
    if (/Demo Trader|sent-gate|بوابة WA-V|صورة/i.test(text)) {
      target = a;
      href = h;
      break;
    }
    if (!target) {
      target = a;
      href = h;
    }
  }
  if (!target || !href) throw new Error("no conversation link found");
  await Promise.all([
    page.waitForURL((u) => u.pathname.startsWith("/admin/inbox/") && u.pathname !== "/admin/inbox", {
      timeout: 30000,
    }),
    target.click(),
  ]);
  await page.waitForSelector(".rad-ct .rad-msgs", { timeout: 20000 });
  await page.waitForTimeout(500);
  return href;
}

async function ensureBanner(page) {
  return page.evaluate(() => {
    const ct = document.querySelector(".rad-ct");
    const msgs = ct?.querySelector(".rad-msgs");
    if (!ct || !msgs) return { ok: false, reason: "no_ct_msgs" };
    let bn = ct.querySelector(":scope > .rad-bn");
    if (!bn) {
      bn = document.createElement("div");
      bn.className = "rad-bn rad-warn f2-shot";
      bn.setAttribute("role", "status");
      bn.innerHTML =
        '<span>انقطع الاتصال — جارٍ إعادة المحاولة…</span><button type="button">إعادة</button>';
      ct.insertBefore(bn, msgs);
    }
    return { ok: true, injected: bn.classList.contains("f2-shot") };
  });
}

async function measureGap(page) {
  return page.evaluate(() => {
    const ct = document.querySelector(".rad-ct");
    if (!ct) return null;
    const banners = [...ct.querySelectorAll(":scope > .rad-bn")];
    const msgs = ct.querySelector(":scope > .rad-msgs");
    if (!banners.length || !msgs) return null;
    const bn = banners[banners.length - 1];
    const br = bn.getBoundingClientRect();
    const mr = msgs.getBoundingClientRect();
    const padTop = parseFloat(getComputedStyle(msgs).paddingTop) || 0;
    // Content starts at msgs top + padding; clearance vs banner bottom.
    const contentTop = mr.top + padTop;
    const gapBannerToContent = Math.round(contentTop - br.bottom);
    // First bubble currently visible in the msgs viewport (chat is bottom-sticky).
    const bubbles = [
      ...msgs.querySelectorAll(
        ".rad-bbl, .rad-bubble, [data-message-id], .rad-msg, .rad-row-msg"
      ),
    ];
    const visible = bubbles.find((el) => {
      const r = el.getBoundingClientRect();
      return r.bottom > mr.top + 4 && r.top < mr.bottom - 4 && r.height > 12;
    });
    return {
      bannerBottom: Math.round(br.bottom),
      msgsTop: Math.round(mr.top),
      contentTop: Math.round(contentTop),
      gapBannerToContent,
      msgsPaddingTop: `${padTop}px`,
      padTopPx: padTop,
      visibleBubbleTop: visible ? Math.round(visible.getBoundingClientRect().top) : null,
      hasRule: padTop >= 20,
    };
  });
}

async function main() {
  if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
    throw new Error("ADMIN_EMAIL / ADMIN_PASSWORD required");
  }
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const notes = [];

  async function capture(theme, width, name, see) {
    const context = await browser.newContext({
      viewport: { width, height: width <= 500 ? 844 : 900 },
      locale: "ar-SA",
      colorScheme: theme === "dark" ? "dark" : "light",
    });
    const page = await context.newPage();
    await loginAdmin(page);
    const href = await openThreadWithMessages(page);
    await page.evaluate((t) => {
      const root = document.querySelector('[data-portal="admin"]');
      if (root) root.setAttribute("data-theme", t);
      document.documentElement.setAttribute("data-theme", t);
    }, theme);
    const ensured = await ensureBanner(page);
    // Stick to latest messages so the shot shows bubbles under the banner pad.
    await page.evaluate(() => {
      const msgs = document.querySelector(".rad-ct > .rad-msgs");
      if (msgs) msgs.scrollTop = msgs.scrollHeight;
    });
    await page.waitForTimeout(200);
    await hideDevOverlays(page);
    const gap = await measureGap(page);
    const file = path.join(OUT, name);
    await page.screenshot({ path: file, fullPage: false, animations: "disabled" });
    notes.push({ file: name, see, href, ensured, gap });
    console.log(JSON.stringify({ file: name, see, href, ensured, gap }));
    await context.close();
  }

  try {
    await capture("dark", 1440, "f2-banner-dark-1440.png", "banner clear of first bubble @1440 dark");
    await capture("light", 1440, "f2-banner-light-1440.png", "banner clear of first bubble @1440 light");
    await capture("dark", 390, "f2-banner-dark-390.png", "banner clear of first bubble @390 dark");
    await capture("light", 390, "f2-banner-light-390.png", "banner clear of first bubble @390 light");
  } finally {
    await browser.close();
  }

  fs.writeFileSync(
    path.join(OUT, "NOTES.md"),
    notes
      .map(
        (n) =>
          `- ${n.file}: ${n.see}\n  href=${n.href}\n  gap=${JSON.stringify(n.gap)}\n`
      )
      .join("\n")
  );
  const bad = notes.filter(
    (n) => !n.gap || !n.gap.hasRule || (n.gap.padTopPx ?? 0) < 20
  );
  if (bad.length) {
    console.error("F2_SHOTS_GAP_FAIL", bad.map((b) => b.file));
    process.exit(2);
  }
  console.log("F2_SHOTS_DONE", notes.length);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
