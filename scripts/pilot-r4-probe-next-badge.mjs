/**
 * Probe Next.js bottom-left issue indicator more carefully.
 */
import { chromium } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
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
    if (!(k in process.env) || !process.env[k] || k.startsWith("ADMIN_") || k === "DATABASE_URL") {
      process.env[k] = v;
    }
  }
}
loadDotEnv();

const browser = await chromium.launch();
const page = await browser.newPage({ locale: "ar" });
page.on("console", (msg) => {
  if (msg.type() === "error" || msg.type() === "warning") {
    console.log(`[console.${msg.type()}]`, msg.text().slice(0, 400));
  }
});
page.on("pageerror", (err) => console.log("[pageerror]", err.message.slice(0, 400)));

await page.goto(`${BASE}/admin/login`, { waitUntil: "domcontentloaded" });
await page.fill('input[name="email"]', process.env.ADMIN_EMAIL);
await page.fill('input[name="password"]', process.env.ADMIN_PASSWORD);
await page.locator('button[type="submit"]').first().click();
await page.waitForURL((u) => !u.pathname.includes("/login"), { timeout: 20000 });

await page.goto(`${BASE}/admin/inbox`, { waitUntil: "networkidle" });
await page.waitForTimeout(1500);

const probe = await page.evaluate(() => {
  const all = [...document.querySelectorAll("*")];
  const nextRelated = all
    .filter((el) => {
      const id = el.id || "";
      const cls = typeof el.className === "string" ? el.className : "";
      const tag = el.tagName.toLowerCase();
      return (
        tag.includes("next") ||
        id.includes("next") ||
        cls.includes("next") ||
        (el.getAttribute("data-nextjs-toast") != null) ||
        (el.getAttribute("data-next-mark-loading") != null)
      );
    })
    .slice(0, 40)
    .map((el) => ({
      tag: el.tagName,
      id: el.id,
      cls: typeof el.className === "string" ? el.className.slice(0, 120) : "",
      text: (el.textContent || "").trim().slice(0, 80),
      attrs: [...el.attributes].map((a) => a.name).slice(0, 12),
    }));

  // Look for fixed bottom-left widgets
  const fixed = all
    .filter((el) => {
      const s = getComputedStyle(el);
      if (s.position !== "fixed") return false;
      const r = el.getBoundingClientRect();
      return r.bottom > window.innerHeight - 80 && r.left < 80 && r.width < 120 && r.height < 120;
    })
    .map((el) => ({
      tag: el.tagName,
      text: (el.textContent || "").trim().slice(0, 100),
      html: el.outerHTML.slice(0, 300),
      rect: (() => {
        const r = el.getBoundingClientRect();
        return {
          x: Math.round(r.x),
          y: Math.round(r.y),
          w: Math.round(r.width),
          h: Math.round(r.height),
        };
      })(),
    }));

  return { nextRelated, fixed, bodyIssues: (document.body.innerText || "").includes("Issue") };
});

console.log(JSON.stringify(probe, null, 2));

const out = path.join(ROOT, "docs/ui/pilot-r4/next-badge-probe.png");
await page.screenshot({ path: out, fullPage: false });
console.log("shot", out);
await browser.close();
