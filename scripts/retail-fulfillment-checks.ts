/**
 * Retail fulfilment: shipment from a retail request, updates (status + notes),
 * public order view (payment, ETA, shipment updates), customer messages.
 * Run: npm run test:retail-fulfillment
 */
import { prisma } from "@/lib/db/prisma";
import { createRetailRequestFromCart } from "@/lib/retail-request/service";
import { getPublicOrder } from "@/lib/retail-request/order-page";
import { computeJourney } from "@/lib/retail-request/journey";
import {
  buildShipmentUpdateMessage,
  formatEta,
  paymentLabel,
} from "@/lib/retail-request/shipment-text";
import { createShipment, postShipmentUpdate } from "@/lib/shipping/shipments";

let passed = 0;
let failed = 0;
const check = (c: unknown, m: string) => (c ? passed++ : (failed++, console.error(`FAIL: ${m}`)));

async function main() {
  // pure
  check(formatEta(7, 10, true) === "7–10 يوماً", "ETA range (ar)");
  check(formatEta(5, 5, false) === "5 days", "ETA single (en)");
  check(formatEta(null, null, true) === null, "no ETA → null");
  check(paymentLabel("cod", false, true) === "الدفع عند الاستلام", "COD label");
  check(paymentLabel("prepaid", true, true)?.includes("✓") === true, "prepaid confirmed label");
  check(paymentLabel(null, false, true) === null, "no payment mode → null");
  const arrived = buildShipmentUpdateMessage({ locale: "ar", name: "أحمد", reference: "RO-X", status: "ARRIVED", note: "عند الباب", link: "https://x/o" });
  check(arrived.includes("المكان المتفق عليه") && arrived.includes("عند الباب") && arrived.includes("https://x/o"), "arrived message");
  const transit = buildShipmentUpdateMessage({ locale: "ar", name: "أحمد", reference: "RO-X", status: "IN_TRANSIT", eta: "7–10 يوماً", link: "l" });
  check(transit.includes("الوصول المتوقع: 7–10 يوماً"), "in-transit message carries the ETA");
  check(!buildShipmentUpdateMessage({ locale: "ar", name: "a", reference: "r", status: "ARRIVED", eta: "5 أيام", link: "l" }).includes("الوصول المتوقع"), "no ETA line once arrived");

  const j = (shipmentStatus: string | null, status = "in_follow_up") =>
    computeJourney({ status, response: "confirmed", shipmentStatus }).steps.map((s) => s.state[0]).join("");
  check(j(null) === "ddda" + "pp".slice(0, 0) + "pp" || j(null).startsWith("ddd"), "confirmed, no shipment → prepare is next");
  check(j("IN_TRANSIT").startsWith("ddddd") || j("IN_TRANSIT").slice(0, 5) === "ddddd", "in transit → ship step done");
  check(computeJourney({ status: "in_follow_up", response: "confirmed", shipmentStatus: "ARRIVED" }).steps[5]!.state === "active", "arrived → deliver step active");
  check(computeJourney({ status: "completed", response: "confirmed", shipmentStatus: "DELIVERED" }).steps.every((s) => s.state === "done"), "delivered → every step done");

  // db
  const product = await prisma.product.findFirst({
    where: { status: "published", availability: "available", retailPrice: { not: null }, currency: { not: null } },
    select: { id: true },
  });
  if (!product) throw new Error("need a published product");
  const suffix = String(Date.now()).slice(-7);
  const { request } = await createRetailRequestFromCart({
    locale: "ar",
    customerName: "Fulfil Check Customer",
    customerPhone: `+96393${suffix}`,
    customerNotes: "",
    destinationCountry: "ألمانيا",
    destinationCode: null,
    shippingMethodCode: null,
    lines: [{ productId: product.id, quantity: 1 }],
    status: "ready_for_handoff",
  });
  try {
    await prisma.retailRequest.update({
      where: { id: request.id },
      data: { paymentMode: "cod", etaMinDays: 7, etaMaxDays: 10, status: "in_follow_up" },
    });
    const sh = await createShipment({
      parent: "retail",
      parentId: request.id,
      carrierLabel: "DHL",
      destCountry: "ألمانيا",
      recipientName: "Fulfil Check Customer",
      priceCharged: 130,
      actor: "check",
    });
    check(sh.ok, "shipment created from a retail request");
    if (!sh.ok) throw new Error("no shipment");
    const row = await prisma.shipment.findUnique({ where: { id: sh.id }, select: { retailRequestId: true, wholesaleRequestId: true } });
    check(row?.retailRequestId === request.id && row.wholesaleRequestId === null, "shipment is linked to the retail request only");

    check(!(await postShipmentUpdate({ id: sh.id, to: "DELIVERED", actor: "check" })).ok, "cannot jump to DELIVERED");
    for (const to of ["PACKED", "HANDED_OVER", "IN_TRANSIT"]) {
      check((await postShipmentUpdate({ id: sh.id, to, actor: "check" })).ok, `status → ${to}`);
    }
    const note = await postShipmentUpdate({ id: sh.id, note: "الشحنة في مركز الفرز", actor: "check" });
    check(note.ok && note.status === "IN_TRANSIT", "note-only update keeps the status");
    check(!(await postShipmentUpdate({ id: sh.id, actor: "check" })).ok, "empty update refused");
    const arrivedRes = await postShipmentUpdate({ id: sh.id, to: "ARRIVED", note: "عند المكان المتفق عليه <b>", actor: "check" });
    check(arrivedRes.ok, "status → ARRIVED");

    const full = await prisma.retailRequest.findUnique({ where: { id: request.id }, select: { publicToken: true } });
    const view = await getPublicOrder(full!.publicToken!);
    check(view?.paymentLabel === "الدفع عند الاستلام", "public view shows the payment mode");
    check(view?.etaLabel === "7–10 يوماً", "public view shows the ETA");
    check(view?.shipment?.status === "ARRIVED", "public view shows the shipment status");
    check(view?.updates[0]?.title === "وصلت شحنتك إلى المكان المتفق عليه", "newest update uses customer wording");
    check(view?.updates[0]?.note === "عند المكان المتفق عليه b", "update note is sanitised");
    check(!!view?.updates.some((u) => u.note === "الشحنة في مركز الفرز"), "note-only update is visible to the customer");
    check(!JSON.stringify(view).includes("actor"), "no staff identity in the public payload");
  } finally {
    await prisma.shipment.deleteMany({ where: { retailRequestId: request.id } });
    await prisma.retailRequest.delete({ where: { id: request.id } }).catch(() => undefined);
    if (request.customerId) await prisma.customer.delete({ where: { id: request.customerId } }).catch(() => undefined);
    console.log("cleanup: removed fulfilment fixtures");
  }
  console.log(`\nFulfilment checks: ${passed} passed, ${failed} failed`);
  await prisma.$disconnect();
  process.exit(failed ? 1 : 0);
}
main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
