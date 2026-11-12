/**
 * Shipping engine against the imported catalog in the DB (run after
 * `npm run shipping:import`). Run: npm run test:shipping-db
 */
import { PrismaClient } from "@prisma/client";
import { quote, buildQuoteSnapshot } from "../lib/shipping/engine";
import { resolveAvailableMethods } from "../lib/shipping/resolve-available-methods";
import { INTERNATIONAL_ZONES, SYRIA_GOVERNORATES } from "../lib/shipping/rates";

const prisma = new PrismaClient();
let passed = 0;
let failed = 0;
function check(cond: unknown, msg: string) {
  if (cond) passed += 1;
  else {
    failed += 1;
    console.error(`FAIL: ${msg}`);
  }
}

async function main() {
  // DB parity: the imported rows reproduce the legacy code tables.
  for (const zone of INTERNATIONAL_ZONES) {
    for (const country of zone.countries) {
      for (const w of [5, 11, 20, 21, 40]) {
        const old = resolveAvailableMethods(country.code, w);
        const next = await quote({ destinationCode: country.code, weightKg: w, audience: "CUSTOMER" });
        check(old.length === next.methods.length, `${country.code} ${w}kg count ${old.length}/${next.methods.length}`);
        for (const o of old) {
          const n = next.methods.find((m) => m.methodCode === o.code);
          check(
            !!n && Math.abs(n.price.total - o.amount) <= 0.01 && n.price.currency === o.currency,
            `${country.code} ${w}kg ${o.code}`
          );
        }
      }
    }
  }
  for (const gov of SYRIA_GOVERNORATES) {
    const old = resolveAvailableMethods(gov.code, 20);
    const next = await quote({ destinationCode: gov.code.toUpperCase(), weightKg: 20, audience: "CUSTOMER" });
    check(
      old.length === next.methods.length && old.every((o, i) => next.methods[i]?.methodCode === o.code && next.methods[i]?.price.total === o.amount),
      `${gov.code} domestic parity`
    );
  }
  console.log(`PASS: DB parity (${passed} assertions)`);

  for (const code of ["LB", "JO", "SA"]) {
    const pub = await quote({ destinationCode: code, weightKg: 20, audience: "CUSTOMER" });
    check(pub.methods.length === 0 && pub.inquiry, `${code}: public sees no unverified notebook rate`);
    const trader = await quote({ destinationCode: code, weightKg: 20, audience: "TRADER" });
    check(trader.methods.length === 0, `${code}: traders see none either`);
    const admin = await quote({ destinationCode: code, weightKg: 20, audience: "CUSTOMER", includeUnverified: true });
    check(admin.methods.length > 0 && admin.methods.every((m) => m.unverified), `${code}: admin preview labelled unverified`);
  }
  const ae = await quote({ destinationCode: "ae", weightKg: 20, audience: "CUSTOMER" });
  check(ae.methods.length === 1 && ae.methods[0]!.price.total === 150 && ae.methods[0]!.price.currency === "AED", "AE public: legacy air only, 150 AED");
  const none = await quote({ destinationCode: "BR", weightKg: 20, audience: "CUSTOMER" });
  check(none.methods.length === 0 && none.inquiry && none.inquiryReason === "NO_METHOD" && none.destination?.nameAr === "البرازيل", "BR: no method -> inquiry, localized name");
  const de5 = await quote({ destinationCode: "DE", weightKg: 5, audience: "CUSTOMER" });
  check(de5.inquiry && de5.inquiryReason === "BELOW_TIER_FLOOR", "DE 5kg -> inquiry card");

  const product = await prisma.product.findFirst({ select: { id: true, weightKg: true } });
  if (product) {
    const q = await quote({ destinationCode: "DE", items: [{ productId: product.id, qty: 3 }], audience: "CUSTOMER" });
    check(product.weightKg != null || (q.weightKg === 45 && q.weightSource === "heuristic"), "3 unweighed ouds -> 45kg legacy heuristic");
    const snap = buildQuoteSnapshot(q, q.methods[0]?.methodCode ?? null);
    check(snap.method?.price.total === q.methods[0]?.price.total && !!snap.method?.rateId, "snapshot carries price + rateId");
  }
  console.log(`\nShipping DB checks: ${passed} passed, ${failed} failed`);
  if (failed > 0) process.exitCode = 1;
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
