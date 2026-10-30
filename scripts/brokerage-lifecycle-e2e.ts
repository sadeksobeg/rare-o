/**
 * End-to-end brokerage lifecycle against the real DB/service layer.
 * Covers happy path + decline + quote-reject branches.
 *
 *   npx tsx scripts/brokerage-lifecycle-e2e.ts
 */
import { prisma } from "../lib/db/prisma";
import {
  adminTransitionBrokerage,
  createBrokerageRequest,
  traderTransitionBrokerage,
  upsertAndSendQuote,
  upsertInspection,
} from "../lib/brokerage/service";

function assert(cond: unknown, msg: string): asserts cond {
  if (!cond) throw new Error(msg);
}

const createdIds: string[] = [];

async function happyPath(traderId: string) {
  const row = await createBrokerageRequest({
    traderId,
    descriptionAr: "E2E وساطة — مسار سعيد كامل",
    descriptionEn: "E2E brokerage happy path",
    categoryAr: "عود",
    cityAr: "دمشق",
    quantity: 1,
    budgetMinUsd: 1000,
    budgetMaxUsd: 2000,
  });
  createdIds.push(row.id);
  assert(row.status === "SUBMITTED", "create → SUBMITTED");

  await adminTransitionBrokerage({ id: row.id, toStatus: "ACCEPTED" });
  await adminTransitionBrokerage({
    id: row.id,
    toStatus: "INSPECTION_SCHEDULED",
    inspectionAssignee: "Field Tech",
    inspectionLocation: "Damascus",
    inspectionAt: new Date(),
  });
  await upsertInspection({
    requestId: row.id,
    grade: "A",
    notesAr: "حالة ممتازة",
    notesEn: "Excellent",
    verdictAr: "موصى",
    verdictEn: "Recommended",
  });
  let cur = await prisma.brokerageRequest.findUniqueOrThrow({
    where: { id: row.id },
  });
  assert(cur.status === "INSPECTED", `inspect → INSPECTED got ${cur.status}`);

  await upsertAndSendQuote({
    requestId: row.id,
    goodsValueUsd: 1800,
    commissionRate: 1.5,
    shippingUsd: 40,
  });
  cur = await prisma.brokerageRequest.findUniqueOrThrow({ where: { id: row.id } });
  assert(cur.status === "QUOTE_SENT", "quote → QUOTE_SENT");

  await traderTransitionBrokerage({
    id: row.id,
    traderId,
    toStatus: "APPROVED",
  });
  await adminTransitionBrokerage({ id: row.id, toStatus: "PURCHASED" });
  await adminTransitionBrokerage({
    id: row.id,
    toStatus: "SHIPPED",
    carrier: "Aramex",
    trackingRef: "E2E-TRACK-1",
  });
  await adminTransitionBrokerage({ id: row.id, toStatus: "DELIVERED" });
  await adminTransitionBrokerage({ id: row.id, toStatus: "CLOSED" });

  const done = await prisma.brokerageRequest.findUniqueOrThrow({
    where: { id: row.id },
    include: { events: true, quote: true, inspection: true },
  });
  assert(done.status === "CLOSED", "final CLOSED");
  assert(done.quote, "quote present");
  assert(done.inspection, "inspection present");
  assert(
    done.events.length >= 8,
    `timeline events >= 8 got ${done.events.length}`
  );
  console.log(
    `✓ happy path ${done.reference} → CLOSED (${done.events.length} events)`
  );
}

async function adminDeclinePath(traderId: string) {
  const row = await createBrokerageRequest({
    traderId,
    descriptionAr: "E2E وساطة — رفض إداري",
    descriptionEn: "E2E admin decline",
  });
  createdIds.push(row.id);
  await adminTransitionBrokerage({
    id: row.id,
    toStatus: "DECLINED",
    declineReason: "Out of scope",
  });
  const cur = await prisma.brokerageRequest.findUniqueOrThrow({
    where: { id: row.id },
  });
  assert(cur.status === "DECLINED", "DECLINED");
  console.log(`✓ admin decline ${cur.reference}`);
}

async function traderRejectQuotePath(traderId: string) {
  const row = await createBrokerageRequest({
    traderId,
    descriptionAr: "E2E وساطة — رفض عرض",
    descriptionEn: "E2E trader reject quote",
  });
  createdIds.push(row.id);
  await adminTransitionBrokerage({ id: row.id, toStatus: "ACCEPTED" });
  await adminTransitionBrokerage({
    id: row.id,
    toStatus: "INSPECTION_SCHEDULED",
  });
  await upsertInspection({
    requestId: row.id,
    grade: "C",
    notesAr: "تحفظ",
    notesEn: "Caution",
    verdictAr: "تحفظ",
    verdictEn: "Hold",
  });
  await upsertAndSendQuote({
    requestId: row.id,
    goodsValueUsd: 900,
    commissionRate: 2,
    shippingUsd: 30,
  });
  await traderTransitionBrokerage({
    id: row.id,
    traderId,
    toStatus: "REJECTED",
  });
  const cur = await prisma.brokerageRequest.findUniqueOrThrow({
    where: { id: row.id },
  });
  assert(cur.status === "REJECTED", "REJECTED");
  console.log(`✓ trader reject quote ${cur.reference}`);
}

async function needsInfoPath(traderId: string) {
  const row = await createBrokerageRequest({
    traderId,
    descriptionAr: "E2E وساطة — بحاجة لمعلومات ثم قبول",
    descriptionEn: "E2E needs info then accept",
  });
  createdIds.push(row.id);
  await adminTransitionBrokerage({ id: row.id, toStatus: "NEEDS_INFO" });
  await traderTransitionBrokerage({
    id: row.id,
    traderId,
    toStatus: "SUBMITTED",
  });
  await adminTransitionBrokerage({ id: row.id, toStatus: "ACCEPTED" });
  const cur = await prisma.brokerageRequest.findUniqueOrThrow({
    where: { id: row.id },
  });
  assert(cur.status === "ACCEPTED", "NEEDS_INFO loop → ACCEPTED");
  console.log(`✓ needs-info loop ${cur.reference}`);
}

async function traderCancelPath(traderId: string) {
  const row = await createBrokerageRequest({
    traderId,
    descriptionAr: "E2E وساطة — إلغاء من التاجر",
    descriptionEn: "E2E trader cancel",
  });
  createdIds.push(row.id);
  await traderTransitionBrokerage({
    id: row.id,
    traderId,
    toStatus: "CANCELLED",
  });
  const cur = await prisma.brokerageRequest.findUniqueOrThrow({
    where: { id: row.id },
  });
  assert(cur.status === "CANCELLED", "CANCELLED");
  console.log(`✓ trader cancel ${cur.reference}`);
}

async function cleanup() {
  if (createdIds.length === 0) return;
  const { count } = await prisma.brokerageRequest.deleteMany({
    where: { id: { in: createdIds } },
  });
  console.log(`cleanup: removed ${count} E2E brokerage request(s)`);
}

async function main() {
  const trader = await prisma.traderAccount.findFirst({
    where: { email: "trader@rareoud.local" },
  });
  assert(trader, "seed trader missing — run npm run db:seed");

  await happyPath(trader.id);
  await adminDeclinePath(trader.id);
  await traderRejectQuotePath(trader.id);
  await needsInfoPath(trader.id);
  await traderCancelPath(trader.id);

  console.log("\nAll brokerage lifecycle checks passed.");
}

main()
  .catch((e) => {
    console.error("FAIL", e);
    process.exitCode = 1;
  })
  .finally(async () => {
    try {
      await cleanup();
    } catch (e) {
      console.error("cleanup failed", e);
      process.exitCode = 1;
    }
    await prisma.$disconnect();
    if (process.exitCode) process.exit(process.exitCode);
  });
