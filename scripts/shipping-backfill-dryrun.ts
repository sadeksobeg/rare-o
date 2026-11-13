/** READ-ONLY dry-run: how many requests would get a backfilled Shipment. Writes nothing. */
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
(async () => {
  const [w, b, existing] = await Promise.all([
    prisma.wholesaleRequest.count({
      where: { status: { in: ["confirmed", "completed"] }, shipments: { none: {} } },
    }),
    prisma.brokerageRequest.count({
      where: { status: { in: ["PURCHASED", "SHIPPED", "DELIVERED"] }, shipments: { none: {} } },
    }),
    prisma.shipment.count(),
  ]);
  console.log(JSON.stringify({ wouldBackfillWholesale: w, wouldBackfillBrokerage: b, existingShipments: existing, writes: 0 }));
  await prisma.$disconnect();
})();
