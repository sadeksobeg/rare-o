/**
 * Gate: every input/textarea/select on in-scope admin routes must NOT use
 * lavender elevated fill (#4c4666 / rgb close). Expected ≈ --rad-surface2.
 *
 * Run: node scripts/pilot-r5-input-bg-gate.mjs
 */
import { chromium } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { hideNextDevIndicator } from "./pilot-hide-next-indicator.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = path.join(ROOT, "docs/ui/pilot-r5");
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

const ROUTES = [
  "/admin",
  "/admin/inbox",
  "/admin/requests",
  "/admin/deals",
  "/admin/wholesale",
  "/admin/customers",
  "/admin/products",
];

const FORBIDDEN = [
  { name: "#4c4666", r: 76, g: 70, b: 102 },
  { name: "#372e4c", r: 55, g: 46, b: 76 },
];

function parseRgb(s) {
  const m = String(s).match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/i);
  if (!m) return null;
  return { r: +m[1], g: +m[2], b: +m[3] };
}

function near(a, b, tol = 8) {
  return (
    Math.abs(a.r - b.r) <= tol &&
    Math.abs(a.g - b.g) <= tol &&
    Math.abs(a.b - b.b) <= tol
  );
}

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

const browser = await chromium.launch();
const context = await browser.newContext({ locale: "ar" });
const page = await context.newPage();
fs.mkdirSync(OUT, { recursive: true });

await page.goto(`${BASE}/admin/login`, { waitUntil: "domcontentloaded" });
await page.fill('input[name="email"]', process.env.ADMIN_EMAIL);
await page.fill('input[name="password"]', process.env.ADMIN_PASSWORD);
await page.locator('button[type="submit"]').first().click();
await page.waitForURL((u) => !u.pathname.includes("/login"), { timeout: 20000 });

const findings = [];
let failCount = 0;
let checked = 0;

for (const route of ROUTES) {
  for (const [w, h, tag] of [
    [1440, 900, "1440"],
    [390, 844, "390"],
  ]) {
    await page.setViewportSize({ width: w, height: h });
    for (const theme of ["dark", "light"]) {
      await page.goto(`${BASE}${route}`, { waitUntil: "domcontentloaded" });
      await setTheme(page, theme);
      await hideNextDevIndicator(page);
      await page.waitForTimeout(250);

      const expected = await page.evaluate(() => {
        const root =
          document.querySelector('[data-portal="admin"]') ||
          document.documentElement;
        return getComputedStyle(root).getPropertyValue("--rad-surface2").trim();
      });

      const fields = await page.evaluate(() => {
        const sel =
          'input:not([type="checkbox"]):not([type="radio"]):not([type="file"]):not([type="hidden"]), textarea, select';
        return [...document.querySelectorAll(sel)].map((el) => {
          const cs = getComputedStyle(el);
          const r = el.getBoundingClientRect();
          return {
            tag: el.tagName.toLowerCase(),
            type: el.getAttribute("type") || "",
            name: el.getAttribute("name") || el.getAttribute("aria-label") || "",
            bg: cs.backgroundColor,
            visible: r.width > 0 && r.height > 0 && cs.visibility !== "hidden",
          };
        });
      });

      for (const f of fields.filter((x) => x.visible)) {
        checked += 1;
        const rgb = parseRgb(f.bg);
        const forbiddenHit = rgb
          ? FORBIDDEN.find((c) => near(rgb, c))
          : null;
        const row = {
          route,
          theme,
          viewport: tag,
          expectedToken: expected,
          field: f,
          forbidden: forbiddenHit?.name || null,
          ok: !forbiddenHit,
        };
        if (!row.ok) {
          failCount += 1;
          findings.push(row);
        }
      }
    }
  }
}

const report = {
  checked,
  failCount,
  passCount: checked - failCount,
  failures: findings.slice(0, 80),
};
fs.writeFileSync(
  path.join(OUT, "input-bg-gate.json"),
  JSON.stringify(report, null, 2)
);
console.log(JSON.stringify(report, null, 2));
await browser.close();
process.exit(failCount > 0 ? 1 : 0);
