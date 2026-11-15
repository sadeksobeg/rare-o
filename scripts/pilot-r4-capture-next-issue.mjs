import { chromium } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
for (const line of fs.readFileSync(path.join(ROOT, ".env"), "utf8").split(/\r?\n/)) {
  if (!line || line.startsWith("#")) continue;
  const i = line.indexOf("=");
  if (i < 0) continue;
  const k = line.slice(0, i).trim();
  let v = line.slice(i + 1).trim().replace(/^["']|["']$/g, "");
  if (k.startsWith("ADMIN_") || k === "DATABASE_URL") process.env[k] = v;
}

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const consoleErrors = [];
const pageErrors = [];
page.on("console", (msg) => {
  if (msg.type() === "error") consoleErrors.push(msg.text());
});
page.on("pageerror", (err) => pageErrors.push(String(err)));

await page.goto("http://127.0.0.1:3000/admin/login");
await page.fill('input[name="email"]', process.env.ADMIN_EMAIL);
await page.fill('input[name="password"]', process.env.ADMIN_PASSWORD);
await page.locator('button[type="submit"]').first().click();
await page.waitForURL((u) => !u.pathname.includes("/login"));
await page.goto("http://127.0.0.1:3000/admin/inbox", { waitUntil: "networkidle" });
await page.waitForTimeout(1500);

const issueBtn = page.locator("nextjs-portal, [data-nextjs-toast], button:has-text('Issue'), [aria-label*='Issue']").first();
const overlay = await page.evaluate(() => {
  const nodes = [...document.querySelectorAll("nextjs-portal, [data-next-badge], [data-nextjs-dialog], [data-nextjs-toast]")];
  return nodes.map((n) => ({
    tag: n.tagName,
    text: (n.shadowRoot?.textContent || n.textContent || "").slice(0, 2000),
    html: n.outerHTML.slice(0, 500),
  }));
});

// Try clicking the issue badge if present
const clicked = await page.evaluate(() => {
  const all = [...document.querySelectorAll("*")];
  const badge = all.find((el) => /1\s*Issue/i.test(el.textContent || "") && (el.tagName === "BUTTON" || el.getAttribute("role") === "button" || el.onclick));
  if (badge) {
    badge.click();
    return true;
  }
  // shadow DOM in nextjs-portal
  const portals = [...document.querySelectorAll("nextjs-portal")];
  for (const p of portals) {
    const btn = p.shadowRoot?.querySelector("button");
    if (btn) {
      btn.click();
      return "shadow";
    }
  }
  return false;
});
await page.waitForTimeout(800);

const afterClick = await page.evaluate(() => {
  const portals = [...document.querySelectorAll("nextjs-portal")];
  return portals.map((p) => ({
    text: (p.shadowRoot?.textContent || p.textContent || "").slice(0, 4000),
  }));
});

await page.screenshot({
  path: path.join(ROOT, "docs/ui/pilot-r2/round4-next-issue-probe.png"),
  fullPage: false,
});

const issueCount = await page.evaluate(() => {
  const portals = [...document.querySelectorAll("nextjs-portal")];
  for (const p of portals) {
    const t = p.shadowRoot?.textContent || "";
    const m = t.match(/(\d+)\s*Issue/i);
    if (m) return Number(m[1]);
  }
  // Visible badge text
  const body = document.body.innerText;
  const m2 = body.match(/(\d+)\s*Issue/i);
  return m2 ? Number(m2[1]) : 0;
});

console.log(
  JSON.stringify(
    {
      issueCount,
      clicked,
      consoleErrors: consoleErrors.slice(0, 20),
      pageErrors: pageErrors.slice(0, 10),
      shadowSnippet: (afterClick[0]?.text || "")
        .replace(/\s+/g, " ")
        .match(/Error[^.]{0,200}|hydrat[^.]{0,200}|key prop[^.]{0,200}|Issue[^.]{0,120}/i)?.[0],
    },
    null,
    2
  )
);
await browser.close();
