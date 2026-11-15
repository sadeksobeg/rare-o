/**
 * Brokerage flow checks (domain layer): payment is the LAST stage, every step needs its predecessor,
 * photo requests work both ways. Run: npm run test:brokerage-flow
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import {
  adminIssueBrokerageInvoice,
  adminRequestBrokeragePhotos,
  adminTransitionBrokerage,
  confirmBrokeragePayment,
  createBrokerageRequest,
  getBrokerageInvoiceByToken,
  traderClaimBrokeragePayment,
  traderSubmitBrokeragePhotos,
  upsertInspection,
} from "../lib/brokerage/service";
import { emptyChecklist } from "../lib/brokerage/inspection";

const prisma = new PrismaClient();
let passed = 0;
let failed = 0;
function check(cond: boolean, msg: string) {
  if (cond) {
    passed += 1;
    console.log(`PASS: ${msg}`);
  } else {
    failed += 1;
    console.log(`FAIL: ${msg}`);
  }
}
async function rejects(fn: () => Promise<unknown>, prefix: string): Promise<boolean> {
  try {
    await fn();
    return false;
  } catch (e) {
    return (e as Error).message.startsWith(prefix);
  }
}

async function main() {
  const hash = await bcrypt.hash("BrokerageCheck1!", 10);
  const trader = await prisma.traderAccount.upsert({
    where: { email: "brokerage-check@rareoud.local" },
    update: { status: "active" },
    create: { email: "brokerage-check@rareoud.local", passwordHash: hash, displayName: "Brokerage Check", status: "active" },
  });
  const admin = await prisma.adminUser.findFirst();
  if (!admin) throw new Error("no admin row");
  const ids: string[] = [];
  const t = (id: string, toStatus: Parameters<typeof adminTransitionBrokerage>[0]["toStatus"], extra: Record<string, unknown> = {}) =>
    adminTransitionBrokerage({ id, toStatus, adminId: admin.id, ...extra });
  try {
    const row = await createBrokerageRequest({
      traderId: trader.id,
      descriptionAr: "عود قديم للمعاينة",
      modelNumber: "BR-CHK-1",
      statedPriceUsd: 1200,
    });
    ids.push(row.id);
    const id = row.id;
    check(/^BR-\d{4}-[A-HJKMNP-Z2-9]{6}$/.test(row.reference), "reference format BR-YYYY-XXXXXX");
    check(row.status === "SUBMITTED", "a new request starts at SUBMITTED (no payment first)");

    // photos: admin asks, trader answers; trader can also send extras
    const pr = await adminRequestBrokeragePhotos({ requestId: id, adminId: admin.id, note: "صورة للختم من الداخل" });
    check(!!pr.photoRequest.id && pr.photoRequest.fulfilledAt === null, "admin photo request is open");
    check(await rejects(() => adminRequestBrokeragePhotos({ requestId: id, adminId: admin.id, note: "x" }), "NOTE_REQUIRED"), "photo request needs a real note");
    await traderSubmitBrokeragePhotos({ requestId: id, traderId: trader.id, photoRequestId: pr.photoRequest.id, paths: ["/api/media/brokerage/x/a.webp", "/api/media/brokerage/x/b.webp"], note: "تفضل" });
    const answered = await prisma.brokeragePhotoRequest.findUniqueOrThrow({ where: { id: pr.photoRequest.id } });
    check(!!answered.fulfilledAt && JSON.parse(answered.photoPaths).length === 2, "trader photos fulfil the request");
    await traderSubmitBrokeragePhotos({ requestId: id, traderId: trader.id, paths: ["/api/media/brokerage/x/c.webp"] });
    check((await prisma.brokeragePhotoRequest.count({ where: { requestId: id } })) === 2, "an extra batch by the trader is recorded");
    check((JSON.parse((await prisma.brokerageRequest.findUniqueOrThrow({ where: { id } })).photoPaths) as string[]).length === 3, "all photos appear on the request");
    check(await rejects(() => traderSubmitBrokeragePhotos({ requestId: id, traderId: "someone-else", paths: ["/api/media/brokerage/x/z.webp"] }), "NOT_FOUND"), "another trader cannot send photos to this request");

    // gating
    check(await rejects(() => t(id, "AWAITING_PAYMENT"), "INVALID_TRANSITION"), "no payment stage straight from SUBMITTED");
    await t(id, "ACCEPTED");
    check(await rejects(() => t(id, "INSPECTION_SCHEDULED"), "INSPECTION_DATE_REQUIRED"), "scheduling needs a date");
    await t(id, "INSPECTION_SCHEDULED", { inspectionAt: new Date(Date.now() + 86400000), inspectionLocation: "دمشق" });
    check(await rejects(() => t(id, "INSPECTED"), "INSPECTION_REPORT_REQUIRED"), "INSPECTED needs the report");
    await upsertInspection({
      requestId: id,
      adminId: admin.id,
      grade: "A",
      notesAr: "قطعة ممتازة",
      verdictAr: "يوصى بالشراء",
      checklist: JSON.stringify(emptyChecklist()),
    });
    check((await prisma.brokerageRequest.findUniqueOrThrow({ where: { id } })).status === "INSPECTED", "saving the report moves to INSPECTED");
    check(await rejects(() => t(id, "SHIPPED"), "INVALID_TRANSITION"), "no shipping before purchase and payment");
    await t(id, "PURCHASED");
    check(await rejects(() => t(id, "SHIPPED"), "PAYMENT_REQUIRED"), "no shipping before payment");
    await t(id, "AWAITING_PAYMENT");
    check(await rejects(() => confirmBrokeragePayment({ id, adminId: admin.id }), "INVOICE_REQUIRED"), "payment cannot be confirmed before the invoice is sent");
    const inv = await adminIssueBrokerageInvoice({ requestId: id, adminId: admin.id });
    check(!!inv.invoiceToken && !!(await getBrokerageInvoiceByToken(inv.invoiceToken!)), "invoice issued and resolvable by token");
    await traderClaimBrokeragePayment({ requestId: id, traderId: trader.id, via: "platform" });
    await traderClaimBrokeragePayment({ requestId: id, traderId: trader.id, via: "whatsapp" });
    check((await prisma.brokerageRequest.findUniqueOrThrow({ where: { id } })).paymentClaimedVia === "platform", "payment notice recorded once");
    await confirmBrokeragePayment({ id, adminId: admin.id });
    check(await rejects(() => t(id, "SHIPPED"), "CARRIER_REQUIRED"), "carrier is required to ship");
    await t(id, "SHIPPED", { carrier: "DHL" });
    const shipped = await prisma.brokerageRequest.findUniqueOrThrow({ where: { id } });
    check(shipped.status === "SHIPPED" && shipped.trackingRef === "", "shipping works without a tracking number");
    await t(id, "DELIVERED");
    await t(id, "CLOSED");
    check((await prisma.brokerageRequest.findUniqueOrThrow({ where: { id } })).status === "CLOSED", "full path ends CLOSED");
    check(await rejects(() => adminRequestBrokeragePhotos({ requestId: id, adminId: admin.id, note: "متأخر جداً" }), "PHOTOS_NOT_ALLOWED"), "no photo requests on a closed request");
  } finally {
    await prisma.brokerageRequest.deleteMany({ where: { id: { in: ids } } });
    console.log("cleanup: removed brokerage-flow fixtures");
  }
  console.log(`\nBrokerage flow checks: ${passed} passed, ${failed} failed`);
  await prisma.$disconnect();
  process.exit(failed ? 1 : 0);
}
main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
