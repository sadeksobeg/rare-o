// Quick targeted re-check of the axe violations found by the full capture
// run, after fixing them — not the full 40-combination suite, just enough
// to confirm each fix actually worked before re-running everything.
import { chromium } from "@playwright/test";
import fs from "node:fs";

const BASE = "http://localhost:3101";
const axeSource = fs.readFileSync("node_modules/axe-core/axe.min.js", "utf8");

const pages = ["/login", "/admin", "/admin/traders", "/admin/team", "/admin/customers", "/admin/audit-log", "/admin/profile", "/force-password-change", "/trader", "/", "/admin/brokerage", "/trader/brokerage"];

const browser = await chromium.launch();
let anyViolations = false;
for (const url of pages) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  await page.goto(BASE + url, { waitUntil: "networkidle" });
  await page.addScriptTag({ content: axeSource });
  await page.waitForFunction(() => document.fonts.ready);
  const violations = await page.evaluate(async () => {
    const res = await window.axe.run();
    return res.violations.map((v) => ({ id: v.id, nodes: v.nodes.length }));
  });
  if (violations.length > 0) {
    anyViolations = true;
    console.log(url, "VIOLATIONS:", JSON.stringify(violations));
  } else {
    console.log(url, "clean");
  }
  await context.close();
}
await browser.close();
console.log(anyViolations ? "\nSome violations remain." : "\nAll clean.");
