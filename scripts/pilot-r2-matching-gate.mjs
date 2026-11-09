/**
 * Round 2.1 — image-matching gate (owner item 2+3).
 * Captures the real app (sparse = real DB via /admin, rich = synthetic
 * fixture via /dev/pilot) at dark/light x 1440/390 x ar/en = 8 combos,
 * and pixelmatch-diffs the 4 combos the owner's reference actually has a
 * screenshot for (dark/1440/sparse, dark/390/sparse, light/1440/sparse,
 * dark/1440/rich). English has no reference screenshot to diff against
 * (the owner's reference is Arabic-only by design) — captured for
 * coverage only, no diff.
 *
 * Run: ADMIN_EMAIL=... ADMIN_PASSWORD=... node scripts/pilot-r2-matching-gate.mjs
 * Output: docs/ui/pilot-r2/matching/*.png + MATCHING-RESULTS.json
 */
import { chromium } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { PNG } from "pngjs";
import pixelmatch from "pixelmatch";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT_DIR = path.join(ROOT, "docs", "ui", "pilot-r2", "matching");
const REF_DIR = path.join(ROOT, "docs", "ui", "reference", "admin-dashboard");
const BASE = process.env.PLAYWRIGHT_BASE_URL || "http://127.0.0.1:3000";
const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
const THRESHOLD_PCT = 8; // declared threshold: % of pixels allowed to differ

fs.mkdirSync(OUT_DIR, { recursive: true });

function diffPct(aPath, bPath, outPath) {
  const a = PNG.sync.read(fs.readFileSync(aPath));
  const b = PNG.sync.read(fs.readFileSync(bPath));
  const w = Math.min(a.width, b.width);
  const h = Math.min(a.height, b.height);
  const diff = new PNG({ width: w, height: h });
  const ca = cropTo(a, w, h);
  const cb = cropTo(b, w, h);
  const changed = pixelmatch(ca.data, cb.data, diff.data, w, h, {
    threshold: 0.12,
  });
  fs.writeFileSync(outPath, PNG.sync.write(diff));
  return { changed, total: w * h, pct: (100 * changed) / (w * h) };
}

function cropTo(png, w, h) {
  if (png.width === w && png.height === h) return png;
  const out = new PNG({ width: w, height: h });
  PNG.bitblt(png, out, 0, 0, w, h, 0, 0);
  return out;
}

// Dev mode has a reproducible RSC dev-chunk resolution crash specific to
// /admin (not a code bug — next build && next start renders it fine); only
// /dev/pilot is reachable there. So this gate runs in two passes against
// two different servers: GATE_PILOT_ONLY=1 against `next dev` for the rich
// fixture only, and the default pass against `next build && next start`
// for everything that needs a real login.
const PILOT_ONLY = process.env.GATE_PILOT_ONLY === "1";

async function loginReal(page) {
  if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
    throw new Error("Set ADMIN_EMAIL/ADMIN_PASSWORD in env to run this gate.");
  }
  await page.goto(`${BASE}/admin/login`, { waitUntil: "domcontentloaded" });
  await page.fill('input[name="email"]', ADMIN_EMAIL);
  await page.fill('input[name="password"]', ADMIN_PASSWORD);
  await page.getByRole("button", { name: /^دخول$/ }).click();
  // /admin/login itself matches a naive /\/admin/ regex, so that wait was
  // satisfied instantly without confirming the POST actually redirected —
  // wait for the path to stop being the login page instead.
  await page.waitForURL((url) => !url.pathname.includes("/login"), {
    timeout: 15_000,
  });
  await page.waitForLoadState("domcontentloaded");
}

async function setLocale(context, locale) {
  await context.addCookies([
    { name: "ro_locale", value: locale, url: BASE },
  ]);
}

async function setThemeAndGoto(page, url, theme) {
  await page.goto(url, { waitUntil: "domcontentloaded" });
  await page.evaluate((t) => {
    try {
      localStorage.setItem("ro-portal-theme-v5", t);
    } catch {}
  }, theme);
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.waitForTimeout(450); // entrance animation settle
}

async function implScreenshot(page, { theme, width, url }, outPath) {
  await page.setViewportSize({ width, height: 900 });
  await setThemeAndGoto(page, url, theme);
  await page.screenshot({ path: outPath, fullPage: false });
}

const RESULTS_PATH = path.join(ROOT, "docs", "ui", "pilot-r2", "MATCHING-RESULTS.json");

function loadPrevResults() {
  try {
    return JSON.parse(fs.readFileSync(RESULTS_PATH, "utf8"));
  } catch {
    return { results: [], coverage: [] };
  }
}

async function main() {
  const browser = await chromium.launch();
  const appCtx = await browser.newContext();
  const appPage = await appCtx.newPage();

  const prev = loadPrevResults();
  const results = prev.results.filter((r) => PILOT_ONLY ? !r.combo.includes("rich") : r.combo.includes("rich"));
  const coverage = PILOT_ONLY ? prev.coverage : [];

  if (PILOT_ONLY) {
    // /dev/pilot needs no login and is only reachable on `next dev`
    // (notFound() in production) — see the comment above.
    const c = { key: "dark-1440-rich", theme: "dark", width: 1440, dataset: "rich", ref: "ref-dark-1440-rich.png", implUrl: `${BASE}/dev/pilot` };
    const refOut = path.join(OUT_DIR, `${c.key}-ref.png`);
    const implOut = path.join(OUT_DIR, `${c.key}-impl.png`);
    const diffOut = path.join(OUT_DIR, `${c.key}-diff.png`);
    fs.copyFileSync(path.join(REF_DIR, c.ref), refOut);
    await implScreenshot(appPage, { theme: c.theme, width: c.width, url: c.implUrl }, implOut);
    const d = diffPct(refOut, implOut, diffOut);
    results.push({
      combo: c.key,
      hasReference: true,
      diffPct: Number(d.pct.toFixed(2)),
      threshold: THRESHOLD_PCT,
      pass: d.pct <= THRESHOLD_PCT,
    });
    console.log(`[gate] ${c.key}: ${d.pct.toFixed(2)}% diff (threshold ${THRESHOLD_PCT}%)`);
  } else {
    await loginReal(appPage);

    // --- 3 sparse combos with a real reference screenshot to diff against ---
    const refCombos = [
      { key: "dark-1440-sparse", theme: "dark", width: 1440, ref: "ref-dark-1440-sparse.png", implUrl: `${BASE}/admin` },
      { key: "dark-390-sparse", theme: "dark", width: 390, ref: "ref-dark-390-sparse.png", implUrl: `${BASE}/admin` },
      { key: "light-1440-sparse", theme: "light", width: 1440, ref: "ref-light-1440-sparse.png", implUrl: `${BASE}/admin` },
    ];

    await setLocale(appCtx, "ar");

    for (const c of refCombos) {
      const refOut = path.join(OUT_DIR, `${c.key}-ref.png`);
      const implOut = path.join(OUT_DIR, `${c.key}-impl.png`);
      const diffOut = path.join(OUT_DIR, `${c.key}-diff.png`);
      fs.copyFileSync(path.join(REF_DIR, c.ref), refOut);
      await implScreenshot(appPage, { theme: c.theme, width: c.width, url: c.implUrl }, implOut);
      const d = diffPct(refOut, implOut, diffOut);
      results.push({
        combo: c.key,
        hasReference: true,
        diffPct: Number(d.pct.toFixed(2)),
        threshold: THRESHOLD_PCT,
        pass: d.pct <= THRESHOLD_PCT,
      });
      console.log(`[gate] ${c.key}: ${d.pct.toFixed(2)}% diff (threshold ${THRESHOLD_PCT}%)`);
    }

    // --- 8-combo coverage (dark/light x 1440/390 x ar/en), real app only ---
    for (const locale of ["ar", "en"]) {
      await setLocale(appCtx, locale);
      for (const theme of ["dark", "light"]) {
        for (const width of [1440, 390]) {
          const key = `${theme}-${width}-${locale}`;
          const out = path.join(OUT_DIR, `coverage-${key}.png`);
          await implScreenshot(appPage, { theme, width, url: `${BASE}/admin` }, out);
          coverage.push(key);
          console.log(`[gate] coverage captured: ${key}`);
        }
      }
    }
  }

  fs.writeFileSync(
    RESULTS_PATH,
    JSON.stringify({ at: new Date().toISOString(), threshold: THRESHOLD_PCT, results, coverage }, null, 2)
  );

  await browser.close();

  const failed = results.filter((r) => !r.pass);
  console.log(
    `\n[gate] ${results.length} reference comparisons, ${failed.length} over threshold. ${coverage.length} coverage shots.`
  );
  if (failed.length > 0) process.exitCode = 1;
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
