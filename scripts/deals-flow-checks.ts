/**
 * Deals flow checks (domain layer): reference format/collision-safety, ownership,
 * accept → awaiting_payment → payment_confirmed, trader notified in the platform inbox.
 * Run: npm run test:deals-flow
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import {
  addNegotiationEntry,
  adminCompleteDeal,
  adminIssueDealInvoice,
  adminUpdateDealShipping,
  confirmDealPayment,
  createDealProposal,
  getDealInvoiceByToken,
  traderClaimDealPayment,
} from "../lib/deals/service";
import { dealPhase } from "../lib/deals/constants";

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
  const hash = await bcrypt.hash("DealsCheck1!", 10);
  const trader = await prisma.traderAccount.upsert({
    where: { email: "deals-check-a@rareoud.local" },
    update: { status: "active" },
    create: { email: "deals-check-a@rareoud.local", passwordHash: hash, displayName: "Deals Check A", status: "active" },
  });
  const other = await prisma.traderAccount.upsert({
    where: { email: "deals-check-b@rareoud.local" },
    update: { status: "active" },
    create: { email: "deals-check-b@rareoud.local", passwordHash: hash, displayName: "Deals Check B", status: "active" },
  });
  const admin = await prisma.adminUser.findFirst();
  if (!admin) throw new Error("no admin row");
  const ids: string[] = [];
  try {
    const refs = new Set<string>();
    for (let i = 0; i < 30; i += 1) {
      const d = await createDealProposal({
        traderId: trader.id,
        dealKind: "non_catalog",
        title: `Check deal ${i}`,
        modelNumber: `CHK-${i}`,
        proposedPrice: 100 + i,
        currency: "USD",
        quantity: 1,
      });
      ids.push(d.id);
      refs.add(d.reference);
    }
    check(refs.size === 30, "30 deals got 30 distinct references");
    check([...refs].every((r) => /^DP-\d{4}-[A-HJKMNP-Z2-9]{6}$/.test(r)), "reference format DP-YYYY-XXXXXX");

    const id = ids[0]!;
    let forbidden = false;
    try {
      await addNegotiationEntry({ dealId: id, action: "continue", actorRole: "trader", actorTraderId: other.id, message: "x" });
    } catch (e) {
      forbidden = (e as Error).message === "FORBIDDEN";
    }
    check(forbidden, "another trader cannot negotiate on this deal");

    // Price negotiation: counter can change the price; you cannot accept your own offer.
    const n = ids[2]!;
    check(
      await rejects(() => addNegotiationEntry({ dealId: n, action: "accept", actorRole: "trader", actorTraderId: trader.id }), "OWN_OFFER_CANNOT_ACCEPT"),
      "trader cannot accept their own opening offer"
    );
    check(
      await rejects(() => addNegotiationEntry({ dealId: n, action: "counter", actorRole: "admin", actorAdminId: admin.id }), "COUNTER_EMPTY"),
      "an empty counter-offer is refused"
    );
    await addNegotiationEntry({ dealId: n, action: "counter", actorRole: "admin", actorAdminId: admin.id, proposedPrice: 90, currency: "USD" });
    const countered = await prisma.dealProposal.findUniqueOrThrow({ where: { id: n } });
    check(Number(countered.proposedPrice) === 90 && countered.status === "negotiating", "admin counter changes the price and keeps negotiating");
    check(
      await rejects(() => addNegotiationEntry({ dealId: n, action: "accept", actorRole: "admin", actorAdminId: admin.id }), "OWN_OFFER_CANNOT_ACCEPT"),
      "admin cannot accept their own counter-offer"
    );
    await addNegotiationEntry({ dealId: n, action: "accept", actorRole: "trader", actorTraderId: trader.id });
    check((await prisma.dealProposal.findUniqueOrThrow({ where: { id: n } })).status === "awaiting_payment", "trader accepts the admin counter → awaiting payment");

    const before = await prisma.whatsAppMessage.count({ where: { channel: "platform", adminId: admin.id } });
    const acc = await addNegotiationEntry({ dealId: id, action: "accept", actorRole: "admin", actorAdminId: admin.id, message: "ok" });
    check(acc.deal.status === "awaiting_payment", "admin accept → awaiting_payment");
    const afterAccept = await prisma.whatsAppMessage.count({ where: { channel: "platform", adminId: admin.id } });
    check(afterAccept === before + 1, "trader got a platform-inbox message on accept");

    let early = false;
    try {
      await confirmDealPayment({ dealId: ids[1]!, adminId: admin.id });
    } catch (e) {
      early = (e as Error).message === "INVALID_STATUS";
    }
    check(early, "payment cannot be confirmed before accept");

    let noInvoice = false;
    try {
      await confirmDealPayment({ dealId: id, adminId: admin.id });
    } catch (e) {
      noInvoice = (e as Error).message === "INVOICE_REQUIRED";
    }
    check(noInvoice, "payment cannot be confirmed before the invoice is sent");
    const inv = await adminIssueDealInvoice({ dealId: id });
    check(!!inv.invoiceToken && !!(await getDealInvoiceByToken(inv.invoiceToken!)), "invoice issued and resolvable by token");
    await traderClaimDealPayment({ dealId: id, traderId: trader.id, via: "platform" });
    await traderClaimDealPayment({ dealId: id, traderId: trader.id, via: "whatsapp" });
    const claimed = await prisma.dealProposal.findUniqueOrThrow({ where: { id } });
    check(claimed.paymentClaimedVia === "platform", "trader payment notice is recorded once (platform)");
    await confirmDealPayment({ dealId: id, adminId: admin.id });
    const row = await prisma.dealProposal.findUnique({ where: { id }, select: { status: true, paymentConfirmedAt: true } });
    check(row?.status === "payment_confirmed" && !!row.paymentConfirmedAt, "payment confirmed → payment_confirmed");
    const afterPayRow = await prisma.dealProposal.findUniqueOrThrow({ where: { id } });
    check(dealPhase(afterPayRow) === "shipping", "after payment the deal is in the shipping phase");
    check(
      await rejects(() => adminCompleteDeal({ dealId: id }), "NOT_READY"),
      "cannot complete before shipping"
    );
    await adminUpdateDealShipping({ dealId: id, carrier: "DHL", trackingReference: "" });
    check(dealPhase(await prisma.dealProposal.findUniqueOrThrow({ where: { id } })) === "ready_to_complete", "shipping without tracking number accepted");
    await adminCompleteDeal({ dealId: id });
    check(dealPhase(await prisma.dealProposal.findUniqueOrThrow({ where: { id } })) === "completed", "deal completes after shipping");
    const afterPay = await prisma.whatsAppMessage.count({ where: { channel: "platform", adminId: admin.id } });
    check(afterPay === afterAccept + 1, "trader got a platform-inbox message on payment");
  } finally {
    await prisma.dealProposal.deleteMany({ where: { id: { in: ids } } });
    const convs = await prisma.whatsAppConversation.findMany({ where: { traderId: { in: [trader.id, other.id] } }, select: { id: true } });
    void convs;
    console.log("cleanup: removed deals-flow fixtures");
  }
  console.log(`\nDeals flow checks: ${passed} passed, ${failed} failed`);
  await prisma.$disconnect();
  process.exit(failed ? 1 : 0);
}
main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
