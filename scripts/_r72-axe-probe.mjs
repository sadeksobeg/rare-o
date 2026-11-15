import { chromium } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: { width: 390, height: 844 },
  locale: "ar",
});
const page = await context.newPage();
await page.addInitScript(() => {
  try {
    localStorage.setItem("ro-portal-theme-v5", "dark");
  } catch {
    /* ignore */
  }
});
await page.goto("http://localhost:3000/trader/login", {
  waitUntil: "networkidle",
});
await page.locator("#email").fill("trader@rareoud.local");
await page.locator("#password").fill("ChangeMeNow!");
await page.getByRole("button", { name: /دخول|Sign in/i }).click();
await page.waitForURL((u) => !u.pathname.includes("/login"), {
  timeout: 45000,
});
await page.goto("http://localhost:3000/trader", {
  waitUntil: "domcontentloaded",
});
await page.evaluate(() => localStorage.setItem("ro-portal-theme-v5", "dark"));
await page.reload({ waitUntil: "networkidle" });
await page.waitForTimeout(1000);

const links = await page.evaluate(() =>
  [...document.querySelectorAll(".rad-tsh a")].map((a) => ({
    href: a.getAttribute("href"),
    text: a.textContent?.trim(),
    color: getComputedStyle(a).color,
    bg: getComputedStyle(a).backgroundColor,
  }))
);
console.log("tsh links", links);

const axe = await new AxeBuilder({ page })
  .withTags(["wcag2a", "wcag2aa"])
  .analyze();
console.log(
  JSON.stringify(
    axe.violations.map((v) => ({
      id: v.id,
      help: v.help,
      nodes: v.nodes.map((n) => ({
        html: n.html.slice(0, 220),
        target: n.target,
        failure: n.failureSummary,
      })),
    })),
    null,
    2
  )
);
await browser.close();
