/**
 * Phase 3 wholesale authorization / IDOR checks (domain-layer).
 * Run: npx tsx scripts/wholesale-security-checks.ts
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import {
  createWholesaleRequest,
  getWholesaleRequestForTrader,
  traderRespondToWholesaleQuote,
  adminProvideWholesaleQuote,
} from "../lib/wholesale/service";

const prisma = new PrismaClient();

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(`FAIL: ${msg}`);
  console.log(`PASS: ${msg}`);
}

const cleanupState = {
  requestIds: [] as string[],
  traderIds: [] as string[],
  blockedProductId: null as string | null,
};

async function cleanup() {
  // WholesaleRequest.trader is onDelete: Restrict, so requests (and their
  // cascaded lines/events) must go before the trader rows.
  if (cleanupState.requestIds.length > 0) {
    await prisma.wholesaleRequest.deleteMany({
      where: { id: { in: cleanupState.requestIds } },
    });
  }
  if (cleanupState.traderIds.length > 0) {
    await prisma.traderAccount.deleteMany({
      where: { id: { in: cleanupState.traderIds } },
    });
  }
  if (cleanupState.blockedProductId) {
    await prisma.product.deleteMany({
      where: { id: cleanupState.blockedProductId },
    });
  }
  console.log("cleanup: removed wholesale-security-checks fixtures");
}

async function main() {
  const hash = await bcrypt.hash("SecurityCheck1!", 12);

  const traderA = await prisma.traderAccount.upsert({
    where: { email: "sec-trader-a@rareoud.local" },
    update: { status: "active", passwordHash: hash },
    create: {
      email: "sec-trader-a@rareoud.local",
      passwordHash: hash,
      displayName: "Sec Trader A",
      status: "active",
    },
  });
  const traderB = await prisma.traderAccount.upsert({
    where: { email: "sec-trader-b@rareoud.local" },
    update: { status: "active", passwordHash: hash },
    create: {
      email: "sec-trader-b@rareoud.local",
      passwordHash: hash,
      displayName: "Sec Trader B",
      status: "active",
    },
  });

  const eligible = await prisma.product.findFirst({
    where: { status: "published", wholesaleEligible: true },
  });
  assert(!!eligible, "eligible wholesale product exists for checks");
  cleanupState.traderIds = [traderA.id, traderB.id];

  const ineligible = await prisma.product.findFirst({
    where: {
      OR: [{ status: { not: "published" } }, { wholesaleEligible: false }],
    },
  });

  // Create draft/unpublished product if needed
  let blocked = ineligible;
  if (!blocked) {
    const cat = await prisma.category.findFirst();
    blocked = await prisma.product.create({
      data: {
        slug: `sec-blocked-${Date.now()}`,
        nameEn: "Blocked",
        nameAr: "",
        categoryId: cat!.id,
        retailPrice: 1,
        currency: "TEST",
        status: "draft",
        wholesaleEligible: false,
      },
    });
    cleanupState.blockedProductId = blocked.id;
  }

  const reqA = await createWholesaleRequest({
    traderId: traderA.id,
    requestMode: "request_quote",
    lines: [{ productId: eligible!.id, quantity: 2 }],
  });
  cleanupState.requestIds.push(reqA.id);
  assert(reqA.traderId === traderA.id, "request owned by trader A (session id)");

  // 1+2 IDOR: B cannot read/modify A's request
  let idorReadBlocked = false;
  try {
    await getWholesaleRequestForTrader(reqA.id, traderB.id);
  } catch {
    idorReadBlocked = true;
  }
  assert(idorReadBlocked, "Trader B cannot read Trader A wholesale request");

  let idorWriteBlocked = false;
  try {
    await traderRespondToWholesaleQuote({
      requestId: reqA.id,
      traderId: traderB.id,
      accept: true,
    });
  } catch {
    idorWriteBlocked = true;
  }
  assert(idorWriteBlocked, "Trader B cannot modify Trader A wholesale request");

  // 6+7: ineligible product rejected at submission
  let ineligibleBlocked = false;
  try {
    await createWholesaleRequest({
      traderId: traderA.id,
      requestMode: "request_quote",
      lines: [{ productId: blocked!.id, quantity: 1 }],
    });
  } catch (e) {
    ineligibleBlocked =
      e instanceof Error && e.message === "PRODUCT_NOT_WHOLESALE_ELIGIBLE";
  }
  assert(
    ineligibleBlocked,
    "Draft/non-wholesaleEligible products rejected server-side"
  );

  // 8: quantity validation
  let badQtyBlocked = false;
  try {
    await createWholesaleRequest({
      traderId: traderA.id,
      requestMode: "request_quote",
      lines: [{ productId: eligible!.id, quantity: 0 }],
    });
  } catch (e) {
    badQtyBlocked = e instanceof Error && e.message === "INVALID_QUANTITY";
  }
  assert(badQtyBlocked, "Zero quantity rejected server-side");

  let overMaxBlocked = false;
  try {
    await createWholesaleRequest({
      traderId: traderA.id,
      requestMode: "request_quote",
      lines: [{ productId: eligible!.id, quantity: 10001 }],
    });
  } catch (e) {
    overMaxBlocked = e instanceof Error && e.message === "INVALID_QUANTITY";
  }
  assert(
    overMaxBlocked,
    "Quantity above technical max rejected (not MOQ — abuse limit)"
  );

  // 9: quote path works for admin (domain function requires admin id — auth is action-layer)
  await prisma.wholesaleRequest.update({
    where: { id: reqA.id },
    data: { status: "under_review" },
  });
  const quoted = await adminProvideWholesaleQuote({
    requestId: reqA.id,
    actorAdminId: "admin-security-check",
    quoteCurrency: "TEST",
    quoteMessage: "Security check quote",
    lineQuotes: [
      { lineId: reqA.lines[0].id, quotedUnitPrice: 50 },
    ],
  });
  assert(quoted.status === "quote_provided", "Admin quotation sets quote_provided");

  // Trader A can accept own quote
  const accepted = await traderRespondToWholesaleQuote({
    requestId: reqA.id,
    traderId: traderA.id,
    accept: true,
  });
  assert(accepted.status === "confirmed", "Trader A can accept own quotation");

  console.log("\nAll wholesale security domain checks passed.");
  console.log(
    "Note: unauthenticated / session checks are enforced by requireTraderSession + middleware (covered by build + action guards)."
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .then(() => cleanup())
  .catch((e) => {
    console.error("cleanup failed", e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
    if (process.exitCode) process.exit(process.exitCode);
  });
