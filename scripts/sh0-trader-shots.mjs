/**
 * SH0 trader shots via session cookie (avoids flaky server-action login in Playwright).
 */
import { chromium } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { SignJWT } from "jose";
import { PrismaClient } from "@prisma/client";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = path.join(ROOT, "docs/shipping/shots");
const BASE = "http://127.0.0.1:3000";

for (const line of fs.readFileSync(path.join(ROOT, ".env"), "utf8").split(/\r?\n/)) {
  if (!line || line.startsWith("#")) continue;
  const i = line.indexOf("=");
  if (i < 0) continue;
  process.env[line.slice(0, i).trim()] = line
    .slice(i + 1)
    .trim()
    .replace(/^["']|["']$/g, "");
}

const secret = process.env.AUTH_SECRET;
if (!secret || secret.length < 16) {
  console.error("AUTH_SECRET missing");
  process.exit(1);
}

const prisma = new PrismaClient();
const email = process.env.TRADER_EMAIL || "trader@rareoud.local";
const trader = await prisma.traderAccount.findUnique({ where: { email } });
if (!trader) {
  console.error("NO_TRADER");
  process.exit(1);
}
const token = await new SignJWT({
  email: trader.email,
  displayName: trader.displayName,
  role: "trader",
  mustChangePassword: false,
  pwv: trader.passwordChangedAt?.getTime() ?? 0,
})
  .setProtectedHeader({ alg: "HS256" })
  .setSubject(trader.id)
  .setIssuedAt()
  .setExpirationTime("12h")
  .sign(new TextEncoder().encode(secret));
await prisma.$disconnect();

const notesPath = path.join(OUT, "NOTES.json");
const prev = fs.existsSync(notesPath)
  ? JSON.parse(fs.readFileSync(notesPath, "utf8"))
  : { notes: [] };

const browser = await chromium.launch();
const context = await browser.newContext({ locale: "ar" });
await context.addCookies([
  {
    name: "ro_trader_session",
    value: token,
    url: BASE,
    httpOnly: true,
    sameSite: "Lax",
  },
]);
const page = await context.newPage();
const notes = (prev.notes || []).filter(
  (n) => !String(n.file).includes("trader") && n.file !== "(none)"
);

async function shot(name, see) {
  const file = path.join(OUT, `${name}.png`);
  await page.screenshot({ path: file, fullPage: false, animations: "disabled" });
  notes.push({ file: `${name}.png`, see });
  console.log(`OK ${name}: ${see}`);
}

for (const [w, h, tag] of [
  [1440, 900, "1440"],
  [390, 844, "390"],
]) {
  await page.setViewportSize({ width: w, height: h });
  await page.goto(`${BASE}/trader/wholesale`, { waitUntil: "networkidle" });
  await page.waitForTimeout(700);
  if (page.url().includes("/login")) {
    console.log("cookie rejected — still login at", page.url());
    notes.push({
      file: "(none)",
      see: "Trader cookie auth rejected; wholesale/deal portal shots skipped",
    });
    break;
  }
  await shot(
    `sh0-trader-wholesale-form-${tag}-ar`,
    "Trader wholesale: form/list with shipping destination selector (same static rate sheet as storefront)"
  );

  await page.goto(`${BASE}/trader/deals`, { waitUntil: "networkidle" });
  await page.waitForTimeout(400);
  const dealHref = await page.evaluate(() => {
    const a = [...document.querySelectorAll("a[href]")].find((el) =>
      (el.getAttribute("href") || "").startsWith("/trader/deals/")
    );
    return a?.getAttribute("href") || null;
  });
  if (dealHref) {
    await page.goto(`${BASE}${dealHref}`, { waitUntil: "networkidle" });
    await page.waitForTimeout(400);
    await shot(
      `sh0-trader-deal-detail-${tag}-ar`,
      "Trader deal detail: no shipping destination/method/cost UI"
    );
  } else {
    await shot(
      `sh0-trader-deal-list-${tag}-ar`,
      "Trader deals list — DealProposal has no shipping fields"
    );
  }
}

const ensure = [
  {
    file: "sh0-storefront-request-empty-1440-ar.png",
    see: "Storefront /request empty cart RTL: 'لا توجد قطع في طلبك' — shipping calculator hidden until cart has items",
  },
  {
    file: "sh0-storefront-request-shipping-1440-ar.png",
    see: "Storefront /request DE: 20kg oud heuristic; land 130 USD / air 150 USD cards with EUR alternate",
  },
  {
    file: "sh0-storefront-request-shipping-390-ar.png",
    see: "Storefront /request DE 390: method cards stacked; sticky تقدير الشحن 130 USD",
  },
];
for (const e of ensure.reverse()) {
  if (!notes.some((n) => n.file === e.file)) notes.unshift(e);
}

fs.writeFileSync(
  notesPath,
  JSON.stringify(
    {
      capturedAt: new Date().toISOString(),
      base: BASE,
      consoleErrorsSample: prev.errs || prev.consoleErrorsSample || [],
      notes,
    },
    null,
    2
  )
);
await browser.close();
console.log("done notes=", notes.length);
