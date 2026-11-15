/**
 * Stock checks (domain layer): reservation is atomic, never oversells, sold-out flips availability,
 * releasing restores it, untracked products are unlimited, wholesale honours the same limit.
 * Run: npm run test:stock
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { InsufficientStockError, releaseStock, reserveStock, stockShortMessage } from "../lib/inventory/stock";
import { adminTransitionWholesaleStatus, createWholesaleRequest } from "../lib/wholesale/service";

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

async function main() {
  const cat = await prisma.category.findFirst();
  if (!cat) throw new Error("no category");
  const slug = `stock-check-${Date.now()}`;
  const product = await prisma.product.create({
    data: {
      slug,
      nameAr: "منتج اختبار المخزون",
      nameEn: "Stock check product",
      categoryId: cat.id,
      status: "published",
      availability: "available",
      wholesaleEligible: true,
      retailPrice: 10,
      currency: "USD",
      stockQuantity: 8,
      lowStockThreshold: 3,
    },
  });
  const untracked = await prisma.product.create({
    data: { slug: `${slug}-u`, nameAr: "غير متتبع", nameEn: "Untracked", categoryId: cat.id, status: "published", retailPrice: 5, currency: "USD" },
  });
  const hash = await bcrypt.hash("StockCheck1!", 10);
  const trader = await prisma.traderAccount.upsert({
    where: { email: "stock-check@rareoud.local" },
    update: { status: "active" },
    create: { email: "stock-check@rareoud.local", passwordHash: hash, displayName: "Stock Check", status: "active" },
  });
  const admin = await prisma.adminUser.findFirst();
  const stock = async () => (await prisma.product.findUniqueOrThrow({ where: { id: product.id } })).stockQuantity;
  const wholesaleIds: string[] = [];
  try {
    let err: unknown = null;
    try {
      await reserveStock([{ productId: product.id, quantity: 9 }]);
    } catch (e) {
      err = e;
    }
    check(err instanceof InsufficientStockError && (err as InsufficientStockError).available === 8, "9 requested with 8 in stock → refused, reports 8 available");
    check((await stock()) === 8, "a refused reservation takes nothing");
    check(stockShortMessage("X", 8, true).includes("8") && stockShortMessage("X", 0, true).includes("نفدت"), "copy mentions the available number / sold out");

    const r1 = await reserveStock([{ productId: product.id, quantity: 5 }]);
    check((await stock()) === 3, "reserving 5 leaves 3");
    const [a, b] = await Promise.allSettled([
      reserveStock([{ productId: product.id, quantity: 3 }]),
      reserveStock([{ productId: product.id, quantity: 3 }]),
    ]);
    const okCount = [a, b].filter((x) => x.status === "fulfilled").length;
    check(okCount === 1 && (await stock()) === 0, "two buyers racing for the last 3 pieces: exactly one wins");
    const p0 = await prisma.product.findUniqueOrThrow({ where: { id: product.id } });
    check(p0.availability === "unavailable", "sold out → availability becomes unavailable");

    await releaseStock(r1);
    const p1 = await prisma.product.findUniqueOrThrow({ where: { id: product.id } });
    check(p1.stockQuantity === 5 && p1.availability === "available", "release restores stock and reopens availability");

    check((await reserveStock([{ productId: untracked.id, quantity: 999 }])).length === 0, "untracked product is unlimited");

    // wholesale honours the same limit and releases on cancel
    let wErr: unknown = null;
    try {
      await createWholesaleRequest({ traderId: trader.id, requestMode: "request_quote", lines: [{ productId: product.id, quantity: 6 }] });
    } catch (e) {
      wErr = e;
    }
    check(wErr instanceof InsufficientStockError, "wholesale cannot order more than available");
    const w = await createWholesaleRequest({ traderId: trader.id, requestMode: "request_quote", lines: [{ productId: product.id, quantity: 4 }] });
    wholesaleIds.push(w.id);
    check((await stock()) === 1, "wholesale request reserves its quantity");
    await adminTransitionWholesaleStatus({ requestId: w.id, toStatus: "cancelled", actorAdminId: admin!.id });
    check((await stock()) === 5, "cancelling the wholesale request gives the pieces back");
  } finally {
    await prisma.wholesaleRequest.deleteMany({ where: { id: { in: wholesaleIds } } });
    await prisma.product.deleteMany({ where: { id: { in: [product.id, untracked.id] } } });
    console.log("cleanup: removed stock fixtures");
  }
  console.log(`\nStock checks: ${passed} passed, ${failed} failed`);
  await prisma.$disconnect();
  process.exit(failed ? 1 : 0);
}
main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
