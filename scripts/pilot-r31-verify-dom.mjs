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
await page.goto("http://127.0.0.1:3000/admin/login");
await page.fill('input[name="email"]', process.env.ADMIN_EMAIL);
await page.fill('input[name="password"]', process.env.ADMIN_PASSWORD);
await page.locator('button[type="submit"]').first().click();
await page.waitForURL((u) => !u.pathname.includes("/login"));
await page.goto("http://127.0.0.1:3000/admin/inbox", { waitUntil: "networkidle" });

const info = await page.evaluate(() => {
  const portal = document.querySelector('[data-portal="admin"]') || document.body;
  const avatars = [...document.querySelectorAll(".rad-cv .rad-avt")].slice(0, 10).map((el) => ({
    text: (el.textContent || "").replace(/\s+/g, "").trim(),
    hasSvg: Boolean(el.querySelector("svg")),
  }));
  const digitAvatars = avatars.filter((a) => !a.hasSvg && /^[0-9٠-٩+]/.test(a.text));
  const sb = document.querySelector(".rad-sb2");
  const inp = sb?.querySelector("input");
  return {
    avatars,
    digitAvatars,
    rawUnsupported: /\[unsupported(?::[^\]]*)?\]/i.test(document.body.innerText),
    inputBg: inp ? getComputedStyle(inp).backgroundColor : null,
    sbBg: sb ? getComputedStyle(sb).backgroundColor : null,
    surface2: getComputedStyle(portal).getPropertyValue("--rad-surface2").trim(),
    c0: getComputedStyle(portal).getPropertyValue("--rad-c0").trim(),
    hOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
  };
});
console.log(JSON.stringify(info, null, 2));
await browser.close();
if (info.digitAvatars.length || info.rawUnsupported || info.hOverflow) process.exit(1);
