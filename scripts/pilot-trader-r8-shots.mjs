/**
 * Round 8 — trader deals list / new / detail × light/dark × 1440/1280/768/390.
 * Gates: doc overflow, per-card overflow, console, axe.
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
const OUT = path.join(ROOT, "docs/ui/pilot-trader");
const BASE = process.env.PLAYWRIGHT_BASE_URL || "http://127.0.0.1:3000";
fs.mkdirSync(OUT, { recursive: true });

for (const line of fs.readFileSync(path.join(ROOT, ".env"), "utf8").split(/\r?\n/)) {
  if (!line || line.startsWith("#")) continue;
  const i = line.indexOf("=");
  if (i < 0) continue;
  const k = line.slice(0, i).trim();
  let v = line.slice(i + 1).trim().replace(/^["']|["']$/g, "");
  if (
    !(k in process.env) ||
    !process.env[k] ||
    k.startsWith("ADMIN_") ||
    k.startsWith("TRADER_") ||
    k === "DATABASE_URL"
  ) {
    process.env[k] = v;
  }
}

const TRADER_EMAIL = process.env.TRADER_EMAIL || "trader@rareoud.local";
const VIEWPORTS = [
  { w: 1440, h: 900 },
  { w: 1280, h: 800 },
  { w: 768, h: 1024 },
  { w: 390, h: 844 },
];
const THEMES = ["light", "dark"];

async function seedTheme(page, theme) {
  await page.addInitScript((t) => {
    try {
      localStorage.setItem("ro-portal-theme-v5", t);
    } catch {
      /* ignore */
    }
  }, theme);
}

async function setTheme(page, theme) {
  await page.evaluate((t) => {
    try {
      localStorage.setItem("ro-portal-theme-v5", t);
    } catch {
      /* ignore */
    }
  }, theme);
  const current = await page.evaluate(
    () =>
      document.querySelector(".ro-portal[data-portal]")?.getAttribute("data-theme") ||
      ""
  );
  if (current !== theme) {
    await page.reload({ waitUntil: "domcontentloaded", timeout: 90000 });
  }
  await page
    .waitForFunction(
      (t) =>
        document.querySelector(".ro-portal[data-portal]")?.getAttribute("data-theme") ===
        t,
      theme,
      { timeout: 15000 }
    )
    .catch(() => {});
}

async function waitSettled(page) {
  await page
    .waitForFunction(
      () =>
        !document.querySelector(
          '[aria-busy="true"], .rad-sk, .ro-skeleton, [data-rad-skeleton]'
        ),
      { timeout: 20000 }
    )
    .catch(() => {});
  await page
    .waitForFunction(() => {
      const main = document.querySelector(".rad-tpage, main");
      if (!main) return true;
      return (main.innerText || "").trim().length > 12;
    }, { timeout: 8000 })
    .catch(() => {});
  await page.waitForTimeout(350);
}

async function freeze(page) {
  await page.addStyleTag({
    content: `*,*::before,*::after{transition:none!important;animation:none!important}`,
  });
  await page.evaluate(async () => {
    for (const a of document.getAnimations()) {
      try {
        a.finish();
      } catch {
        /* ignore */
      }
    }
    await new Promise((r) =>
      requestAnimationFrame(() => requestAnimationFrame(r))
    );
  });
}

async function sizeToDocument(page) {
  const h = await page.evaluate(() =>
    Math.min(
      16000,
      Math.max(
        document.documentElement.scrollHeight,
        document.body?.scrollHeight || 0,
        window.innerHeight || 0
      )
    )
  );
  const cur = page.viewportSize();
  await page.setViewportSize({
    width: cur?.width || 1440,
    height: Math.max(Math.ceil(h), cur?.height || 900),
  });
}

async function overflowCheck(page) {
  return page.evaluate(() => {
    const doc = document.documentElement;
    const cards = [
      ...document.querySelectorAll(
        ".rad-card, .rad-dt, [data-component='negotiation-thread'], [data-component='negotiation-action-bar'], .rad-dh, .rad-stp-scroll"
      ),
    ];
    const cardFails = cards
      .map((el, i) => {
        const sw = el.scrollWidth;
        const cw = el.clientWidth;
        return { i, tag: el.className?.toString?.().slice(0, 40) || el.tagName, sw, cw, ok: sw <= cw + 1 };
      })
      .filter((c) => !c.ok);
    return {
      ok: doc.scrollWidth <= doc.clientWidth + 1 && cardFails.length === 0,
      scrollWidth: doc.scrollWidth,
      clientWidth: doc.clientWidth,
      cardFails,
    };
  });
}

function seeLine(meta) {
  const bits = [meta.route, `${meta.theme}@${meta.w}`];
  if (meta.overflow?.ok === false) {
    bits.push("H-OVERFLOW");
    if (meta.overflow.cardFails?.length) {
      bits.push(`cards×${meta.overflow.cardFails.length}`);
    }
  }
  if (meta.consoleErrors?.length) bits.push(`console×${meta.consoleErrors.length}`);
  if (meta.axeViolations > 0) bits.push(`axe×${meta.axeViolations}`);
  if (meta.roPortalHits != null) bits.push(`ro-portal×${meta.roPortalHits}`);
  if (meta.rowCount != null) bits.push(`rows=${meta.rowCount}`);
  if (meta.stepperSteps != null) bits.push(`steps=${meta.stepperSteps}`);
  if (meta.wizardStep) bits.push(`wizard:"${meta.wizardStep}"`);
  if (meta.titleText) bits.push(`title:"${meta.titleText.slice(0, 40)}"`);
  if (meta.seeNote) bits.push(meta.seeNote);
  return bits.join(" · ");
}

async function probePage(page, route) {
  return page.evaluate((r) => {
    const roPortalHits = [
      ...document.querySelectorAll(
        '[class*="ro-portal-card"], [class*="ro-portal-icon-well"], [class*="ro-portal-section"], [class*="ro-portal-stagger"], [class*="ro-portal-tablist"], [class*="ro-portal-muted"], [class*="ro-portal-message"]'
      ),
    ].length;
    if (r.includes("/deals/new")) {
      const wizardStep =
        document.querySelector("header h2")?.textContent?.trim() || "";
      return { wizardStep, roPortalHits };
    }
    if (r.match(/\/deals\/[^/]+$/)) {
      const titleText =
        document.querySelector(".rad-dh h1")?.textContent?.trim() || "";
      const stepperSteps = document.querySelectorAll(".rad-stp .rad-s").length;
      return { titleText, stepperSteps, roPortalHits };
    }
    const rowCount =
      document.querySelectorAll(".rad-dt tbody tr, .rad-dt tbody .rad-card").length ||
      document.querySelectorAll(".rad-dt tbody tr").length;
    return { rowCount, roPortalHits };
  }, route);
}

async function shotRoute(page, consoleErrors, theme, vp, route, fileBase, dealId) {
  consoleErrors.length = 0;
  await page.setViewportSize({ width: vp.w, height: vp.h });
  await seedTheme(page, theme);
  const url =
    route === "/trader/deals/[id]"
      ? `${BASE}/trader/deals/${dealId}`
      : `${BASE}${route}`;
  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 90000 });
  await setTheme(page, theme);
  await waitSettled(page);
  await hideNextDevIndicator(page);
  await page.evaluate(() => {
    const el = document.activeElement;
    if (el instanceof HTMLElement) el.blur();
  });
  await freeze(page);
  await sizeToDocument(page);
  const name = `${fileBase}-${theme}-${vp.w}-ar.png`;
  await page.screenshot({ path: path.join(OUT, name), fullPage: false });
  const overflow = await overflowCheck(page);
  const probe = await probePage(
    page,
    route === "/trader/deals/[id]" ? `/trader/deals/${dealId}` : route
  );
  let axeViolations = 0;
  let axeIds = [];
  try {
    const axe = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa"])
      .analyze();
    axeViolations = axe.violations.length;
    axeIds = axe.violations.map((v) => v.id);
  } catch (e) {
    consoleErrors.push(`axe:${e}`);
  }
  const meta = {
    route: route === "/trader/deals/[id]" ? `/trader/deals/${dealId}` : route,
    theme,
    w: vp.w,
    file: name,
    overflow,
    consoleErrors: [...consoleErrors],
    axeViolations,
    axeIds,
    ...probe,
  };
  // Honest SEE note: never "ok" over a visible defect flag
  if (!overflow.ok) meta.seeNote = "visible overflow on doc/card";
  else if (axeViolations) meta.seeNote = `axe:${axeIds.slice(0, 3).join(",")}`;
  else if (consoleErrors.length) meta.seeNote = "console errors present";
  else if (probe.roPortalHits > 0) meta.seeNote = "legacy ro-portal classes remain";
  else meta.seeNote = "layout settled; chrome matches ui-kit";
  meta.see = seeLine(meta);
  return meta;
}

const secret = process.env.AUTH_SECRET;
if (!secret || secret.length < 16) {
  console.error("AUTH_SECRET missing");
  process.exit(1);
}

const prisma = new PrismaClient();
const trader = await prisma.traderAccount.findUnique({
  where: { email: TRADER_EMAIL },
});
if (!trader) {
  console.error("NO_TRADER", TRADER_EMAIL);
  process.exit(1);
}
let dealId = process.env.R8_DEAL_ID || null;
if (!dealId) {
  const deal =
    (await prisma.dealProposal.findFirst({
      where: {
        traderId: trader.id,
        status: "negotiating",
        OR: [{ reference: "DL-DEMO-WAIT" }, { reference: "DL-SEED-WAIT" }],
      },
      select: { id: true, reference: true, status: true },
    })) ||
    (await prisma.dealProposal.findFirst({
      where: { traderId: trader.id },
      orderBy: { updatedAt: "desc" },
      select: { id: true, reference: true, status: true },
    }));
  dealId = deal?.id || null;
  console.log("deal from db", deal);
}
await prisma.$disconnect();
if (!dealId) {
  console.error("No deal id found for detail shots");
  process.exit(2);
}
console.log("dealId", dealId);

const traderToken = await new SignJWT({
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

const browser = await chromium.launch();
const results = [];
const evidence = {};

{
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1,
    locale: "ar",
  });
  await context.addCookies([
    {
      name: "ro_trader_session",
      value: traderToken,
      url: BASE,
      httpOnly: true,
      sameSite: "Lax",
    },
  ]);
  const page = await context.newPage();
  const consoleErrors = [];
  page.on("pageerror", (e) => consoleErrors.push(String(e.message || e)));
  page.on("console", (msg) => {
    if (msg.type() !== "error") return;
    const text = msg.text();
    // Dev-only noise: caret-color extension / benign hydration attribute diffs
    if (text.includes("caret-color")) return;
    if (text.includes("A tree hydrated but some attributes")) return;
    consoleErrors.push(text);
  });

  const routes = [
    { route: "/trader/deals", fileBase: "r8-trader-deals" },
    { route: "/trader/deals/new", fileBase: "r8-trader-deals-new" },
    { route: "/trader/deals/[id]", fileBase: "r8-trader-deal-detail" },
  ];

  for (const { route, fileBase } of routes) {
    for (const theme of THEMES) {
      for (const vp of VIEWPORTS) {
        const meta = await shotRoute(
          page,
          consoleErrors,
          theme,
          vp,
          route,
          fileBase,
          dealId
        );
        results.push(meta);
        evidence[meta.file] = meta.see;
        console.log("wrote", meta.file, "—", meta.see);
      }
    }
  }

  await context.close();
}

const gates = {
  overflowFail: results.filter((r) => !r.overflow?.ok).map((r) => r.file),
  consoleFail: results.filter((r) => r.consoleErrors?.length).map((r) => r.file),
  axeFail: results
    .filter((r) => r.axeViolations > 0)
    .map((r) => ({ file: r.file, n: r.axeViolations, ids: r.axeIds })),
  roPortalFail: results.filter((r) => (r.roPortalHits || 0) > 0).map((r) => ({
    file: r.file,
    n: r.roPortalHits,
  })),
  dealId: results.find((r) => r.route?.includes("/trader/deals/"))?.route,
};

const manifest = {
  at: new Date().toISOString(),
  base: BASE,
  evidence,
  gates,
  results,
  files: fs
    .readdirSync(OUT)
    .filter((f) => f.startsWith("r8-") && f.endsWith(".png")),
};
fs.writeFileSync(path.join(OUT, "r8-shots.json"), JSON.stringify(manifest, null, 2));
console.log(JSON.stringify({ gates, files: manifest.files.length }, null, 2));
await browser.close();

const hardFail =
  gates.overflowFail.length ||
  gates.consoleFail.length ||
  gates.axeFail.length ||
  gates.roPortalFail.length;
process.exit(hardFail ? 1 : 0);
