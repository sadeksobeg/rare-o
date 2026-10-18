/**
 * Curated Arabic demo dataset — clearly marked demo, no invented commercial terms.
 * Run: npm run db:seed:demo
 *
 * Does NOT wipe the database. Upserts demo traders/deals with DEMO references
 * that stay hidden from UI unless RO_SHOW_UI_FIXTURES=1.
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const hash = await bcrypt.hash("DemoTrader!2026", 10);

  const trader = await prisma.traderAccount.upsert({
    where: { email: "demo-ar@rareoud.local" },
    create: {
      email: "demo-ar@rareoud.local",
      passwordHash: hash,
      displayName: "Demo Trader",
      companyName: "تاجر تجريبي — RARE OUD",
      phone: "+963900000001",
      status: "active",
      adminNotes: "[DEMO] Seeded Arabic demo trader — hide via ui-hidden",
      interestCategorySlugs: "string-instruments",
      interestNotes: "اهتمام بقطع العود المختارة",
    },
    update: {
      displayName: "Demo Trader",
      companyName: "تاجر تجريبي — RARE OUD",
      adminNotes: "[DEMO] Seeded Arabic demo trader — hide via ui-hidden",
    },
  });

  const product = await prisma.product.findFirst({
    where: { status: "published" },
    orderBy: { createdAt: "asc" },
  });

  if (product) {
    await prisma.dealProposal.upsert({
      where: { reference: "DL-DEMO-WAIT" },
      create: {
        reference: "DL-DEMO-WAIT",
        traderId: trader.id,
        dealKind: "catalog",
        status: "proposed",
        title: "عرض تجريبي على قطعة كتالوج",
        productId: product.id,
        proposedPrice: product.retailPrice,
        currency: product.currency,
        quantity: 1,
        conditionsNotes: "[DEMO] بيانات عرض فقط — ليست شروطاً تجارية ملزمة",
      },
      update: {
        title: "عرض تجريبي على قطعة كتالوج",
        status: "proposed",
      },
    });
  }

  const existingCustomer = await prisma.customer.findFirst({
    where: { phone: "+963911000001" },
  });
  if (!existingCustomer) {
    await prisma.customer.create({
      data: {
        name: "عميل تجريبي",
        phone: "+963911000001",
        notes: "[DEMO]",
      },
    });
  }

  console.log("db:seed:demo OK", {
    trader: trader.email,
    product: product?.slug ?? null,
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
