/**
 * Closure E2 — lightweight unit-style checks (no test framework).
 * Run: npm run test:e2-unit
 */
import { consumeRateLimit } from "../lib/auth/public-rate-limit";
import { assertNoCatalogDealConflict, isConflictStatus } from "../lib/deals/conflict";
import { formatCurrency, formatNumber } from "../lib/i18n/format";

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
    formatCurrency(100, "TEST", "en", "On request") === "On request",
    "formatCurrency hides TEST code"
  );

  console.log(`\ne2-unit-checks: ${passed} passed, ${failed} failed`);
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
