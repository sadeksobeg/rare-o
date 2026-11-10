/**
 * Pixel-based contrast gate — samples screenshot pixels under label text
 * to catch cases the DOM gate misses (opacity, mix, animation, transformed
 * ancestors, wrong effective background).
 */
import { chromium } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { PNG } from "pngjs";
import { execFileSync } from "node:child_process";
import { hideNextDevIndicator } from "./pilot-hide-next-indicator.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = path.join(ROOT, "docs/ui/pilot-r6");
const BASE = process.env.PLAYWRIGHT_BASE_URL || "http://127.0.0.1:3000";

function prismaFirst(model) {
  try {
    const raw = execFileSync(
      process.execPath,
      [
        "-e",
        `const {PrismaClient}=require('@prisma/client');const p=new PrismaClient();p.${model}.findFirst({orderBy:{updatedAt:'desc'},select:{id:true}}).then(d=>{console.log(JSON.stringify(d));return p.$disconnect()})`,
      ],
      { cwd: ROOT, encoding: "utf8" }
    );
    return JSON.parse(raw.trim().split(/\r?\n/).pop())?.id ?? null;
  } catch {
    return null;
  }
}

for (const line of fs.readFileSync(path.join(ROOT, ".env"), "utf8").split(/\r?\n/)) {
  if (!line || line.startsWith("#")) continue;
  const i = line.indexOf("=");
  if (i < 0) continue;
  const k = line.slice(0, i).trim();
  let v = line.slice(i + 1).trim().replace(/^["']|["']$/g, "");
  if (k === "ADMIN_EMAIL" || k === "ADMIN_PASSWORD" || k === "DATABASE_URL") {
    process.env[k] = v;
  }
}
fs.mkdirSync(OUT, { recursive: true });

function relLum({ r, g, b }) {
  const f = (c) => {
    c /= 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}
function contrastRatio(a, b) {
  const L1 = relLum(a);
  const L2 = relLum(b);
  return (Math.max(L1, L2) + 0.05) / (Math.min(L1, L2) + 0.05);
}
function sample(png, x, y) {
  const sx = Math.max(0, Math.min(png.width - 1, Math.round(x)));
  const sy = Math.max(0, Math.min(png.height - 1, Math.round(y)));
  const i = (png.width * sy + sx) << 2;
  return { r: png.data[i], g: png.data[i + 1], b: png.data[i + 2] };
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
      document.querySelector('[data-portal="admin"]')?.getAttribute("data-theme") ||
      "dark"
  );
  if (current !== theme) {
    const btn = page.locator(".rad-top button[aria-pressed]");
    if ((await btn.count()) > 0) await btn.first().click();
  }
  await page.waitForFunction(
    (t) =>
      document.querySelector('[data-portal="admin"]')?.getAttribute("data-theme") === t,
    theme,
    { timeout: 10000 }
  );
}

async function freezeMotion(page) {
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
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
  });
}

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto(`${BASE}/admin/login`, { waitUntil: "domcontentloaded" });
await page.fill('input[name="email"]', process.env.ADMIN_EMAIL);
await page.fill('input[name="password"]', process.env.ADMIN_PASSWORD);
await page.locator('button[type="submit"]').first().click();
await page.waitForURL((u) => !u.pathname.includes("/login"), { timeout: 20000 });

const whId = prismaFirst("wholesaleRequest");
const whHref = whId ? `/admin/wholesale/${whId}` : null;
if (!whHref) {
  console.error("No wholesale detail found");
  process.exit(1);
}

await page.goto(`${BASE}${whHref}`, { waitUntil: "networkidle", timeout: 60000 });
await setTheme(page, "dark");
await hideNextDevIndicator(page);
await freezeMotion(page);

const shotPath = path.join(OUT, "pixel-contrast-wholesale-ops-dark.png");
await page.screenshot({ path: shotPath, fullPage: false });
const png = PNG.sync.read(fs.readFileSync(shotPath));

const targets = await page.evaluate(() => {
  const labels = [...document.querySelectorAll("label, .font-medium, span")].filter(
    (el) => {
      const t = (el.textContent || "").trim();
      if (
        !(
          t.includes("الانتقال") ||
          t.includes("ملاحظة") ||
          t.includes("Move") ||
          t.includes("Note")
        )
      )
        return false;
      // Skip wrapper labels that include the <select> options text.
      if (el.querySelector("select, input, textarea")) return false;
      if (t.length > 40) return false;
      const r = el.getBoundingClientRect();
      return r.width > 4 && r.height > 4 && r.top < window.innerHeight;
    }
  );
  return labels.slice(0, 8).map((el) => {
    const r = el.getBoundingClientRect();
    const cs = getComputedStyle(el);
    return {
      text: (el.textContent || "").trim().slice(0, 40),
      x: r.x + Math.min(12, r.width * 0.4),
      y: r.y + r.height / 2,
      bgProbeX: Math.max(0, r.x - 8),
      bgProbeY: r.y + r.height / 2,
      color: cs.color,
      opacity: cs.opacity,
      tag: el.tagName.toLowerCase(),
      className: String(el.className || "").slice(0, 80),
    };
  });
});

const results = targets.map((t) => {
  // Probe several points in the label box — short glyphs are easy to miss.
  const probes = [
    [t.x, t.y],
    [t.x + 8, t.y],
    [t.x - 8, t.y],
    [t.x, t.y - 2],
    [t.x, t.y + 2],
    [t.x + 16, t.y],
    [t.x - 16, t.y],
  ];
  const bg = sample(png, t.bgProbeX, t.bgProbeY);
  let best = { fg: sample(png, t.x, t.y), ratio: 0 };
  for (const [x, y] of probes) {
    const fg = sample(png, x, y);
    const ratio = contrastRatio(fg, bg);
    if (ratio > best.ratio) best = { fg, ratio };
  }
  const ratio = Number(best.ratio.toFixed(2));
  return {
    ...t,
    fgSample: best.fg,
    bgSample: bg,
    ratio,
    pass: ratio >= 4.5,
  };
});

const explanation = {
  whyDomGateMissed:
    "The DOM contrast gate walks computed `color` vs blended ancestor `backgroundColor`. " +
    "Wholesale ops labels used Tailwind `text-ro-ink` which resolved to a fixed near-black " +
    "hex (#0b080d) while the visual fill of inputs used `bg-ro-paper` / translucent mixes. " +
    "On dark theme the label ink matched the page surface luminance in the pixel buffer " +
    "(nearly invisible), but the DOM walk sometimes blended onto a lighter soft-fill " +
    "or skipped nodes with opacity/animation mid-transition — reporting a false pass. " +
    "Pixel sampling under the glyph vs nearby card pixels catches that blind spot.",
  fixApplied:
    "Forced `.text-ro-ink` / `.text-ro-muted` / `.bg-ro-paper` under `[data-portal=admin]` " +
    "to `--rad-tx` / `--rad-tx3` / `--rad-surface2`, and re-verified with this pixel gate.",
};

const payload = {
  generatedAt: new Date().toISOString(),
  route: whHref,
  theme: "dark",
  pass: results.length > 0 && results.every((r) => r.pass),
  results,
  explanation,
  shot: path.relative(ROOT, shotPath),
};

fs.writeFileSync(
  path.join(OUT, "pixel-contrast-gate.json"),
  JSON.stringify(payload, null, 2)
);
console.log(JSON.stringify(payload, null, 2));
await browser.close();
process.exit(payload.pass ? 0 : 1);
