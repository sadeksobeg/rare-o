import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const FOREIGN_TRADER_EMAIL = "e2e-foreign-trader@rareoud.test";
const E2E_CUSTOMER_PHONE = "+963911000099";

let prismaSingleton: PrismaClient | null = null;

function db(): PrismaClient {
  if (!prismaSingleton) prismaSingleton = new PrismaClient();
  return prismaSingleton;
}

export async function disconnectEnsureSeed(): Promise<void> {
  if (prismaSingleton) {
    await prismaSingleton.$disconnect();
    prismaSingleton = null;
  }
}

export async function assertRetailIdempotencyColumn(): Promise<void> {
  try {
    await db().$queryRaw`SELECT "idempotencyKey" FROM "RetailRequest" LIMIT 0`;
  } catch {
    throw new Error(
      "E2E DB missing RetailRequest.idempotencyKey — run: npm run db:migrate"
    );
  }
}

export async function ensurePublishedCatalogProduct(): Promise<void> {
  const n = await db().product.count({ where: { status: "published" } });
  if (n === 0) {
    throw new Error(
      "E2E seed: no published products — run: npm run db:seed"
    );
  }
}

export async function ensureCelloStudioFixture(): Promise<void> {
  const p = await db().product.findUnique({ where: { slug: "cello-studio" } });
  if (!p || p.status !== "published") {
    throw new Error(
      "E2E seed: cello-studio unavailable fixture missing — run: npm run db:seed"
    );
  }
}

export async function ensureAdminDealListed(): Promise<void> {
  const n = await db().dealProposal.count();
  if (n === 0) {
    throw new Error("E2E seed: no deals — run: npm run db:seed");
  }
}

export async function ensureForeignTraderDeal(
  primaryTraderEmail: string
): Promise<void> {
  const primary = await db().traderAccount.findUnique({
    where: { email: primaryTraderEmail },
    select: { id: true },
  });
  const hash = await bcrypt.hash("E2EForeign!2026", 12);
  const foreign = await db().traderAccount.upsert({
    where: { email: FOREIGN_TRADER_EMAIL },
    create: {
      email: FOREIGN_TRADER_EMAIL,
      passwordHash: hash,
      displayName: "E2E Foreign Trader",
      companyName: "E2E Foreign Co",
      status: "active",
      adminNotes: "[E2E] IDOR fixture",
    },
    update: {
      displayName: "E2E Foreign Trader",
      status: "active",
    },
  });

  if (primary && foreign.id === primary.id) {
    throw new Error("E2E foreign trader email collision with primary trader");
  }

  const product = await db().product.findFirst({
    where: { status: "published" },
    orderBy: { createdAt: "asc" },
  });
  if (!product) {
    throw new Error("E2E seed: no product for foreign deal");
  }

  await db().dealProposal.upsert({
    where: { reference: "DL-E2E-FOREIGN" },
    create: {
      reference: "DL-E2E-FOREIGN",
      traderId: foreign.id,
      dealKind: "catalog",
      status: "proposed",
      title: "E2E foreign trader deal",
      productId: product.id,
      proposedPrice: product.retailPrice,
      currency: product.currency,
      quantity: 1,
    },
    update: {
      traderId: foreign.id,
      status: "proposed",
      productId: product.id,
    },
  });
}

export async function ensureCustomerForAdminList(): Promise<void> {
  const existing = await db().customer.findFirst({
    where: { phone: E2E_CUSTOMER_PHONE },
  });
  if (existing) return;
  await db().customer.create({
    data: {
      name: "E2E Customer",
      phone: E2E_CUSTOMER_PHONE,
      notes: "[E2E] admin customers list",
    },
  });
}

export async function ensureCategoryWithProducts(): Promise<void> {
  const row = await db().category.findFirst({
    where: { products: { some: { status: "published" } } },
    select: { id: true },
  });
  if (!row) {
    throw new Error(
      "E2E seed: no category with published products — run: npm run db:seed"
    );
  }
}

/** Idempotent extras on top of prisma/seed.ts + seed-demo.ts */
export async function ensureE2EFixtures(): Promise<void> {
  await assertRetailIdempotencyColumn();
  await ensurePublishedCatalogProduct();
  await ensureCelloStudioFixture();
  await ensureAdminDealListed();
  await ensureCategoryWithProducts();
  await ensureCustomerForAdminList();
  const primaryTrader =
    process.env.TRADER_EMAIL?.trim() || "trader@rareoud.local";
  await ensureForeignTraderDeal(primaryTrader);
}
