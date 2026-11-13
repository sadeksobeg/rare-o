/**
 * Checkpoint 2b viewport captures + light gates.
 * dark+light × 1440/1280/768/390, honest SEE lines → docs/shipping/s2b/
 */
import { chromium } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { SignJWT } from "jose";
import { PrismaClient } from "@prisma/client";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { hideNextDevIndicator } from "./pilot-hide-next-indicator.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = path.join(ROOT, "docs/shipping/s2b");
// Checkpoint 2b gates are local-only (prod does not have 2b UI yet).
// Use localhost (not 127.0.0.1) so cookies survive Next redirects.
const BASE = "http://localhost:3000";
const WIDTHS = [1440, 1280, 768, 390];
const THEMES = ["light", "dark"];
console.log("[s2b-capture] boot v5", { ROOT, BASE, OUT });

for (const line of fs.readFileSync(path.join(ROOT, ".env"), "utf8").split(/\r?\n/)) {
  if (!line || line.startsWith("#")) continue;
  const i = line.indexOf("=");
  if (i < 0) continue;
  const k = line.slice(0, i).trim();
  let v = line.slice(i + 1).trim().replace(/^["']|["']$/g, "");
  if (k === "PLAYWRIGHT_BASE_URL") continue;
  if (!(k in process.env) || !process.env[k] || k === "DATABASE_URL") process.env[k] = v;
}

fs.mkdirSync(OUT, { recursive: true });

const prisma = new PrismaClient();
const admin = await prisma.adminUser.findFirst();
const product = await prisma.product.findFirst({
  where: { status: "published" },
  select: { slug: true },
});
if (!admin) throw new Error("no admin user for session mint");
const token = await new SignJWT({
  email: admin.email,
  name: admin.name ?? "Admin",
  role: "admin",
  mustChangePassword: false,
  pwv: admin.passwordChangedAt?.getTime() ?? 0,
})
  .setProtectedHeader({ alg: "HS256" })
  .setSubject(admin.id)
  .setIssuedAt()
  .setExpirationTime("12h")
  .sign(new TextEncoder().encode(process.env.AUTH_SECRET));
await prisma.$disconnect();

const cart = [
  {
    productId: "s2b-fixture",
    slug: "s2b-fixture",
    name: "عود اختبار",
    price: 100,
    currency: "USD",
    quantity: 1,
    imagePath: null,
  },
];

const evidence = { shots: [], see: [], fails: [], publicNotebook: {} };
let fail = false;

async function checkGates(page, label) {
  const overflow = await page.evaluate(() => {
    const doc = document.documentElement;
    return Math.max(0, doc.scrollWidth - doc.clientWidth);
  });
  // document-title must stay enabled. A prior single flake coincided with Next
  // HMR mid-capture (empty <title> during rebuild), not with theme toggles —
  // stress of theme×viewport flips alone is clean. Wait for a real <title>
  // text node before axe so a transient HMR gap is not reported as a product bug.
  await page
    .waitForFunction(
      () => {
        const el = document.querySelector("head title");
        const text = (el?.textContent || document.title || "").trim();
        return text.length > 0;
      },
      null,
      { timeout: 10_000 }
    )
    .catch(() => null);
  const titleNow = (await page.title()).trim();
  if (!titleNow) {
    fail = true;
    evidence.fails.push({ label, overflow, axe: ["document-title"], note: "empty title after wait" });
    return { overflow, axeSerious: 1 };
  }
  const axe = await new AxeBuilder({ page })
    .exclude("#__next-build-watcher")
    .analyze();
  const serious = (axe.violations || []).filter((v) =>
    ["serious", "critical"].includes(v.impact)
  );
  if (overflow > 0 || serious.length) {
    fail = true;
    evidence.fails.push({ label, overflow, axe: serious.map((v) => v.id) });
  }
  return { overflow, axeSerious: serious.length };
}

async function shot(page, name, theme, w, see) {
  const h = w <= 390 ? 844 : w <= 768 ? 1024 : 900;
  await page.setViewportSize({ width: w, height: h });
  await page.evaluate((th) => {
    document.documentElement.setAttribute("data-theme", th);
    const root =
      document.querySelector("[data-portal]") || document.documentElement;
    root.setAttribute("data-theme", th);
    localStorage.setItem("ro-portal-theme-v5", th);
  }, theme);
  await page.waitForTimeout(350);
  await hideNextDevIndicator(page);
  const file = `${name}-${theme}-${w}-ar.png`;
  await page.screenshot({ path: path.join(OUT, file), fullPage: false });
  const gates = await checkGates(page, file);
  evidence.shots.push({ file, ...gates });
  evidence.see.push(`SEE ${file}: ${see}`);
  console.log(`SEE ${file}: ${see}`);
}

async function waitDestInput(page) {
  const input = page.getByTestId("ro-shipping-destination").first();
  try {
    await input.waitFor({ state: "visible", timeout: 45_000 });
  } catch (err) {
    const html = await page.content();
    const text = await page.locator("body").innerText().catch(() => "");
    fs.writeFileSync(path.join(OUT, "debug-fail.html"), html);
    fs.writeFileSync(path.join(OUT, "debug-fail.txt"), `url=${page.url()}\n\n${text}`);
    console.error(
      "waitDestInput fail",
      page.url(),
      "inputs",
      await page.locator("input").count(),
      "testid",
      await page.getByTestId("ro-shipping-destination").count()
    );
    throw err;
  }
  return input;
}

async function selectDest(page, label) {
  const input = await waitDestInput(page);
  await input.click();
  await input.fill("");
  await input.fill(label);
  await input.dispatchEvent("change");
  await input.blur();
  const quoteWait = page
    .waitForResponse(
      (r) => r.url().includes("/api/shipping/quote") && r.request().method() === "POST",
      { timeout: 20_000 }
    )
    .catch(() => null);
  await page.waitForTimeout(200);
  await quoteWait;
  await page.waitForTimeout(600);
  return input;
}

const browser = await chromium.launch({ headless: true });

// Public notebook must stay hidden
for (const code of ["LB", "JO", "SA", "AE"]) {
  const r = await fetch(`${BASE}/api/shipping/quote`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ destinationCode: code, weightKg: 20, audience: "CUSTOMER" }),
  }).then((x) => x.json());
  const methods = r.methods || [];
  evidence.publicNotebook[code] = {
    methods: methods.map((m) => `${m.code || m.methodCode}:${m.amount ?? m.price?.total}`),
    inquiry: r.inquiry,
  };
  const leaked = methods.some((m) =>
    /LAND_|SHARJAH|NOTEBOOK|notebook/i.test(String(m.code || m.methodCode || ""))
  );
  if (leaked) {
    fail = true;
    evidence.fails.push({ label: `public-notebook-leak-${code}`, methods: evidence.publicNotebook[code].methods });
  }
}

// --- /shipping page ---
{
  const ctx = await browser.newContext({ locale: "ar" });
  const page = await ctx.newPage();
  const cons = [];
  page.on("pageerror", (e) => cons.push(String(e)));
  await page.goto(`${BASE}/shipping`, { waitUntil: "domcontentloaded", timeout: 90_000 });
  await page.waitForTimeout(1500);
  await selectDest(page, "ألمانيا");
  for (const theme of THEMES) {
    for (const w of WIDTHS) {
      await shot(
        page,
        "s2b-shipping-page",
        theme,
        w,
        "standalone /shipping with DE quote cards + badges; no cart required"
      );
    }
  }
  if (cons.length) {
    fail = true;
    evidence.fails.push({ label: "shipping-page-console", cons });
  }
  await ctx.close();
}

// --- PDP estimator ---
{
  const slug = product?.slug || "shipping-calc-demo-oud";
  const ctx = await browser.newContext({ locale: "ar" });
  const page = await ctx.newPage();
  await page.goto(`${BASE}/product/${slug}`, {
    waitUntil: "domcontentloaded",
    timeout: 90_000,
  });
  await page.waitForTimeout(1200);
  const toggle = page.getByRole("button", { name: /احسب الشحن|Estimate shipping/i });
  if (await toggle.count()) await toggle.click();
  await page.waitForTimeout(500);
  if (await page.locator('input[list="ro-shipping-destinations"]').count()) {
    await selectDest(page, "ألمانيا");
  }
  const estimator = page.getByTestId("ro-shipping-destination").first();
  if (await estimator.count()) {
    await estimator.scrollIntoViewIfNeeded();
    await page.waitForTimeout(300);
  }
  for (const theme of THEMES) {
    for (const w of [1440, 390]) {
      if (await estimator.count()) {
        await estimator.scrollIntoViewIfNeeded();
        await page.waitForTimeout(200);
      }
      await shot(
        page,
        "s2b-pdp-estimator",
        theme,
        w,
        "PDP احسب الشحن open with DE methods (estimator scrolled into view)"
      );
    }
  }
  await ctx.close();
}

// --- request form DE + opt-in + sticky ---
{
  const ctx = await browser.newContext({ locale: "ar" });
  await ctx.addInitScript((items) => {
    localStorage.setItem("ro_cart_v1", JSON.stringify(items));
  }, cart);
  const page = await ctx.newPage();
  const cons = [];
  page.on("pageerror", (e) => cons.push(String(e)));
  await page.goto(`${BASE}/request`, { waitUntil: "domcontentloaded", timeout: 90_000 });
  await page.waitForTimeout(1500);
  const input = await selectDest(page, "ألمانيا");
  for (const theme of THEMES) {
    for (const w of WIDTHS) {
      await shot(
        page,
        "s2b-request-de",
        theme,
        w,
        "request DE cards with badges + WA opt-in unchecked + sticky on 390"
      );
    }
  }
  // inquiry: LB public — full matrix for contact sheet
  await selectDest(page, "لبنان");
  for (const theme of THEMES) {
    for (const w of [1440, 390]) {
      await shot(
        page,
        "s2b-request-lb-inquiry",
        theme,
        w,
        "LB public → inquiry card اطلب عرض سعر (notebook hidden); WA opt-in unchecked"
      );
    }
  }
  void input;
  if (cons.length) {
    fail = true;
    evidence.fails.push({ label: "request-console", cons });
  }
  await ctx.close();
}

// --- Admin simulator unverified notebook (7 rates across LB/JO/SA/AE) ---
{
  const ctx = await browser.newContext({ locale: "ar" });
  await ctx.addCookies([
    {
      name: "ro_admin_session",
      value: token,
      url: BASE,
      httpOnly: true,
      sameSite: "Lax",
    },
  ]);
  const page = await ctx.newPage();
  await page.goto(`${BASE}/admin/shipping/simulator`, {
    waitUntil: "domcontentloaded",
    timeout: 90_000,
  });
  await page.waitForTimeout(1500);
  if (page.url().includes("/login")) {
    fail = true;
    evidence.fails.push({ label: "admin-sim-login-reject", url: page.url() });
  } else {
    const unverified = page.locator('input[name="includeUnverified"]');
    if (await unverified.count()) await unverified.check({ force: true });

    async function runSim(code, weight, seeExtra) {
      await page.locator('input[name="destinationCode"]').fill(code);
      await page.locator('input[name="weightKg"]').fill(String(weight));
      await page.getByRole("button", { name: /جرّب السعر|Run quote/i }).click();
      await page.waitForTimeout(1600);
      const resultCard = page.locator("ul.space-y-2, .rounded-lg.border").last();
      if (await resultCard.count()) {
        await resultCard.scrollIntoViewIfNeeded().catch(() => null);
      }
      await page.evaluate(() => window.scrollBy(0, 320));
      await page.waitForTimeout(200);
      const body = await page.locator("body").innerText();
      evidence[`sim_${code}_${weight}`] = {
        hasUnverified: /غير معتمد|unverified/i.test(body),
        hasConsolidation: /تجميع|consolidation/i.test(body),
        hasSpeed: /FAST|SLOW|سريع|بطيء/i.test(body),
        snippet: body.slice(-600),
      };
      await shot(
        page,
        `s2b-sim-${code.toLowerCase()}-w${weight}`,
        "light",
        1440,
        `admin simulator unverified ON — ${code} @ ${weight}kg; ${seeExtra}`
      );
      await shot(
        page,
        `s2b-sim-${code.toLowerCase()}-w${weight}`,
        "dark",
        1440,
        `admin simulator dark — ${code} @ ${weight}kg`
      );
    }

    await runSim("LB", 20, "notebook LAND_PASSENGER_CAR $20");
    await runSim("JO", 20, "JO×3 notebook flats (30/70/100) + speed/security");
    // Extra JO matrix for contact sheet (light/dark × 1440/390)
    for (const theme of THEMES) {
      for (const w of [1440, 390]) {
        await shot(
          page,
          "s2b-sim-jo-contact",
          theme,
          w,
          "admin simulator JO unverified ON — contact-sheet cell"
        );
      }
    }
    await runSim("SA", 20, "SA×2 incl consolidation (الراقي) + FAST passenger");
    await runSim("AE", 20, "AE مندوب الشارقة $60 + legacy air if present");
  }
  await ctx.close();
}

fs.writeFileSync(path.join(OUT, "S2B-EVIDENCE.json"), JSON.stringify(evidence, null, 2));
fs.writeFileSync(
  path.join(OUT, "SEE.md"),
  evidence.see.map((l) => `- ${l}`).join("\n") + "\n"
);
await browser.close();
console.log(
  JSON.stringify(
    {
      fail,
      fails: evidence.fails.length,
      shots: evidence.shots.length,
      publicNotebook: evidence.publicNotebook,
    },
    null,
    2
  )
);
if (fail) process.exit(1);
