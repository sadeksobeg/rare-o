/**
 * Round 6 carry — Modal scrim must cover the full viewport (portal to body).
 */
import { chromium } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = path.join(ROOT, "docs/ui/pilot-r6");
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
fs.mkdirSync(OUT, { recursive: true });

function dealId() {
  try {
    const raw = execFileSync(
      process.execPath,
      [
        "-e",
        `const {PrismaClient}=require('@prisma/client');const p=new PrismaClient();p.dealProposal.findFirst({where:{status:'awaiting_payment'},select:{id:true}}).then(d=>{console.log(JSON.stringify(d));return p.$disconnect()})`,
      ],
      { cwd: ROOT, encoding: "utf8" }
    );
    return JSON.parse(raw.trim().split(/\r?\n/).pop())?.id ?? null;
  } catch {
    return null;
  }
}

const browser = await chromium.launch();
const page = await (await browser.newContext({ locale: "ar" })).newPage();
await page.setViewportSize({ width: 1440, height: 900 });
await page.goto(`${BASE}/admin/login`);
await page.fill('input[name="email"]', process.env.ADMIN_EMAIL);
await page.fill('input[name="password"]', process.env.ADMIN_PASSWORD);
await page.locator('button[type="submit"]').first().click();
await page.waitForURL((u) => !u.pathname.includes("/login"), { timeout: 20000 });

const id = dealId();
const result = { pass: false, dealId: id, checks: {} };
if (!id) {
  result.error = "no awaiting_payment deal";
} else {
  await page.goto(`${BASE}/admin/deals/${id}`, { waitUntil: "networkidle" });
  const btn = page.getByRole("button", { name: /تأكيد نجاح الدفع/i });
  await btn.first().click();
  await page.waitForTimeout(300);
  const metrics = await page.evaluate(() => {
    const scrim = document.querySelector("[data-rad-modal-scrim], .rad-mo.rad-on");
    const panel = document.querySelector("[data-rad-modal-panel], .rad-mo .rad-mb");
    const side = document.querySelector(".rad-side");
    const top = document.querySelector(".rad-top");
    if (!scrim) return { missing: true };
    const sr = scrim.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const coversViewport =
      Math.abs(sr.left) <= 1 &&
      Math.abs(sr.top) <= 1 &&
      Math.abs(sr.width - vw) <= 2 &&
      Math.abs(sr.height - vh) <= 4;
    const parentIsBody = scrim.parentElement === document.body;
    const aria =
      panel?.getAttribute("aria-modal") === "true" &&
      panel?.getAttribute("role") === "dialog";
    const sideCovered = side
      ? (() => {
          const r = side.getBoundingClientRect();
          return sr.left <= r.left + 2 && sr.right >= r.right - 2;
        })()
      : true;
    const topCovered = top
      ? (() => {
          const r = top.getBoundingClientRect();
          return sr.top <= r.top + 2 && sr.bottom >= r.bottom - 2;
        })()
      : true;
    return {
      coversViewport,
      parentIsBody,
      aria,
      sideCovered,
      topCovered,
      scrim: { x: sr.x, y: sr.y, w: sr.width, h: sr.height },
      viewport: { w: vw, h: vh },
    };
  });
  result.checks = metrics;
  result.pass = Boolean(
    metrics.coversViewport &&
      metrics.parentIsBody &&
      metrics.aria &&
      metrics.sideCovered &&
      metrics.topCovered
  );
  await page.keyboard.press("Escape");
}

fs.writeFileSync(path.join(OUT, "modal-scrim-gate.json"), JSON.stringify(result, null, 2));
console.log(JSON.stringify(result, null, 2));
await browser.close();
process.exit(result.pass ? 0 : 1);
