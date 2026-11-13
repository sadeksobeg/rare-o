/**
 * Closure E2 — lightweight unit-style checks (no test framework).
 * Run: npm run test:e2-unit
 */
import {
  collectOudSpecItems,
  oudSpecsFromFormData,
  parseOudSpecs,
} from "../lib/catalog/oud-specs";
import { consumeRateLimit } from "../lib/auth/public-rate-limit";
import { assertNoCatalogDealConflict, isConflictStatus } from "../lib/deals/conflict";
import { formatCurrency, formatNumber } from "../lib/i18n/format";
import {
  isWeakDevice,
  resolveMotionTier,
  surfaceFromPathname,
} from "../components/motion/resolve-tier";

let passed = 0;
let failed = 0;

function assert(cond: boolean, msg: string) {
  if (!cond) {
    failed += 1;
    console.error(`FAIL: ${msg}`);
    return;
  }
  passed += 1;
  console.log(`PASS: ${msg}`);
}

async function main() {
  const a = consumeRateLimit({
    scope: "e2-unit",
    identity: "127.0.0.1|test",
    max: 3,
    windowMs: 60_000,
  });
  assert(a.allowed, "rate limit first request allowed");
  consumeRateLimit({
    scope: "e2-unit",
    identity: "127.0.0.1|test",
    max: 3,
    windowMs: 60_000,
  });
  consumeRateLimit({
    scope: "e2-unit",
    identity: "127.0.0.1|test",
    max: 3,
    windowMs: 60_000,
  });
  const blocked = consumeRateLimit({
    scope: "e2-unit",
    identity: "127.0.0.1|test",
    max: 3,
    windowMs: 60_000,
  });
  assert(!blocked.allowed && (blocked.retryAfterSec ?? 0) > 0, "rate limit blocks 4th");

  await assertNoCatalogDealConflict({
    productId: "noop-product",
    excludeDealId: "x",
  });
  assert(true, "catalog conflict assert is no-op (does not throw)");

  assert(isConflictStatus("negotiating"), "negotiating is conflict status");
  assert(!isConflictStatus("closed"), "closed is not conflict status");

  assert(formatNumber(1234.5, "en").includes("1"), "formatNumber en");
  assert(
    formatCurrency(100, "USD", "en", "On request") !== "On request",
    "formatCurrency USD"
  );
  assert(
    formatCurrency(21832, "USD", "ar", "عند الطلب").includes("21,832.00") &&
      formatCurrency(21832, "USD", "ar", "عند الطلب").includes("US$") &&
      !formatCurrency(21832, "USD", "ar", "عند الطلب").includes("$US") &&
      !formatCurrency(21832, "USD", "ar", "عند الطلب").includes("USD$"),
    "formatCurrency stable US$ order"
  );
  assert(
    formatCurrency(100, "TEST", "en", "On request") === "On request",
    "formatCurrency hides TEST code"
  );

  assert(parseOudSpecs(null) === null, "parseOudSpecs null");
  assert(parseOudSpecs({ wood: { face: { ar: "", en: "" } } }) === null, "parseOudSpecs empty");
  const filled = parseOudSpecs({
    wood: { face: { ar: "شوح", en: "spruce" } },
    measures: { faceWidthMm: 360 },
    standardNeck: true,
  });
  assert(filled?.wood?.face?.en === "spruce", "parseOudSpecs keeps wood");
  assert(filled?.measures?.faceWidthMm === 360, "parseOudSpecs keeps measure");
  const items = collectOudSpecItems(filled, "ar", "مم", "نعم", "لا");
  assert(items.some((i) => i.key === "face" && i.value === "شوح"), "collectOudSpecItems AR wood");
  const fd = new FormData();
  fd.set("oudWoodBackAr", "جوز");
  fd.set("oudFaceWidthMm", "350");
  const fromForm = oudSpecsFromFormData(fd);
  assert(fromForm?.wood?.back?.ar === "جوز", "oudSpecsFromFormData wood");
  assert(fromForm?.measures?.faceWidthMm === 350, "oudSpecsFromFormData measure");

  assert(surfaceFromPathname("/catalog") === "storefront", "surface storefront");
  assert(surfaceFromPathname("/admin/deals") === "admin", "surface admin");
  assert(surfaceFromPathname("/trader/offers") === "trader", "surface trader");
  assert(
    resolveMotionTier({
      reducedMotion: false,
      saveData: false,
      deviceMemory: 8,
      hardwareConcurrency: 8,
      surface: "storefront",
    }) === "A",
    "tier A storefront"
  );
  assert(
    resolveMotionTier({
      reducedMotion: false,
      saveData: false,
      deviceMemory: 8,
      hardwareConcurrency: 8,
      surface: "trader",
    }) === "B",
    "tier B trader"
  );
  assert(
    resolveMotionTier({
      reducedMotion: false,
      saveData: false,
      deviceMemory: 8,
      hardwareConcurrency: 8,
      surface: "admin",
    }) === "C",
    "tier C admin"
  );
  assert(
    resolveMotionTier({
      reducedMotion: true,
      saveData: false,
      deviceMemory: 8,
      hardwareConcurrency: 8,
      surface: "storefront",
    }) === "Lite",
    "tier Lite reduced motion"
  );
  assert(
    resolveMotionTier({
      reducedMotion: false,
      saveData: true,
      deviceMemory: 8,
      hardwareConcurrency: 8,
      surface: "admin",
    }) === "Lite",
    "tier Lite save-data"
  );
  assert(isWeakDevice({ deviceMemory: 4, hardwareConcurrency: 8 }) === true, "weak 4GB");
  assert(isWeakDevice({ deviceMemory: 8, hardwareConcurrency: 4 }) === true, "weak 4 cores");
  assert(
    resolveMotionTier({
      reducedMotion: false,
      saveData: false,
      deviceMemory: 4,
      hardwareConcurrency: 16,
      surface: "storefront",
    }) === "Lite",
    "tier Lite weak device"
  );

  console.log(`\ne2-unit-checks: ${passed} passed, ${failed} failed`);
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
