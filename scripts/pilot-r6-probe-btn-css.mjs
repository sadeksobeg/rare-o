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
  if (k === "ADMIN_EMAIL" || k === "ADMIN_PASSWORD") process.env[k] = v;
}

const browser = await chromium.launch();
const page = await browser.newPage();
await page.goto("http://localhost:3000/admin/login", { waitUntil: "networkidle" });
await page.fill('input[name="email"]', process.env.ADMIN_EMAIL);
await page.fill('input[name="password"]', process.env.ADMIN_PASSWORD);
await page.click('button[type="submit"]');
await page.waitForURL((u) => !u.pathname.includes("/login"));
await page.evaluate(() => localStorage.setItem("ro-portal-theme-v5", "dark"));
await page.goto("http://localhost:3000/admin/traders", { waitUntil: "networkidle" });

const info = await page.getByRole("button", { name: /إضافة تاجر/ }).evaluate((el) => {
  const matched = [];
  for (const sheet of [...document.styleSheets]) {
    let rules;
    try {
      rules = [...sheet.cssRules];
    } catch {
      continue;
    }
    for (const rule of rules) {
      if (!(rule instanceof CSSStyleRule)) continue;
      try {
        if (!el.matches(rule.selectorText)) continue;
      } catch {
        continue;
      }
      const bg = rule.style.getPropertyValue("background") || rule.style.getPropertyValue("background-color");
      const color = rule.style.getPropertyValue("color");
      if (!bg && !color) continue;
      matched.push({
        sel: rule.selectorText,
        bg,
        color,
        bgPri: rule.style.getPropertyPriority("background") || rule.style.getPropertyPriority("background-color"),
        colorPri: rule.style.getPropertyPriority("color"),
      });
    }
  }
  const cs = getComputedStyle(el);
  return {
    matched,
    computed: { bg: cs.backgroundColor, color: cs.color },
    ownRadBtn: cs.getPropertyValue("--rad-btn"),
    ownRadBtnTx: cs.getPropertyValue("--rad-btn-tx"),
  };
});
console.log(JSON.stringify(info, null, 2));
await browser.close();
