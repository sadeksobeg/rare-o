/**
 * Phase C WhatsApp Admin Inbox checks.
 *
 * Isolated temp SQLite — does not write WhatsApp fixtures into the
 * development/production database.
 *
 * Run: npm run test:whatsapp-phase-c
 */

import { randomUUID } from "node:crypto";

import { PrismaClient } from "@prisma/client";
import { createIsolatedDb } from "./lib/isolated-db";
import { SignJWT } from "jose";

import {
  formatConversationDisplayLabel,
  getInboxConversation,
  getInboxHealthView,
  listInboxConversations,
  markConversationRead,
} from "../lib/whatsapp/messaging/inbox";
import {
  enqueueOutboundText,
  persistInboundText,
  upsertConnectionHealth,
} from "../lib/whatsapp/messaging/service";
import { getDictionary } from "../lib/i18n/dictionaries";
import { verifyAdminSessionToken } from "../lib/auth/admin-session";
import {
  adminGetInboxConversationAction,
  adminGetInboxHealthAction,
  adminListInboxConversationsAction,
  adminSendWhatsAppTextAction,
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
  const iso = await createIsolatedDb("rare-oud-wa-pc");
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

async function main(): Promise<void> {
  if (!process.env.AUTH_SECRET || process.env.AUTH_SECRET.length < 16) {
    process.env.AUTH_SECRET = "week4-phase-c-auth-secret";
  }

  const prevOutbound = process.env.WHATSAPP_OUTBOUND_ENABLED;
  const { db, cleanup } = await setupIsolatedDb();

  try {
    const chatId = "963911122233@s.whatsapp.net";

    const first = await persistInboundText(
      {
        waMessageId: "pc-in-1",
        waChatId: chatId,
        waRemoteJid: chatId,
        senderE164: "963911122233",
        displayName: "Inbox Contact",
        text: "Salam — need oud info",
        timestamp: "2026-10-05T14:00:00.000Z",
      },
      db
    );
    assert(first.ok && first.created, "seed inbound for inbox list");

    await persistInboundText(
      {
        waMessageId: "pc-in-2",
        waChatId: chatId,
        waRemoteJid: chatId,
        senderE164: "963911122233",
        displayName: "Inbox Contact",
        text: "Second message",
        timestamp: "2026-10-05T14:05:00.000Z",
      },
      db
    );

    // --- list conversations ---
    const list = await listInboxConversations(db);
    assert(list.length === 1, "admin can list conversations");
    assert(list[0].id === first.conversationId, "list returns conversation id");
    assert(list[0].hasUnread, "unread reflected in list");
    assert(
      list[0].lastMessagePreview.includes("Second"),
      "list shows last message preview"
    );
    assert(
      list[0].displayLabel.includes("963911122233"),
      "list shows privacy-conscious WhatsApp identity"
    );

    // --- open conversation / read messages ---
    const detail = await getInboxConversation(first.conversationId, db);
    assert(!!detail, "admin can open a conversation");
    assert(detail!.messages.length === 2, "admin can read persisted messages");
    assert(
      detail!.messages[0].direction === "inbound",
      "inbound direction visible"
    );
    assert(
      detail!.messages[0].body.includes("Salam"),
      "message body from persistence"
    );

    await markConversationRead(first.conversationId, db);
    const afterRead = await getInboxConversation(first.conversationId, db);
    assert(afterRead?.unreadCount === 0, "mark read clears unread");

    // --- failed outbound visible ---
    process.env.WHATSAPP_OUTBOUND_ENABLED = "true";
    const failEnqueue = await enqueueOutboundText(
      {
        waChatId: chatId,
        text: "Will show as failed",
        clientRequestId: "pc-out-fail-1",
        adminId: "admin-pc",
      },
      db
    );
    assert(failEnqueue.ok, "enqueue for failed-state fixture");
    await db.whatsAppMessage.update({
      where: { id: failEnqueue.messageId },
      data: { status: "failed", errorSafe: "Transport failure (test)" },
    });
    const withFail = await getInboxConversation(first.conversationId, db);
    const failedMsg = withFail?.messages.find((m) => m.status === "failed");
    assert(!!failedMsg, "failed outbound state is visible");
    assert(
      failedMsg?.errorSafe === "Transport failure (test)",
      "failed outbound shows safe error"
    );

    // --- outbound send (enqueue) ---
    const clientRequestId = randomUUID();
    const sent = await enqueueOutboundText(
      {
        waChatId: chatId,
        text: "Admin reply from inbox",
        clientRequestId,
        adminId: "admin-pc",
      },
      db
    );
    assert(sent.ok && !sent.duplicate, "admin can send text (enqueue)");
    assert(sent.status === "pending", "outbound starts pending for worker");

    const dup = await enqueueOutboundText(
      {
        waChatId: chatId,
        text: "Admin reply from inbox (retry)",
        clientRequestId,
        adminId: "admin-pc",
      },
      db
    );
    assert(dup.ok && dup.duplicate, "duplicate send request is idempotent");
    assert(dup.messageId === sent.messageId, "duplicate returns same message");
    assert(
      (await db.whatsAppMessage.count({
        where: { clientRequestId },
      })) === 1,
      "duplicate send does not create duplicate message"
    );

    // --- kill switch ---
    process.env.WHATSAPP_OUTBOUND_ENABLED = "false";
    const blocked = await enqueueOutboundText(
      {
        waChatId: chatId,
        text: "blocked",
        clientRequestId: randomUUID(),
        adminId: "admin-pc",
      },
      db
    );
    assert(
      !blocked.ok && blocked.code === "OUTBOUND_DISABLED",
      "outbound disabled blocks sending"
    );

    // --- connection health safe ---
    process.env.WHATSAPP_OUTBOUND_ENABLED = "true";
    await upsertConnectionHealth(
      {
        state: "CONNECTED",
        detail: "Baileys connection open",
        lastConnectedAt: "2026-10-05T14:00:00.000Z",
        updatedAt: "2026-10-05T14:00:00.000Z",
      },
      db
    );
    const health = await getInboxHealthView(db);
    assert(health.state === "CONNECTED", "connection health displayed");
    assert(health.outboundEnabled === true, "health includes outbound flag");
    const healthJson = JSON.stringify(health);
    assert(!healthJson.includes("creds"), "health has no creds");
    // Column name qrDataUrl is allowed; reject actual data-URL / pairing payloads.
    assert(
      !/data:image|BEGIN:/i.test(healthJson) && !health.qrDataUrl,
      "health has no QR payload"
    );

    // --- display label privacy ---
    const masked = formatConversationDisplayLabel({
      participantE164: null,
      displayName: null,
      waChatId: "963998877665@s.whatsapp.net",
    });
    assert(masked.includes("…"), "masked jid when no e164");

    // --- AR/EN dictionaries ---
    const ar = getDictionary("ar");
    const en = getDictionary("en");
    assert(!!ar.inbox.title && !!ar.admin.inbox, "AR inbox dictionary present");
    assert(!!en.inbox.title && !!en.admin.inbox, "EN inbox dictionary present");
    assert(
      ar.inbox.outboundDisabled.length > 0 &&
        en.inbox.outboundDisabled.length > 0,
      "AR/EN kill-switch copy present"
    );
    assert(
      en.inbox.sendBlocked.length > 0 && ar.inbox.sendBlocked.length > 0,
      "AR/EN send-blocked copy present"
    );

    // --- unauthorized actions (no admin cookie / request context) ---
    const unauthList = await adminListInboxConversationsAction();
    assert(
      !unauthList.ok && unauthList.error === "UNAUTHORIZED",
      "unauthorized user cannot list inbox"
    );
    const unauthGet = await adminGetInboxConversationAction(
      first.conversationId
    );
    assert(
      !unauthGet.ok && unauthGet.error === "UNAUTHORIZED",
      "unauthorized user cannot open conversation"
    );
    const unauthHealth = await adminGetInboxHealthAction();
    assert(
      !unauthHealth.ok && unauthHealth.error === "UNAUTHORIZED",
      "unauthorized user cannot read health"
    );
    const fd = new FormData();
    fd.set("conversationId", first.conversationId);
    fd.set("text", "nope");
    fd.set("clientRequestId", randomUUID());
    const unauthSend = await adminSendWhatsAppTextAction(fd);
    assert(
      !unauthSend.ok && unauthSend.error === "UNAUTHORIZED",
      "unauthorized user cannot send"
    );

    // --- trader JWT must not verify as admin ---
    const traderJwt = await new SignJWT({
      email: "trader@example.com",
      name: "Trader",
      role: "trader",
    })
      .setProtectedHeader({ alg: "HS256" })
      .setSubject("trader-id")
      .setIssuedAt()
      .setExpirationTime("1h")
      .sign(new TextEncoder().encode(process.env.AUTH_SECRET!));
    const traderAsAdmin = await verifyAdminSessionToken(traderJwt);
    assert(traderAsAdmin === null, "non-admin session cannot access inbox auth");

    console.log(`\nPhase C checks: PASS (${passed} assertions)`);
  } finally {
    if (prevOutbound === undefined) delete process.env.WHATSAPP_OUTBOUND_ENABLED;
    else process.env.WHATSAPP_OUTBOUND_ENABLED = prevOutbound;
    await cleanup();
  }
}

main().catch((err) => {
  console.error(err);
  console.error(`\nPhase C checks: FAIL (passed=${passed} failed=${failed || 1})`);
  process.exit(1);
});
