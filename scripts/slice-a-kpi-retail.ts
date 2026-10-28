/**
 * Slice A — retail KPI regression.
 * A new storefront request (ready_for_handoff) must increase the admin
 * "طلبات جديدة" / retail-awaiting-admin count immediately.
 *
 * Run: npx tsx scripts/slice-a-kpi-retail.ts
 */
import { PrismaClient } from "@prisma/client";
import { countRetailAwaitingAdmin } from "../lib/admin/dashboard";
import { createRetailRequestFromCart } from "../lib/retail-request/service";
import { retailNextActor } from "../lib/ui/status";

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

  assert(
    retailNextActor("ready_for_handoff") === "admin",
    "ready_for_handoff.nextActor === admin"
  );

  const product = await prisma.product.findFirst({
    where: { status: "published", availability: "available" },
    select: { id: true },
  });
  assert(!!product, "published available product exists for storefront create");

  const before = await countRetailAwaitingAdmin();

  const { request } = await createRetailRequestFromCart({
    locale: "ar",
    customerName: "Slice A KPI Customer",
    customerPhone: "+963911100001",
    customerNotes: "slice-a-kpi",
    destinationCountry: "Syria",
    shippingMethodCode: null,
    shippingMethodLabel: null,
    lines: [{ productId: product!.id, quantity: 1 }],
    status: "ready_for_handoff",
  });

  assert(
    request.status === "ready_for_handoff",
    "storefront create status is ready_for_handoff"
  );

  const after = await countRetailAwaitingAdmin();
  assert(
    after === before + 1,
    `retail awaiting-admin KPI increases immediately (${before} → ${after})`
  );

  // Cleanup: cancel so repeated runs stay stable (cancelled = nextActor none).
  await prisma.retailRequest.update({
    where: { id: request.id },
    data: { status: "cancelled" },
  });

  const cleaned = await countRetailAwaitingAdmin();
  assert(
    cleaned === before,
    `KPI returns after cancel cleanup (${cleaned} === ${before})`
  );

  console.log("Slice A KPI retail: all assertions passed.");
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
