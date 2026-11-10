/**
 * Slice C — C08: new storefront retail request must appear in KPI + ActionQueue.
 * Run: npx tsx scripts/slice-c-c08-kpi-queue.ts
 */
import { PrismaClient } from "@prisma/client";
import {
  countRetailAwaitingAdmin,
  getActionQueueRows,
} from "../lib/admin/dashboard";
import { createRetailRequestFromCart } from "../lib/retail-request/service";

const prisma = new PrismaClient();

function assert(cond: boolean, msg: string): void {
  if (!cond) {
    console.error(`FAIL: ${msg}`);
    throw new Error(msg);
  }
  console.log(`PASS: ${msg}`);
}

async function main() {
  if (!process.env.WHATSAPP_BUSINESS_E164) {
    process.env.WHATSAPP_BUSINESS_E164 = "963900000000";
  }

  const product = await prisma.product.findFirst({
    where: { status: "published", availability: "available" },
    select: { id: true },
  });
  assert(!!product, "published available product exists");

  const kpiBefore = await countRetailAwaitingAdmin();
  const queueBefore = await getActionQueueRows(8);
  const inQueueBefore = queueBefore.some((r) => r.domain === "retail");

  const { request } = await createRetailRequestFromCart({
    locale: "ar",
    customerName: "C08 Queue Customer",
    customerPhone: "+963911100008",
    customerNotes: "slice-c-c08",
    destinationCountry: "Syria",
    shippingMethodCode: null,
    shippingMethodLabel: null,
    lines: [{ productId: product!.id, quantity: 1 }],
    status: "ready_for_handoff",
  });

  assert(request.status === "ready_for_handoff", "created as ready_for_handoff");

  const kpiAfter = await countRetailAwaitingAdmin();
  assert(
    kpiAfter === kpiBefore + 1,
    `KPI retail +1 (${kpiBefore} → ${kpiAfter})`
  );

  const queueAfter = await getActionQueueRows(8);
  const hit = queueAfter.find(
    (r) => r.domain === "retail" && r.id === request.id
  );
  assert(!!hit, `ActionQueue contains new request ${request.reference}`);
  assert(
    hit!.href === `/admin/requests/${request.id}`,
    "ActionQueue row links to admin request detail"
  );

  // Cleanup
  await prisma.retailRequest.update({
    where: { id: request.id },
    data: { status: "cancelled" },
  });
  const kpiClean = await countRetailAwaitingAdmin();
  assert(kpiClean === kpiBefore, `KPI restored after cancel (${kpiClean})`);

  console.log(
    `C08 evidence: ref=${request.reference} kpi ${kpiBefore}->${kpiAfter}->${kpiClean}; queueHadRetailBefore=${inQueueBefore}`
  );
  console.log("Slice C C08: all assertions passed.");
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
