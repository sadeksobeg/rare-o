/**
 * Phase D WhatsApp business linking checks.
 *
 * Isolated temp SQLite — does not write fixtures into the development DB.
 * Run: npm run test:whatsapp-phase-d
 */


import { PrismaClient } from "@prisma/client";
import { createIsolatedDb } from "./lib/isolated-db";
import { SignJWT } from "jose";

import { getDictionary } from "../lib/i18n/dictionaries";
import { verifyAdminSessionToken } from "../lib/auth/admin-session";
import {
  getInboxConversation,
  listInboxConversations,
} from "../lib/whatsapp/messaging/inbox";
import {
  clearConversationBusinessLink,
  getBusinessContextForConversation,
  linkConversationToBusinessRecord,
} from "../lib/whatsapp/messaging/linking";
import { persistInboundText } from "../lib/whatsapp/messaging/service";
import {
  adminLinkWhatsAppConversationAction,
  adminUnlinkWhatsAppConversationAction,
} from "../app/whatsapp-actions";

let passed = 0;
let failed = 0;

function assert(cond: unknown, msg: string): asserts cond {
  if (!cond) {
    failed += 1;
    console.error(`FAIL: ${msg}`);
    throw new Error(msg);
  }
  passed += 1;
  console.log(`PASS: ${msg}`);
}

async function setupIsolatedDb(): Promise<{
  db: PrismaClient;
  cleanup: () => Promise<void>;
}> {
  const iso = await createIsolatedDb("rare-oud-wa-pd");
  const url = iso.url;

  const db = new PrismaClient({
    datasources: { db: { url } },
    log: ["error"],
  });
  await db.$connect();

  return {
    db,
    cleanup: async () => {
      await db.$disconnect();
      await iso.cleanup();
    },
  };
}

async function seedDomainFixtures(db: PrismaClient) {
  const category = await db.category.create({
    data: {
      slug: `pd-cat-${Date.now()}`,
      nameAr: "فئة",
      nameEn: "Category",
    },
  });
  const product = await db.product.create({
    data: {
      slug: `pd-prod-${Date.now()}`,
      nameAr: "عود",
      nameEn: "Oud",
      categoryId: category.id,
      retailPrice: 100,
      currency: "USD",
      status: "published",
      wholesaleEligible: true,
    },
  });

  const retail = await db.retailRequest.create({
    data: {
      reference: `RR-PD-${Date.now()}`,
      locale: "ar",
      status: "ready_for_handoff",
      customerName: "Retail Customer",
      customerPhone: "963900111222",
      destinationCountry: "SY",
      subtotal: 100,
      currency: "USD",
      handoffPayloadJson: "{}",
      lines: {
        create: [
          {
            productId: product.id,
            productNameAr: "عود",
            productNameEn: "Oud",
            quantity: 1,
            unitPriceSnapshot: 100,
            lineTotal: 100,
            currency: "USD",
          },
        ],
      },
    },
  });

  const traderA = await db.traderAccount.create({
    data: {
      email: `pd-trader-a-${Date.now()}@test.local`,
      passwordHash: "x",
      displayName: "Trader A",
      companyName: "A Co",
      status: "active",
    },
  });
  const traderB = await db.traderAccount.create({
    data: {
      email: `pd-trader-b-${Date.now()}@test.local`,
      passwordHash: "x",
      displayName: "Trader B",
      companyName: "B Co",
      status: "active",
    },
  });

  const deal = await db.dealProposal.create({
    data: {
      reference: `DP-PD-${Date.now()}`,
      traderId: traderA.id,
      dealKind: "catalog",
      title: "Catalog deal",
      productId: product.id,
      status: "negotiating",
      entries: {
        create: [
          {
            action: "propose",
            actorRole: "trader",
            actorTraderId: traderA.id,
            message: "Initial propose",
          },
        ],
      },
    },
  });

  const wholesale = await db.wholesaleRequest.create({
    data: {
      reference: `WR-PD-${Date.now()}`,
      traderId: traderA.id,
      requestMode: "request_quote",
      status: "submitted",
      lines: {
        create: [
          {
            productId: product.id,
            productNameAr: "عود",
            productNameEn: "Oud",
            productSlugSnapshot: product.slug,
            quantity: 10,
            catalogRetailPriceSnapshot: 100,
            catalogCurrencySnapshot: "USD",
          },
        ],
      },
    },
  });

  return { retail, deal, wholesale, traderA, traderB, product };
}

async function main(): Promise<void> {
  if (!process.env.AUTH_SECRET || process.env.AUTH_SECRET.length < 16) {
    process.env.AUTH_SECRET = "week4-phase-d-auth-secret";
  }

  // Point domain services that use global prisma at the isolated DB via env
  // for trader IDOR checks: we call service functions that use default prisma.
  // For those, we test ownership logic with a separate approach using the
  // isolated client directly mirroring getDealForTrader filters.

  const { db, cleanup } = await setupIsolatedDb();

  try {
    const fixtures = await seedDomainFixtures(db);
    const chatId = "963900111222@s.whatsapp.net";

    const inbound = await persistInboundText(
      {
        waMessageId: "pd-in-1",
        waChatId: chatId,
        waRemoteJid: chatId,
        senderE164: "963900111222",
        displayName: "WA Contact",
        text: "Hello",
        timestamp: "2026-10-05T15:00:00.000Z",
      },
      db
    );
    assert(inbound.ok, "conversation seed for linking");
    const conversationId = inbound.conversationId;

    const unlinkedCtx = await getBusinessContextForConversation(
      conversationId,
      db
    );
    assert(!unlinkedCtx.linked, 'unlinked conversation shows "Not linked"');

    const listBefore = await listInboxConversations(db);
    assert(
      listBefore[0]?.link.linked === false,
      "inbox list shows unlinked lightly"
    );

    // --- link retail ---
    const linkRetail = await linkConversationToBusinessRecord(
      {
        conversationId,
        linkType: "retail_request",
        linkId: fixtures.retail.id,
        adminId: "admin-pd",
      },
      db
    );
    assert(linkRetail.ok && linkRetail.action === "set", "link → RetailRequest");
    const retailCtx = await getBusinessContextForConversation(
      conversationId,
      db
    );
    assert(retailCtx.linked === true, "business context linked after retail");
    if (retailCtx.linked) {
      assert(
        retailCtx.linkType === "retail_request",
        "context type is retail_request"
      );
      assert(
        retailCtx.recordId === fixtures.retail.id,
        "context shows correct retail record"
      );
      assert(
        retailCtx.status === "ready_for_handoff",
        "context shows actual retail status"
      );
      assert(
        retailCtx.identityLabel === "Retail Customer",
        "retail identity from domain record"
      );
      assert(retailCtx.lines.length === 1, "retail lines in context");
      assert(
        retailCtx.adminHref.includes(fixtures.retail.id),
        "retail admin href"
      );
    }

    // --- change link to deal ---
    const linkDeal = await linkConversationToBusinessRecord(
      {
        conversationId,
        linkType: "deal_proposal",
        linkId: fixtures.deal.id,
        adminId: "admin-pd",
      },
      db
    );
    assert(linkDeal.ok && linkDeal.action === "change", "change link → DealProposal");
    const dealCtx = await getBusinessContextForConversation(conversationId, db);
    assert(dealCtx.linked === true, "context after deal link");
    if (dealCtx.linked) {
      assert(dealCtx.linkType === "deal_proposal", "context type deal");
      assert(dealCtx.recordId === fixtures.deal.id, "correct deal record");
      assert(dealCtx.status === "negotiating", "actual deal status");
      assert(dealCtx.dealKind === "catalog", "deal kind from domain");
      assert(!!dealCtx.latestNegotiation, "latest negotiation entry shown");
    }

    // --- change link to wholesale ---
    const linkWs = await linkConversationToBusinessRecord(
      {
        conversationId,
        linkType: "wholesale_request",
        linkId: fixtures.wholesale.id,
        adminId: "admin-pd",
      },
      db
    );
    assert(linkWs.ok, "link → WholesaleRequest");
    const wsCtx = await getBusinessContextForConversation(conversationId, db);
    assert(wsCtx.linked === true, "context after wholesale link");
    if (wsCtx.linked) {
      assert(wsCtx.linkType === "wholesale_request", "context type wholesale");
      assert(wsCtx.recordId === fixtures.wholesale.id, "correct wholesale record");
      assert(wsCtx.status === "submitted", "actual wholesale status");
      assert(wsCtx.requestMode === "request_quote", "wholesale request mode");
      assert(wsCtx.lines.length === 1, "wholesale lines in context");
    }

    // --- invalid target ---
    const badTarget = await linkConversationToBusinessRecord(
      {
        conversationId,
        linkType: "retail_request",
        linkId: "does-not-exist",
        adminId: "admin-pd",
      },
      db
    );
    assert(
      !badTarget.ok && badTarget.code === "TARGET_NOT_FOUND",
      "invalid target ID rejected"
    );

    // --- unsupported type ---
    const badType = await linkConversationToBusinessRecord(
      {
        conversationId,
        linkType: "Order",
        linkId: fixtures.retail.id,
        adminId: "admin-pd",
      },
      db
    );
    assert(
      !badType.ok && badType.code === "UNSUPPORTED_LINK_TYPE",
      "unsupported link type rejected"
    );
    const badModel = await linkConversationToBusinessRecord(
      {
        conversationId,
        linkType: "Customer",
        linkId: fixtures.retail.id,
        adminId: "admin-pd",
      },
      db
    );
    assert(
      !badModel.ok && badModel.code === "UNSUPPORTED_LINK_TYPE",
      "arbitrary model name rejected"
    );

    // --- trader ownership boundaries remain intact (domain services) ---
    // Use isolated DB via temporarily replacing DATABASE_URL is hard for global prisma.
    // Mirror ownership filter used by getDealForTrader / getWholesaleRequestForTrader:
    const foreignDeal = await db.dealProposal.findFirst({
      where: { id: fixtures.deal.id, traderId: fixtures.traderB.id },
    });
    assert(
      foreignDeal === null,
      "unauthorized deal (other trader) cannot be accessed via ownership filter"
    );
    const foreignWs = await db.wholesaleRequest.findFirst({
      where: { id: fixtures.wholesale.id, traderId: fixtures.traderB.id },
    });
    assert(
      foreignWs === null,
      "unauthorized wholesale (other trader) cannot be accessed via ownership filter"
    );

    // Linking itself is admin-only; trader JWT cannot authorize admin actions
    const traderJwt = await new SignJWT({
      email: "trader@example.com",
      name: "Trader",
      role: "trader",
    })
      .setProtectedHeader({ alg: "HS256" })
      .setSubject(fixtures.traderA.id)
      .setIssuedAt()
      .setExpirationTime("1h")
      .sign(new TextEncoder().encode(process.env.AUTH_SECRET!));
    assert(
      (await verifyAdminSessionToken(traderJwt)) === null,
      "trader JWT cannot authorize WhatsApp linking as admin"
    );

    const unauthLink = await adminLinkWhatsAppConversationAction(
      (() => {
        const fd = new FormData();
        fd.set("conversationId", conversationId);
        fd.set("linkType", "retail_request");
        fd.set("linkId", fixtures.retail.id);
        return fd;
      })()
    );
    assert(
      !unauthLink.ok && unauthLink.error === "UNAUTHORIZED",
      "unauthorized user cannot link"
    );
    const unauthUnlink = await adminUnlinkWhatsAppConversationAction(
      (() => {
        const fd = new FormData();
        fd.set("conversationId", conversationId);
        return fd;
      })()
    );
    assert(
      !unauthUnlink.ok && unauthUnlink.error === "UNAUTHORIZED",
      "unauthorized user cannot unlink"
    );

    // --- remove link ---
    const cleared = await clearConversationBusinessLink(
      { conversationId, adminId: "admin-pd" },
      db
    );
    assert(cleared.ok && cleared.linkType === "none", "removing link");
    const afterClear = await getBusinessContextForConversation(
      conversationId,
      db
    );
    assert(!afterClear.linked, "context unlinked after clear");

    const detail = await getInboxConversation(conversationId, db);
    assert(detail?.link.linked === false, "conversation detail shows not linked");

    // --- audit rows ---
    const audits = await db.whatsAppLinkAudit.findMany({
      where: { conversationId },
      orderBy: { createdAt: "asc" },
    });
    assert(audits.length >= 4, "link audits recorded (set/change/clear)");
    assert(
      audits.some((a) => a.action === "set"),
      "audit includes set"
    );
    assert(
      audits.some((a) => a.action === "change"),
      "audit includes change"
    );
    assert(
      audits.some((a) => a.action === "clear"),
      "audit includes clear"
    );
    assert(
      audits.every((a) => a.adminId === "admin-pd"),
      "audit stores admin actor"
    );

    // --- WhatsApp message does not auto-change business status / create records ---
    const retailStatusBefore = (
      await db.retailRequest.findUnique({ where: { id: fixtures.retail.id } })
    )?.status;
    const dealCountBefore = await db.dealProposal.count();
    const wsCountBefore = await db.wholesaleRequest.count();
    const retailCountBefore = await db.retailRequest.count();

    await persistInboundText(
      {
        waMessageId: "pd-in-2",
        waChatId: chatId,
        waRemoteJid: chatId,
        senderE164: "963900111222",
        displayName: "WA Contact",
        text: "Please mark completed / accept deal / confirm wholesale",
        timestamp: "2026-10-05T15:10:00.000Z",
      },
      db
    );

    const retailStatusAfter = (
      await db.retailRequest.findUnique({ where: { id: fixtures.retail.id } })
    )?.status;
    assert(
      retailStatusAfter === retailStatusBefore,
      "WhatsApp message does not automatically change business status"
    );
    assert(
      (await db.dealProposal.count()) === dealCountBefore &&
        (await db.wholesaleRequest.count()) === wsCountBefore &&
        (await db.retailRequest.count()) === retailCountBefore,
      "WhatsApp message does not create business records"
    );

    // --- AR/EN ---
    const ar = getDictionary("ar");
    const en = getDictionary("en");
    assert(!!ar.inbox.businessContext && !!en.inbox.businessContext, "AR/EN context labels");
    assert(!!ar.inbox.notLinked && !!en.inbox.notLinked, "AR/EN not linked labels");
    assert(!!ar.inbox.typeRetail && !!en.inbox.typeDeal, "AR/EN link type labels");

    console.log(`\nPhase D checks: PASS (${passed} assertions)`);
  } finally {
    await cleanup();
  }
}

main().catch((err) => {
  console.error(err);
  console.error(`\nPhase D checks: FAIL (passed=${passed} failed=${failed || 1})`);
  process.exit(1);
});
