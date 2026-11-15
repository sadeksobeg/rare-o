/**
 * Round 5.1 — owner carry shots into docs/ui/pilot-r51/
 */
import { chromium } from "@playwright/test";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { hideNextDevIndicator } from "./pilot-hide-next-indicator.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = path.join(ROOT, "docs/ui/pilot-r51");
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
fs.mkdirSync(OUT, { recursive: true });

async function setTheme(page, theme) {
  await page.evaluate((t) => {
    const root =
      document.querySelector('[data-portal="admin"]') || document.documentElement;
    root.setAttribute("data-theme", t);
    if (t === "light") root.classList.add("light");
    else root.classList.remove("light");
  }, theme);
}

async function waitAnimationsIdle(page) {
  await page.evaluate(async () => {
    const finite = () =>
      document
        .getAnimations()
        .filter((a) => a.effect && a.playState !== "finished" && a.effect.getTiming().iterations !== Infinity);
    for (let i = 0; i < 8; i++) {
      const anims = finite();
      await Promise.all(anims.map((a) => a.finished.catch(() => {})));
      if (finite().length === 0) break;
      await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
    }
  });
  await page.waitForTimeout(200);
}

async function shot(page, file, opts = {}) {
  await hideNextDevIndicator(page);
  await waitAnimationsIdle(page);
  await page.waitForTimeout(opts.delay ?? 250);
  await page.screenshot({
    path: path.join(OUT, file),
    fullPage: opts.fullPage ?? false,
  });
  return file;
}

async function login(page) {
  await page.goto(`${BASE}/admin/login`, { waitUntil: "domcontentloaded" });
  await page.fill('input[name="email"]', process.env.ADMIN_EMAIL);
  await page.fill('input[name="password"]', process.env.ADMIN_PASSWORD);
  await page.locator('button[type="submit"]').first().click();
  await page.waitForURL((u) => !u.pathname.includes("/login"), { timeout: 20000 });
}

function prismaJson(script) {
  try {
    const raw = execFileSync(process.execPath, ["-e", script], {
      cwd: ROOT,
      encoding: "utf8",
    });
    return JSON.parse(raw.trim().split(/\r?\n/).pop());
  } catch {
    return null;
  }
}

function lookupAwaitingPaymentDealId() {
  const deal = prismaJson(
    `const {PrismaClient}=require('@prisma/client');const p=new PrismaClient();p.dealProposal.findFirst({where:{status:'awaiting_payment'},orderBy:{updatedAt:'desc'},select:{id:true}}).then(d=>{console.log(JSON.stringify(d));return p.$disconnect()})`
  );
  return deal?.id ?? null;
}

function lookupFirstId(model) {
  const row = prismaJson(
    `const {PrismaClient}=require('@prisma/client');const p=new PrismaClient();p.${model}.findFirst({orderBy:{updatedAt:'desc'},select:{id:true}}).then(d=>{console.log(JSON.stringify(d));return p.$disconnect()})`
  );
  return row?.id ?? null;
}

const DETAIL_FINDERS = [
  { slug: "request-detail", list: "/admin/requests", link: 'a[href^="/admin/requests/"]' },
  { slug: "deal-detail", list: "/admin/deals", link: 'a[href^="/admin/deals/"]' },
  { slug: "wholesale-detail", list: "/admin/wholesale", link: 'a[href^="/admin/wholesale/"]' },
  { slug: "brokerage-detail", list: "/admin/brokerage", link: 'a[href^="/admin/brokerage/"]' },
  { slug: "customer-detail", list: "/admin/customers", link: 'a[href^="/admin/customers/"]' },
];

const UI_KIT_PAGES = [
  "requests",
  "deals",
  "wholesale",
  "brokerage",
  "customers",
];

const browser = await chromium.launch();
const page = await (await browser.newContext({ locale: "ar" })).newPage();
await login(page);

const files = [];
const dealPayId = lookupAwaitingPaymentDealId();
const detailHrefs = {};

for (const d of DETAIL_FINDERS) {
  await page.goto(`${BASE}${d.list}`, { waitUntil: "networkidle", timeout: 60000 });
  detailHrefs[d.slug] = await page.evaluate((sel) => {
    const a = [...document.querySelectorAll(sel)].find((el) => {
      const h = el.getAttribute("href") || "";
      return h.split("/").filter(Boolean).length >= 3;
    });
    return a?.getAttribute("href") || null;
  }, d.link);
}
if (!detailHrefs["deal-detail"]) {
  const id = lookupFirstId("dealProposal");
  if (id) detailHrefs["deal-detail"] = `/admin/deals/${id}`;
}
if (!detailHrefs["wholesale-detail"]) {
  const id = lookupFirstId("wholesaleRequest");
  if (id) detailHrefs["wholesale-detail"] = `/admin/wholesale/${id}`;
}

// Requests list light 1440
await page.setViewportSize({ width: 1440, height: 900 });
await page.goto(`${BASE}/admin/requests`, { waitUntil: "networkidle", timeout: 60000 });
await setTheme(page, "light");
files.push(await shot(page, "r51-requests-list-light-1440-ar.png"));

// Request detail light 1440
if (detailHrefs["request-detail"]) {
  await page.goto(`${BASE}${detailHrefs["request-detail"]}`, {
    waitUntil: "networkidle",
    timeout: 60000,
  });
  await setTheme(page, "light");
  files.push(await shot(page, "r51-request-detail-light-1440-ar.png"));
}

// Detail pages 390 dark
await page.setViewportSize({ width: 390, height: 844 });
for (const slug of [
  "request-detail",
  "deal-detail",
  "wholesale-detail",
  "brokerage-detail",
  "customer-detail",
]) {
  const href = detailHrefs[slug];
  if (!href) continue;
  await page.goto(`${BASE}${href}`, { waitUntil: "networkidle", timeout: 60000 });
  await setTheme(page, "dark");
  files.push(await shot(page, `r51-${slug}-dark-390-ar.png`));
}

// Payment modal OPEN
const payDealPath = dealPayId ? `/admin/deals/${dealPayId}` : null;
if (payDealPath) {
  for (const [theme, vp, tag] of [
    ["dark", { width: 1440, height: 900 }, "1440"],
    ["light", { width: 1440, height: 900 }, "1440"],
    ["dark", { width: 390, height: 844 }, "390"],
  ]) {
    await page.setViewportSize(vp);
    await page.goto(`${BASE}${payDealPath}`, { waitUntil: "networkidle", timeout: 60000 });
    await setTheme(page, theme);
    const btn = page.getByRole("button", { name: /تأكيد نجاح الدفع/i });
    if (await btn.count()) {
      await btn.first().click();
      await page.waitForTimeout(200);
      files.push(
        await shot(page, `r51-deal-payment-modal-open-${theme}-${tag}-ar.png`, {
          delay: 400,
        })
      );
      await page.keyboard.press("Escape");
    }
  }
} else {
  files.push("(skipped deal payment modal — no awaiting_payment deal)");
}

// /dev/ui-kit pages dark+light 1440
await page.setViewportSize({ width: 1440, height: 900 });
for (const slug of UI_KIT_PAGES) {
  for (const theme of ["dark", "light"]) {
    await page.goto(`${BASE}/dev/ui-kit/${slug}`, {
      waitUntil: "networkidle",
      timeout: 60000,
    });
    await setTheme(page, theme);
    files.push(await shot(page, `r51-ui-kit-${slug}-${theme}-1440-ar.png`));
  }
}

const summary = {
  generatedAt: new Date().toISOString(),
  outputDir: path.relative(ROOT, OUT),
  files,
  detailHrefs,
  dealPayId,
};

fs.writeFileSync(path.join(OUT, "r51-capture-summary.json"), JSON.stringify(summary, null, 2));
console.log(JSON.stringify(summary, null, 2));
await browser.close();
