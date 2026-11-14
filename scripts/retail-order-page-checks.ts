/**
 * Customer order page + confirmation message. Run: npm run test:retail-order-page
 */
import { prisma } from "@/lib/db/prisma";
import { createRetailRequestFromCart } from "@/lib/retail-request/service";
import {
  buildConfirmationMessage,
  buildStatusUpdateMessage,
  ensureOrderToken,
  getPublicOrder,
  isPlausibleOrderToken,
  missingCustomerData,
  orderPageUrl,
  submitCustomerResponse,
} from "@/lib/retail-request/order-page";

let passed = 0;
let failed = 0;
const check = (c: unknown, m: string) => (c ? passed++ : (failed++, console.error(`FAIL: ${m}`)));

async function main() {
  const product = await prisma.product.findFirst({
    where: { status: "published", availability: "available", retailPrice: { not: null }, currency: { not: null } },
    select: { id: true },
  });
  if (!product) throw new Error("need a published product");
  const suffix = String(Date.now()).slice(-7);
  const phone = `+96394${suffix}`;
  const { request } = await createRetailRequestFromCart({
    locale: "ar",
    customerName: "Order Page Check",
    customerPhone: phone,
    customerNotes: "ملاحظة اختبار",
    destinationCountry: "ألمانيا",
    destinationCode: null,
    shippingMethodCode: null,
    lines: [{ productId: product.id, quantity: 2 }],
    status: "ready_for_handoff",
  });
  let legacyId: string | null = null;
  try {
    const row = await prisma.retailRequest.findUnique({ where: { id: request.id }, select: { publicToken: true } });
    check(!!row?.publicToken && isPlausibleOrderToken(row.publicToken), "new request gets an unguessable order token");
    const token = row!.publicToken!;

    const view = await getPublicOrder(token);
    check(view?.reference === request.reference, "token resolves the request");
    check(view?.phone === phone, "the customer sees their own phone exactly as stored (unmasked)");
    check(!JSON.stringify(view).includes("adminId"), "no admin identifiers in the public payload");
    check((await getPublicOrder("A".repeat(24))) === null, "unknown token → null");
    check((await getPublicOrder("../etc/passwd")) === null, "malformed token → null");

    // customer answers
    const noNote = await submitCustomerResponse({ token, response: "changes_requested", note: "" });
    check(!noNote.ok && noNote.error === "NOTE_REQUIRED", "change request needs a note");
    const changes = await submitCustomerResponse({ token, response: "changes_requested", note: "الاسم خطأ <b>x</b>" });
    check(changes.ok, "change request accepted");
    let after = await prisma.retailRequest.findUnique({ where: { id: request.id }, select: { customerResponse: true, customerResponseNote: true } });
    check(after?.customerResponse === "changes_requested" && !after.customerResponseNote?.includes("<"), "response stored, markup stripped");
    const confirmed = await submitCustomerResponse({ token, response: "confirmed" });
    check(confirmed.ok, "confirmation accepted");
    after = await prisma.retailRequest.findUnique({ where: { id: request.id }, select: { customerResponse: true, customerResponseNote: true } });
    check(after?.customerResponse === "confirmed", "latest answer wins");
    const events = await prisma.retailHandoffEvent.findMany({ where: { requestId: request.id }, select: { eventType: true, actor: true } });
    check(events.some((e) => e.eventType === "customer_confirmed" && e.actor === "customer"), "events record the customer's answers");

    // closed requests reject answers
    await prisma.retailRequest.update({ where: { id: request.id }, data: { status: "completed" } });
    const closed = await submitCustomerResponse({ token, response: "confirmed" });
    check(!closed.ok && closed.error === "REQUEST_CLOSED", "closed request rejects answers");

    // old request without a token gets one lazily
    const old = await prisma.retailRequest.create({
      data: {
        reference: `RO-2026-${suffix.slice(0, 4)}`,
        locale: "ar",
        status: "ready_for_handoff",
        customerName: "Legacy Name Here",
        customerPhone: phone,
        destinationCountry: "x",
        subtotal: 1,
        currency: "USD",
        handoffPayloadJson: "{}",
      },
    });
    legacyId = old.id;
    const lazy = await ensureOrderToken(old.id);
    check(!!lazy && lazy === (await ensureOrderToken(old.id)), "legacy request gets a stable token lazily");

    // message
    check(
      JSON.stringify(missingCustomerData({ customerName: "صادق", customerPhone: "12", destinationCountry: "غير محدد" })) ===
        JSON.stringify(["name", "phone", "destination"]),
      "missing-data detector"
    );
    const msg = buildConfirmationMessage({
      locale: "ar",
      reference: request.reference,
      customerName: "أحمد محمد العلي",
      customerPhone: phone,
      destinationCountry: "ألمانيا",
      customerNotes: "",
      currency: "USD",
      subtotal: 1000,
      shippingCostAmount: 130,
      shippingCostCurrency: "USD",
      shippingMethodLabel: "شحن بري",
      lines: [{ name: "قانون", quantity: 1, lineTotal: 1000 }],
      link: orderPageUrl(token),
      missing: ["phone"],
    });
    check(msg.includes(request.reference) && msg.includes("أحمد محمد العلي") && msg.includes(phone), "message fills name, reference, phone");
    check(msg.includes("1,130 USD"), "message shows the estimated total");
    check(msg.includes(`/order/${token}`) && msg.includes("رقم الهاتف"), "message carries the link and the missing-data reminder");
    const upd = buildStatusUpdateMessage({ locale: "ar", name: "أحمد", reference: "RO-X", status: "completed", link: "https://x/o" });
    check(upd.includes("مكتمل") && upd.includes("https://x/o"), "status update message");
  } finally {
    await prisma.retailRequest.delete({ where: { id: request.id } }).catch(() => undefined);
    if (legacyId) await prisma.retailRequest.delete({ where: { id: legacyId } }).catch(() => undefined);
    if (request.customerId) await prisma.customer.delete({ where: { id: request.customerId } }).catch(() => undefined);
    console.log("cleanup: removed order-page fixtures");
  }
  console.log(`\nOrder-page checks: ${passed} passed, ${failed} failed`);
  await prisma.$disconnect();
  process.exit(failed ? 1 : 0);
}
main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
