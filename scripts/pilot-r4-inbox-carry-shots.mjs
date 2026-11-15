/**
 * Round 4 start — inbox carry-over shots + metrics (1440/390 × dark/light, ar).
 * Run: node scripts/pilot-r4-inbox-carry-shots.mjs
 */
import { chromium } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = path.join(ROOT, "docs/ui/pilot-r4");
const BASE = process.env.PLAYWRIGHT_BASE_URL || "http://127.0.0.1:3000";

function loadDotEnv() {
  const envPath = path.join(ROOT, ".env");
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
    if (!line || line.startsWith("#")) continue;
    const i = line.indexOf("=");
    if (i < 0) continue;
    const k = line.slice(0, i).trim();
    let v = line.slice(i + 1).trim();
    v = v.replace(/^["']|["']$/g, "");
    if (
      !(k in process.env) ||
      !process.env[k] ||
      k.startsWith("ADMIN_") ||
      k === "DATABASE_URL"
    ) {
      process.env[k] = v;
    }
  }
}
loadDotEnv();

const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

async function setTheme(page, theme) {
  await page.evaluate((t) => {
    const root =
      document.querySelector('[data-portal="admin"]') ||
      document.documentElement;
    root.setAttribute("data-theme", t);
    if (t === "light") root.classList.add("light");
    else root.classList.remove("light");
  }, theme);
}

async function main() {
  if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
    throw new Error("Set ADMIN_EMAIL / ADMIN_PASSWORD");
  }
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch();
  const context = await browser.newContext({ locale: "ar" });
  const page = await context.newPage();

  await page.goto(`${BASE}/admin/login`, { waitUntil: "domcontentloaded" });
  await page.fill('input[name="email"]', ADMIN_EMAIL);
  await page.fill('input[name="password"]', ADMIN_PASSWORD);
  await page.locator('button[type="submit"]').first().click();
  await page.waitForURL((url) => !url.pathname.includes("/login"), {
    timeout: 20000,
  });

  const shots = [];
  for (const [w, h, tag] of [
    [1440, 900, "1440"],
    [390, 844, "390"],
  ]) {
    await page.setViewportSize({ width: w, height: h });
    for (const theme of ["dark", "light"]) {
      await page.goto(`${BASE}/admin/inbox`, { waitUntil: "networkidle" });
      await setTheme(page, theme);
      await page.waitForTimeout(350);

      const metrics = await page.evaluate(() => {
        const pageEl = document.querySelector(".rad-page");
        const ibx = document.querySelector(".rad-ibx");
        const logo = document.querySelector(
          ".rad-side img, .rad-brand img, [data-portal='admin'] aside img"
        );
        const cs = pageEl ? getComputedStyle(pageEl) : null;
        const hint =
          document.querySelector(".rad-ept p")?.textContent?.trim() || "";
        const emptyPrev = [...document.querySelectorAll(".rad-cp-empty")]
          .slice(0, 5)
          .map((e) => e.textContent?.trim());
        const dashRows = [...document.querySelectorAll(".rad-cv")].filter(
          (r) => {
            const p = r.querySelector(".rad-cp span");
            const t = (p?.textContent || "").trim();
            return t === "—" || t === "-";
          }
        ).length;
        const toast = document.querySelector("[data-nextjs-toast]");
        const issueBtn = [...document.querySelectorAll("button, a")].find((el) =>
          /issue/i.test(el.textContent || "")
        );
        return {
          pad: cs
            ? {
                t: cs.paddingTop,
                r: cs.paddingRight,
                b: cs.paddingBottom,
                l: cs.paddingLeft,
              }
            : null,
          logoSrc: logo?.getAttribute("src") || null,
          logoBox: logo
            ? {
                w: Math.round(logo.getBoundingClientRect().width),
                h: Math.round(logo.getBoundingClientRect().height),
              }
            : null,
          hint,
          emptyPrev,
          dashRows,
          issueToast: Boolean(toast),
          issueBtnText: issueBtn?.textContent?.trim() || null,
          ibxH: ibx ? Math.round(ibx.getBoundingClientRect().height) : 0,
          pageH: pageEl
            ? Math.round(pageEl.getBoundingClientRect().height)
            : 0,
        };
      });

      const listName = `r4-inbox-list-${theme}-${tag}-ar.png`;
      await page.screenshot({
        path: path.join(OUT, listName),
        fullPage: false,
      });
      shots.push({ name: listName, metrics });

      const href = await page.locator(".rad-cv").first().getAttribute("href");
      if (href) {
        await page.goto(`${BASE}${href}`, { waitUntil: "networkidle" });
        await setTheme(page, theme);
        await page.waitForTimeout(350);
        if (w <= 1320) {
          const ctxBtn = page.locator("#ctxb, .rad-ctxbtn").first();
          if (await ctxBtn.count()) {
            await ctxBtn.click({ force: true }).catch(() => {});
            await page.waitForTimeout(250);
          }
        }
        const threadMetrics = await page.evaluate(() => {
          const emptyTitle =
            document.querySelector(".rad-ept-thread b")?.textContent?.trim() ||
            null;
          const biz = document.querySelector(
            ".rad-rec, .rad-biz-ctx, [aria-label*='سياق'], [aria-label*='Business']"
          );
          const bizClass = biz?.className || null;
          const bdiKeys = [...document.querySelectorAll(".rad-ept bdi")].map(
            (el) => el.textContent
          );
          return { emptyTitle, bizClass, bdiKeys };
        });
        const threadName = `r4-inbox-thread-${theme}-${tag}-ar.png`;
        await page.screenshot({
          path: path.join(OUT, threadName),
          fullPage: false,
        });
        shots.push({ name: threadName, threadMetrics });
      }
    }
  }

  fs.writeFileSync(
    path.join(OUT, "inbox-carry-metrics.json"),
    JSON.stringify(shots, null, 2)
  );
  console.log(JSON.stringify(shots, null, 2));
  await browser.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
