/**
 * Brokerage lifecycle E2E — payment-first path (2026-11-03).
 * Run: npx tsx scripts/brokerage-lifecycle-e2e.ts
 */
import { prisma } from "../lib/db/prisma";
import {
  adminTransitionBrokerage,
  confirmBrokeragePayment,
  createBrokerageRequest,
  traderTransitionBrokerage,
  upsertAndSendQuote,
  upsertInspection,
} from "../lib/brokerage/service";

function assert(cond: unknown, msg: string): asserts cond {
  if (!cond) throw new Error(msg);
}

const createdIds: string[] = [];

const seedFields = {
  modelNumber: "E2E-MODEL-1",
  statedPriceUsd: 1500,
} as const;

async function createSeed(traderId: string, ar: string, en: string, extra?: Record<string, unknown>) {
  const row = await createBrokerageRequest({
    traderId,
    descriptionAr: ar,
    descriptionEn: en,
    ...seedFields,
    ...extra,
  });
  createdIds.push(row.id);
  return row;
}

/** AWAITING_PAYMENT → PAYMENT_CONFIRMED → ACCEPTED */
async function unlockAfterPayment(id: string, adminId: string) {
  await confirmBrokeragePayment({ id, adminId });
  await adminTransitionBrokerage({ id, toStatus: "ACCEPTED" });
}

async function happyPath(traderId: string, adminId: string) {
  const row = await createSeed(
    traderId,
    "E2E وساطة — مسار سعيد كامل",
    "E2E brokerage happy path",
    {
      categoryAr: "عود",
      cityAr: "دمشق",
      quantity: 1,
      budgetMinUsd: 1000,
      budgetMaxUsd: 2000,
    }
  );
  assert(row.status === "AWAITING_PAYMENT", "create → AWAITING_PAYMENT");

  await unlockAfterPayment(row.id, adminId);
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
    include: { events: true, inspection: true },
  });
  assert(done.status === "CLOSED", "final CLOSED");
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
  const row = await createSeed(
    traderId,
    "E2E وساطة — رفض إداري",
    "E2E admin decline"
  );
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

async function traderRejectQuotePath(traderId: string, adminId: string) {
  const row = await createSeed(
    traderId,
    "E2E وساطة — رفض عرض",
    "E2E trader reject quote"
  );
  await unlockAfterPayment(row.id, adminId);
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

async function needsInfoPath(traderId: string, adminId: string) {
  const row = await createSeed(
    traderId,
    "E2E وساطة — بحاجة لمعلومات ثم قبول",
    "E2E needs info then accept"
  );
  await adminTransitionBrokerage({ id: row.id, toStatus: "NEEDS_INFO" });
  await traderTransitionBrokerage({
    id: row.id,
    traderId,
    toStatus: "AWAITING_PAYMENT",
  });
  await unlockAfterPayment(row.id, adminId);
  const cur = await prisma.brokerageRequest.findUniqueOrThrow({
    where: { id: row.id },
  });
  assert(cur.status === "ACCEPTED", "NEEDS_INFO loop → ACCEPTED");
  console.log(`✓ needs-info loop ${cur.reference}`);
}

async function traderCancelPath(traderId: string) {
  const row = await createSeed(
    traderId,
    "E2E وساطة — إلغاء من التاجر",
    "E2E trader cancel"
  );
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
  const admin = await prisma.adminUser.findFirst();
  assert(admin, "seed admin missing — run npm run db:seed");

  await happyPath(trader.id, admin.id);
  await adminDeclinePath(trader.id);
  await traderRejectQuotePath(trader.id, admin.id);
  await needsInfoPath(trader.id, admin.id);
  await traderCancelPath(trader.id);

  console.log("\nAll brokerage lifecycle checks passed.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await cleanup();
    await prisma.$disconnect();
  });
