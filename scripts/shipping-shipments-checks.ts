/**
 * Phase 2c shipment checks: state machine, trader isolation, public tracking
 * minimal-PII view, token validation, text sanitising. Creates and removes its
 * own fixtures. Run: npm run test:shipping-shipments
 */
import { PrismaClient } from "@prisma/client";
import {
  allowedNextStatuses,
  canTransition,
  cleanText,
  createShipment,
  getPublicTracking,
  isPlausibleToken,
  transitionShipment,
} from "../lib/shipping/shipments";
import { listTraderShipments } from "../lib/shipping/trader-shipments";

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
  // --- pure ---
  check(canTransition("CONFIRMED", "PACKED"), "CONFIRMED→PACKED");
  check(!canTransition("CONFIRMED", "DELIVERED"), "cannot skip to DELIVERED");
  check(allowedNextStatuses("DELIVERED").length === 0, "DELIVERED terminal");
  check(allowedNextStatuses("CANCELLED").length === 0, "CANCELLED terminal");
  check(!canTransition("RETURNED", "IN_TRANSIT"), "RETURNED terminal");
  check(!canTransition("BOGUS", "PACKED"), "unknown status has no transitions");
  check(
    cleanText("<script>alert(1)</script>\u0000ok", 200) ===
      "scriptalert(1)/scriptok",
    "cleanText strips angle brackets and control chars"
  );
  check(cleanText("x".repeat(500), 10).length === 10, "cleanText caps length");
  check(!isPlausibleToken("short"), "short token rejected");
  check(!isPlausibleToken("../../etc/passwd-aaaaaaaaaa"), "path-ish token rejected");
  check(!isPlausibleToken("a'b OR 1=1 --aaaaaaaaaaaa"), "sqli-ish token rejected");
  check(isPlausibleToken("A".repeat(24)), "base64url-ish token accepted");

  // --- DB ---
  const tag = `ship-chk-${Date.now()}`;
  const mkTrader = (n: string) =>
    prisma.traderAccount.create({
      data: {
        email: `${tag}-${n}@example.invalid`,
        passwordHash: "x",
        displayName: `${tag}-${n}`,
      },
    });
  const a = await mkTrader("a");
  const b = await mkTrader("b");
  const wr = await prisma.wholesaleRequest.create({
    data: { reference: `${tag}-W`, traderId: a.id, requestMode: "request_quote" },
  });
  let shipmentId: string | null = null;
  try {
    const bad = await createShipment({
      parent: "wholesale",
      parentId: "does-not-exist",
      actor: "check",
    });
    check(!bad.ok, "unknown parent rejected");
    const badPrice = await createShipment({
      parent: "wholesale",
      parentId: wr.id,
      priceCharged: -5,
      actor: "check",
    });
    check(!badPrice.ok, "negative price rejected");

    const created = await createShipment({
      parent: "wholesale",
      parentId: wr.id,
      carrierLabel: "<b>DHL</b>",
      destCountry: "Germany",
      recipientName: "Private Person",
      recipientPhone: "+4912345",
      destAddress: "Secret Street 1",
      priceCharged: 130,
      actor: "check",
    });
    check(created.ok, "shipment created");
    if (!created.ok) throw new Error("create failed");
    shipmentId = created.id;

    const row = await prisma.shipment.findUnique({
      where: { id: shipmentId },
      include: { events: true },
    });
    check(row?.carrierLabel === "bDHL/b", "carrier sanitised on write");
    check((row?.publicToken.length ?? 0) >= 20, "public token is long");
    check(row?.events.length === 1, "initial event written");

    // trader isolation
    const ownA = await listTraderShipments(a.id);
    const ownB = await listTraderShipments(b.id);
    check(ownA.some((s) => s.id === shipmentId), "owner sees own shipment");
    check(!ownB.some((s) => s.id === shipmentId), "other trader does not see it");

    // transitions
    const skip = await transitionShipment({
      id: shipmentId,
      to: "DELIVERED",
      actor: "check",
    });
    check(!skip.ok, "illegal transition refused");
    for (const to of ["PACKED", "HANDED_OVER", "IN_TRANSIT"]) {
      const r = await transitionShipment({
        id: shipmentId,
        to,
        note: "<i>note</i>",
        trackingNumber: to === "HANDED_OVER" ? "TRK123" : undefined,
        actor: "check",
      });
      check(r.ok, `transition to ${to}`);
    }
    const notified = await prisma.traderNotification.count({
      where: { traderId: a.id, href: "/trader/shipments" },
    });
    check(notified >= 2, "owner trader got in-app notifications");
    const notifiedB = await prisma.traderNotification.count({
      where: { traderId: b.id },
    });
    check(notifiedB === 0, "other trader got no notifications");

    // public view
    const pub = await getPublicTracking(row!.publicToken);
    check(!!pub, "public tracking resolves by token");
    const json = JSON.stringify(pub);
    for (const secret of [
      "Private Person",
      "+4912345",
      "Secret Street",
      "130",
      a.email,
      "check",
    ]) {
      check(!json.includes(secret), `public view leaks no "${secret}"`);
    }
    check(pub?.trackingNumber === "TRK123", "tracking number shown publicly");
    check(
      (await getPublicTracking("A".repeat(24))) === null,
      "unknown token → null"
    );
    check((await getPublicTracking("../x")) === null, "malformed token → null");
  } finally {
    if (shipmentId) await prisma.shipment.delete({ where: { id: shipmentId } });
    await prisma.traderNotification.deleteMany({
      where: { traderId: { in: [a.id, b.id] } },
    });
    await prisma.wholesaleRequest.delete({ where: { id: wr.id } });
    await prisma.traderAccount.deleteMany({ where: { id: { in: [a.id, b.id] } } });
    console.log("cleanup: removed shipment-checks fixtures");
  }

  console.log(`\nShipment checks: ${passed} passed, ${failed} failed`);
  await prisma.$disconnect();
  process.exit(failed ? 1 : 0);
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
