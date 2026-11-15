/**
 * Wholesale phased fulfilment checks (domain layer): every step only when its prerequisites are met.
 * Run: npm run test:wholesale-phases
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import {
  adminConfirmWholesalePayment,
  adminIssueWholesaleInvoice,
  adminProvideWholesaleQuote,
  adminTransitionWholesaleStatus,
  adminUpdateWholesaleShipping,
  createWholesaleRequest,
  getWholesaleInvoiceByToken,
  traderClaimWholesalePayment,
  traderConfirmWholesale,
  traderRespondToWholesaleQuote,
} from "../lib/wholesale/service";
import { wholesalePhase } from "../lib/wholesale/constants";

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
  const hash = await bcrypt.hash("PhasesCheck1!", 10);
  const trader = await prisma.traderAccount.upsert({
    where: { email: "phases-check@rareoud.local" },
    update: { status: "active" },
    create: { email: "phases-check@rareoud.local", passwordHash: hash, displayName: "Phases Check", status: "active" },
  });
  const admin = await prisma.adminUser.findFirst();
  if (!admin) throw new Error("no admin row");
  const product = await prisma.product.findFirst({ where: { status: "published", wholesaleEligible: true } });
  if (!product) throw new Error("no published product");
  let reqId = "";
  try {
    const created = await createWholesaleRequest({
      traderId: trader.id,
      requestMode: "request_quote",
      lines: [{ productId: product.id, quantity: 2 }],
    });
    reqId = created.id;
    const load = () => prisma.wholesaleRequest.findUniqueOrThrow({ where: { id: reqId } });
    check(wholesalePhase(await load()) === "new", "new request is in phase new");

    await adminTransitionWholesaleStatus({ requestId: reqId, toStatus: "under_review", actorAdminId: admin.id });
    const line = (await load()) && (await prisma.wholesaleRequestLine.findFirstOrThrow({ where: { requestId: reqId } }));
    await adminProvideWholesaleQuote({
      requestId: reqId,
      actorAdminId: admin.id,
      quoteCurrency: "USD",
      lineQuotes: [{ lineId: line.id, quotedUnitPrice: 50 }],
    });
    check(wholesalePhase(await load()) === "quoted", "quote provided → phase quoted");
    check(
      await rejects(
        () => adminTransitionWholesaleStatus({ requestId: reqId, toStatus: "confirmed", actorAdminId: admin.id }),
        "TRADER_MUST_ACCEPT"
      ),
      "admin cannot confirm a quotation on the trader's behalf"
    );

    await traderRespondToWholesaleQuote({ requestId: reqId, traderId: trader.id, accept: true });
    check(wholesalePhase(await load()) === "awaiting_trader", "accepted quote → awaiting the trader's final confirmation");
    check(
      await rejects(() => adminIssueWholesaleInvoice({ requestId: reqId, actorAdminId: admin.id }), "NOT_READY"),
      "no invoice before the trader confirms"
    );
    check(
      await rejects(
        () => adminUpdateWholesaleShipping({ requestId: reqId, actorAdminId: admin.id, carrier: "DHL", trackingReference: "" }),
        "NOT_READY"
      ),
      "no shipping before the trader confirms"
    );
    check(
      await rejects(
        () => adminTransitionWholesaleStatus({ requestId: reqId, toStatus: "completed", actorAdminId: admin.id }),
        "NOT_READY"
      ),
      "cannot complete before the trader confirms"
    );

    await traderConfirmWholesale({ requestId: reqId, traderId: trader.id, via: "platform" });
    await traderConfirmWholesale({ requestId: reqId, traderId: trader.id, via: "platform" });
    const afterConfirm = await load();
    check(wholesalePhase(afterConfirm) === "payment" && afterConfirm.traderConfirmedVia === "platform", "trader confirmation → payment phase");
    check(
      (await prisma.wholesaleRequestEvent.count({ where: { requestId: reqId, eventType: "trader_confirmed" } })) === 1,
      "trader confirmation is idempotent"
    );
    check(
      await rejects(() => adminConfirmWholesalePayment({ requestId: reqId, actorAdminId: admin.id }), "INVOICE_REQUIRED"),
      "payment cannot be confirmed before the invoice is sent"
    );

    const inv = await adminIssueWholesaleInvoice({ requestId: reqId, actorAdminId: admin.id });
    check(!!inv.invoiceToken, "invoice issued with an unguessable token");
    const inv2 = await adminIssueWholesaleInvoice({ requestId: reqId, actorAdminId: admin.id });
    check(inv2.invoiceToken === inv.invoiceToken, "re-sending the invoice keeps the same link");
    const view = await getWholesaleInvoiceByToken(inv.invoiceToken!);
    check(!!view && view.id === reqId, "invoice resolves by token");
    check((await getWholesaleInvoiceByToken("short")) === null, "malformed invoice token is rejected");

    await traderClaimWholesalePayment({ requestId: reqId, traderId: trader.id });
    await traderClaimWholesalePayment({ requestId: reqId, traderId: trader.id });
    check(
      (await prisma.wholesaleRequestEvent.count({ where: { requestId: reqId, eventType: "trader_paid_claim" } })) === 1,
      "paid-claim is idempotent"
    );
    check(
      await rejects(
        () => adminUpdateWholesaleShipping({ requestId: reqId, actorAdminId: admin.id, carrier: "DHL", trackingReference: "" }),
        "NOT_READY"
      ),
      "no shipping before payment is confirmed"
    );

    await adminConfirmWholesalePayment({ requestId: reqId, actorAdminId: admin.id });
    check(wholesalePhase(await load()) === "shipping", "payment confirmed → shipping phase");
    check(
      await rejects(
        () => adminTransitionWholesaleStatus({ requestId: reqId, toStatus: "completed", actorAdminId: admin.id }),
        "NOT_READY"
      ),
      "cannot complete before shipping"
    );
    check(
      await rejects(
        () => adminUpdateWholesaleShipping({ requestId: reqId, actorAdminId: admin.id, carrier: "  ", trackingReference: "" }),
        "SHIPPING_FIELDS_REQUIRED"
      ),
      "carrier is required"
    );
    await adminUpdateWholesaleShipping({ requestId: reqId, actorAdminId: admin.id, carrier: "DHL", trackingReference: "" });
    const shipped = await load();
    check(wholesalePhase(shipped) === "ready_to_complete" && shipped.trackingReference === null, "shipping without tracking number is accepted");

    await adminTransitionWholesaleStatus({ requestId: reqId, toStatus: "completed", actorAdminId: admin.id });
    check((await load()).status === "completed", "completion allowed once everything is done");
  } finally {
    if (reqId) await prisma.wholesaleRequest.delete({ where: { id: reqId } }).catch(() => undefined);
    console.log("cleanup: removed wholesale-phases fixtures");
  }
  console.log(`\nWholesale phases checks: ${passed} passed, ${failed} failed`);
  await prisma.$disconnect();
  process.exit(failed ? 1 : 0);
}
main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
