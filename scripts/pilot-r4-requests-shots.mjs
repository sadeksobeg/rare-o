/**
 * Round 4 — requests list shots + Next issue check.
 * Run: node scripts/pilot-r4-requests-shots.mjs
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
    let v = line.slice(i + 1).trim().replace(/^["']|["']$/g, "");
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

async function issueCount(page) {
  // Open Next.js issues menu if present
  const portal = page.locator("nextjs-portal");
  if (!(await portal.count())) return { issueCount: 0, note: "no-portal" };
  // Prefer the shadow host button
  const clicked = await page.evaluate(() => {
    const host = document.querySelector("nextjs-portal");
    if (!host?.shadowRoot) return "no-shadow";
    const btn =
      host.shadowRoot.querySelector("button") ||
      host.shadowRoot.querySelector("[data-nextjs-toast]") ||
      host.shadowRoot.querySelector("[data-issues]");
    if (!btn) return "no-btn";
    const text = (btn.textContent || "").trim();
    btn.click();
    return text || "clicked";
  });
  await page.waitForTimeout(400);
  const count = await page.evaluate(() => {
    const host = document.querySelector("nextjs-portal");
    const root = host?.shadowRoot;
    if (!root) return 0;
    const body = root.textContent || "";
    const m = body.match(/(\d+)\s+Issue/i);
    if (m) return Number(m[1]);
    // Empty issues panel
    if (/No Issues|0 Issues|Clean/i.test(body)) return 0;
    // Look for issue rows
    const rows = root.querySelectorAll("[data-nextjs-errors], li, [role='listitem']");
    return rows.length > 0 && /Issue/i.test(body) ? rows.length : 0;
  });
  return { issueCount: count, clicked };
}

const browser = await chromium.launch();
const context = await browser.newContext({ locale: "ar" });
const page = await context.newPage();
fs.mkdirSync(OUT, { recursive: true });

await page.goto(`${BASE}/admin/login`, { waitUntil: "domcontentloaded" });
await page.fill('input[name="email"]', process.env.ADMIN_EMAIL);
await page.fill('input[name="password"]', process.env.ADMIN_PASSWORD);
await page.locator('button[type="submit"]').first().click();
await page.waitForURL((u) => !u.pathname.includes("/login"), { timeout: 20000 });

const shots = [];
for (const [w, h, tag] of [
  [1440, 900, "1440"],
  [390, 844, "390"],
]) {
  await page.setViewportSize({ width: w, height: h });
  for (const theme of tag === "390" ? ["dark"] : ["dark", "light"]) {
    await page.goto(`${BASE}/admin/requests`, { waitUntil: "networkidle" });
    await setTheme(page, theme);
    await page.waitForTimeout(400);
    const name = `r4-requests-${theme}-${tag}-ar.png`;
    await page.screenshot({ path: path.join(OUT, name), fullPage: false });
    const metrics = await page.evaluate(() => {
      const table = document.querySelector(".rad-dt");
      const seg = document.querySelector(".rad-seg");
      const rows = document.querySelectorAll(".rad-dt tbody tr").length;
      const h1 = document.querySelector(".rad-phead h1")?.textContent?.trim();
      return {
        h1,
        hasTable: Boolean(table),
        hasSeg: Boolean(seg),
        rows,
        bulkVisible: Boolean(document.querySelector(".rad-bulk.rad-on")),
      };
    });
    shots.push({ name, metrics });
  }
}

await page.setViewportSize({ width: 1440, height: 900 });
await page.goto(`${BASE}/admin/requests`, { waitUntil: "networkidle" });
await page.waitForTimeout(800);
const issues = await issueCount(page);

const report = { shots, issues };
fs.writeFileSync(
  path.join(OUT, "requests-shots.json"),
  JSON.stringify(report, null, 2)
);
console.log(JSON.stringify(report, null, 2));
await browser.close();
