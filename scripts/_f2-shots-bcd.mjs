/** Resume F2 shots using seed ids in scripts/_f2-seed.json */
import { chromium } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = path.join(ROOT, "docs/chat/shots/f2");
const BASE = process.env.PLAYWRIGHT_BASE_URL || "http://127.0.0.1:3000";
const seeded = JSON.parse(
  fs.readFileSync(path.join(ROOT, "scripts/_f2-seed.json"), "utf8").replace(/^\uFEFF/, "")
);

function loadDotEnv() {
  const envPath = path.join(ROOT, ".env");
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
    if (!line || line.startsWith("#")) continue;
    const i = line.indexOf("=");
    if (i < 0) continue;
    const k = line.slice(0, i).trim();
    const v = line.slice(i + 1).trim().replace(/^["']|["']$/g, "");
    if (!(k in process.env) || !process.env[k]) process.env[k] = v;
  }
}
loadDotEnv();

async function setVal(page, sel, val) {
  const loc = page.locator(sel).first();
  await loc.waitFor({ state: "visible", timeout: 30000 });
  await loc.click();
  await loc.fill("");
  await page.keyboard.type(val, { delay: 2 });
}

async function clickLogin(page) {
  const btn = page.locator('button[type="submit"]').first();
  await btn.waitFor({ state: "visible", timeout: 30000 });
  await btn.click();
}

async function hide(page) {
  await page
    .addStyleTag({
      content:
        "nextjs-portal,[data-nextjs-toast],[data-next-badge],#__next-build-watcher,[data-nextjs-dialog-overlay],[data-nextjs-dev-overlay]{display:none!important}",
    })
    .catch(() => {});
}

const notes = [];
async function shot(page, name, see) {
  await hide(page);
  await page.screenshot({
    path: path.join(OUT, name),
    fullPage: false,
    animations: "disabled",
  });
  notes.push({ file: name, see });
  console.log("SEE", name, "=>", see);
}

const browser = await chromium.launch({ headless: true });
try {
  {
    const ctx = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      locale: "ar-SA",
      colorScheme: "dark",
    });
    const page = await ctx.newPage();
    await page.goto(`${BASE}/admin/login`, { waitUntil: "domcontentloaded", timeout: 90000 });
    await setVal(page, 'input[name="email"]', process.env.ADMIN_EMAIL);
    await setVal(page, 'input[name="password"]', process.env.ADMIN_PASSWORD);
    await clickLogin(page);
    await page.waitForURL((u) => !u.pathname.includes("/login"), {
      timeout: 90000,
      waitUntil: "domcontentloaded",
    });

    await page.goto(`${BASE}/admin/inbox/${seeded.mergedConversationId}`, {
      waitUntil: "domcontentloaded",
      timeout: 90000,
    });
    await page.waitForSelector(".rad-ct .rad-msgs", { timeout: 60000 });
    await page.waitForTimeout(800);
    let body = await page.locator("body").innerText();
    let hasWa = /F2-WA/i.test(body);
    let hasPlat = /F2-PLAT/i.test(body);
    await shot(
      page,
      "f2-merged-admin-1440.png",
      `Admin @1440 ONE merged thread: SEE F2-WA + F2-PLAT bodies/chips (wa=${hasWa} plat=${hasPlat}).`
    );
    if (!hasWa || !hasPlat) throw new Error("admin missing channels: " + body.slice(0, 200));

    await page.goto(`${BASE}/admin/inbox/${seeded.emptyPlatformConversationId}`, {
      waitUntil: "domcontentloaded",
      timeout: 90000,
    });
    await page.waitForTimeout(700);
    body = await page.locator("body").innerText();
    const emptyHit = /تاجر بلا هاتف|منصة فقط|F2|بلا هاتف/i.test(body);
    await shot(
      page,
      "f2-empty-phone-admin-1440.png",
      `Empty-phone platform thread @1440: SEE trader-without-phone / platform-only — not merged with LID. hit=${emptyHit}`
    );

    await page.goto(`${BASE}/admin/inbox/${seeded.emptyOrphanLidId}`, {
      waitUntil: "domcontentloaded",
      timeout: 90000,
    });
    await page.waitForTimeout(700);
    body = await page.locator("body").innerText();
    const orphanHit = /منفصلاً|بلا ربط|LID|وارد LID/i.test(body);
    await shot(
      page,
      "f2-empty-phone-orphan-lid-1440.png",
      `Orphan LID (traderId null) @1440: SEE separate unlinked inbound — no auto-link. hit=${orphanHit}`
    );
    if (!emptyHit || !orphanHit) {
      throw new Error(`empty-phone weak emptyHit=${emptyHit} orphanHit=${orphanHit}`);
    }
    await ctx.close();
  }

  for (const width of [1440, 390]) {
    const ctx = await browser.newContext({
      viewport: { width, height: width === 390 ? 844 : 900 },
      locale: "ar-SA",
      colorScheme: "dark",
      isMobile: width === 390,
      hasTouch: width === 390,
    });
    const page = await ctx.newPage();
    await page.goto(`${BASE}/trader/login`, { waitUntil: "domcontentloaded", timeout: 90000 });
    await setVal(page, 'input[name="email"]', process.env.TRADER_EMAIL || "trader@rareoud.local");
    await setVal(page, 'input[name="password"]', process.env.TRADER_PASSWORD || "ChangeMeNow!");
    await clickLogin(page);
    try {
      await page.waitForURL(
        (u) => u.pathname.startsWith("/trader") && !u.pathname.includes("/login"),
        { timeout: 90000, waitUntil: "domcontentloaded" }
      );
    } catch (e) {
      await page.screenshot({
        path: path.join(OUT, `f2-trader-login-fail-${width}.png`),
        fullPage: false,
      });
      const t = await page.locator("body").innerText().catch(() => "");
      throw new Error(`trader login failed @${width}: ${page.url()} body=${t.slice(0, 300)}`);
    }
    await page.goto(`${BASE}/trader/messages`, {
      waitUntil: "domcontentloaded",
      timeout: 90000,
    });
    await page.waitForTimeout(1000);
    const body = await page.locator("body").innerText();
    const hasWa = /F2-WA/i.test(body);
    const hasPlat = /F2-PLAT/i.test(body);
    const geom =
      width === 390
        ? await page.evaluate(() => {
            const ta = document.querySelector("textarea");
            const composer = ta?.closest("form") || ta?.parentElement;
            const navs = [...document.querySelectorAll("nav")];
            const tab = navs[navs.length - 1];
            const cr = composer?.getBoundingClientRect();
            const tr = tab?.getBoundingClientRect();
            return {
              composerBottom: cr ? Math.round(cr.bottom) : null,
              tabTop: tr ? Math.round(tr.top) : null,
              gap: cr && tr ? Math.round(tr.top - cr.bottom) : null,
            };
          })
        : null;
    const name = width === 1440 ? "f2-merged-trader-1440.png" : "f2-merged-trader-390.png";
    await shot(
      page,
      name,
      width === 1440
        ? `Trader /messages @1440 same merge: SEE F2-WA + F2-PLAT (wa=${hasWa} plat=${hasPlat}).`
        : `Trader @390: SEE composer above tabs gap=${geom?.gap}; channels wa=${hasWa} plat=${hasPlat}.`
    );
    if (!hasWa || !hasPlat) throw new Error(`trader ${width} missing channels`);
    if (width === 390 && geom?.gap != null && geom.gap < -4) {
      throw new Error("composer overlaps tabs " + JSON.stringify(geom));
    }
    await ctx.close();
  }
} finally {
  await browser.close();
}

fs.writeFileSync(
  path.join(OUT, "FEATURE-NOTES.md"),
  notes.map((n) => `- **${n.file}:** ${n.see}`).join("\n") + "\n"
);
console.log("F2_BCD_DONE", notes.length);
