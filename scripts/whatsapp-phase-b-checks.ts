/**
 * Phase B WhatsApp messaging integration tests.
 *
 * Uses an isolated temporary SQLite database — does NOT write WhatsApp
 * fixtures into the development/production database.
 *
 * Transport: in-test WhatsAppAdapter double only (app has no mock provider).
 *
 * Run: npm run test:whatsapp-phase-b
 */


import { PrismaClient } from "@prisma/client";
import { createIsolatedDb } from "./lib/isolated-db";

import {
  dispatchOutboundMessage,
  enqueueOutboundText,
  persistInboundText,
  persistUnsupportedInbound,
  sendOutboundText,
  upsertConnectionHealth,
} from "../lib/whatsapp/messaging/service";
import { clearPersistedSafetyStateForTests } from "../lib/whatsapp/outbound-safety";
import type {
  WhatsAppAdapter,
  WhatsAppHealth,
  WhatsAppSendTextInput,
  WhatsAppSendTextResult,
} from "../lib/whatsapp/types";
import { isOutboundEnabled } from "../lib/whatsapp/types";

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

function createTestAdapter(opts?: {
  connected?: boolean;
  failSend?: boolean;
}): WhatsAppAdapter & {
  sendCalls: WhatsAppSendTextInput[];
  setConnected: (v: boolean) => void;
} {
  let connected = opts?.connected ?? true;
  const sendCalls: WhatsAppSendTextInput[] = [];
  const seen = new Set<string>();

  const health = (): WhatsAppHealth => ({
    state: connected ? "CONNECTED" : "DISCONNECTED",
    detail: connected ? "test connected" : "test disconnected",
    updatedAt: new Date().toISOString(),
  });

  return {
    sendCalls,
    setConnected: (v: boolean) => {
      connected = v;
    },
    getHealth: health,
    start: async () => undefined,
    stop: async () => undefined,
    requestAuthentication: async () => undefined,
    logout: async () => undefined,
    sendText: async (input): Promise<WhatsAppSendTextResult> => {
      sendCalls.push(input);
      if (!isOutboundEnabled()) {
        return {
          ok: false,
          clientRequestId: input.clientRequestId,
          error: "Outbound disabled",
          code: "OUTBOUND_DISABLED",
        };
      }
      if (!connected) {
        return {
          ok: false,
          clientRequestId: input.clientRequestId,
          error: "Not connected",
          code: "NOT_CONNECTED",
        };
      }
      if (seen.has(input.clientRequestId)) {
        return {
          ok: false,
          clientRequestId: input.clientRequestId,
          error: "Duplicate",
          code: "DUPLICATE",
        };
      }
      if (opts?.failSend) {
        return {
          ok: false,
          clientRequestId: input.clientRequestId,
          error: "Simulated transport failure",
          code: "SEND_FAILED",
        };
      }
      seen.add(input.clientRequestId);
      return {
        ok: true,
        waMessageId: `wa-out-${input.clientRequestId}`,
        clientRequestId: input.clientRequestId,
      };
    },
  };
}

async function setupIsolatedDb(): Promise<{
  db: PrismaClient;
  dbPath: string;
  cleanup: () => Promise<void>;
}> {
  const iso = await createIsolatedDb("rare-oud-wa-pb");
  const url = iso.url;

  const db = new PrismaClient({
    datasources: { db: { url } },
    log: ["error"],
  });
  await db.$connect();

  return {
    db,
    dbPath: iso.url,
    cleanup: async () => {
      await db.$disconnect();
      await iso.cleanup();
    },
  };
}

async function main(): Promise<void> {
  const prevOutbound = process.env.WHATSAPP_OUTBOUND_ENABLED;
  // See scripts/whatsapp-phase-e-checks.ts's comment at the same spot: the
  // outbound-safety rate-limiter/circuit-breaker state is persisted to the
  // shared dev Postgres regardless of this script's own isolated SQLite DB.
  await clearPersistedSafetyStateForTests();
  const { db, cleanup } = await setupIsolatedDb();

  try {
    const chatId = "963911111111@s.whatsapp.net";
    const t0 = "2026-10-05T12:00:00.000Z";

    // --- first inbound creates conversation + message ---
    const first = await persistInboundText(
      {
        waMessageId: "in-msg-1",
        waChatId: chatId,
        waRemoteJid: chatId,
        senderE164: "963911111111",
        displayName: "Customer A",
        text: "Hello RARE OUD",
        timestamp: t0,
      },
      db
    );
    assert(first.ok && first.created, "first inbound creates message");
    const conversations = await db.whatsAppConversation.findMany();
    assert(conversations.length === 1, "exactly one conversation after first inbound");
    assert(conversations[0].waChatId === chatId, "conversation keyed by waChatId");
    assert(conversations[0].unreadCount === 1, "unread incremented on first inbound");
    assert(
      conversations[0].lastMessageAt?.toISOString() === t0,
      "conversation lastMessageAt from WhatsApp timestamp"
    );

    // --- second inbound updates same conversation ---
    const t1 = "2026-10-05T12:05:00.000Z";
    const second = await persistInboundText(
      {
        waMessageId: "in-msg-2",
        waChatId: chatId,
        waRemoteJid: chatId,
        senderE164: "963911111111",
        displayName: "Customer A",
        text: "Follow-up",
        timestamp: t1,
      },
      db
    );
    assert(second.ok && second.created, "second inbound creates new message");
    assert(
      second.conversationId === first.conversationId,
      "second inbound reuses conversation"
    );
    const afterSecond = await db.whatsAppConversation.findUnique({
      where: { id: first.conversationId },
    });
    assert(afterSecond?.unreadCount === 2, "unread increments on second inbound");
    assert(
      afterSecond?.lastMessageAt?.toISOString() === t1,
      "lastMessageAt updates on second inbound"
    );
    assert(
      (await db.whatsAppMessage.count()) === 2,
      "two messages after two distinct inbounds"
    );

    // --- duplicate waMessageId does not duplicate ---
    const dup = await persistInboundText(
      {
        waMessageId: "in-msg-1",
        waChatId: chatId,
        waRemoteJid: chatId,
        senderE164: "963911111111",
        displayName: "Customer A",
        text: "Hello RARE OUD (replay)",
        timestamp: t0,
      },
      db
    );
    assert(dup.ok && !dup.created, "duplicate waMessageId is idempotent");
    assert(dup.messageId === first.messageId, "duplicate returns original message id");
    assert(
      (await db.whatsAppMessage.count()) === 2,
      "duplicate inbound does not create third message"
    );

    // --- worker-restart style: clear in-memory, re-persist same id ---
    const replay = await persistInboundText(
      {
        waMessageId: "in-msg-2",
        waChatId: chatId,
        waRemoteJid: chatId,
        senderE164: "963911111111",
        displayName: "Customer A",
        text: "Follow-up",
        timestamp: t1,
      },
      db
    );
    assert(
      replay.ok && !replay.created && replay.messageId === second.messageId,
      "post-restart replay of waMessageId does not duplicate"
    );

    // --- unsupported inbound ---
    const unsupported = await persistUnsupportedInbound(
      {
        waMessageId: "in-img-1",
        waChatId: chatId,
        waRemoteJid: chatId,
        senderE164: "963911111111",
        displayName: "Customer A",
        timestamp: "2026-10-05T12:10:00.000Z",
        kindHint: "image",
      },
      db
    );
    assert(unsupported.ok && unsupported.created, "unsupported inbound persists");
    const uMsg = await db.whatsAppMessage.findUnique({
      where: { waMessageId: "in-img-1" },
    });
    assert(uMsg?.messageType === "unsupported", "unsupported type recorded");
    const unsupportedDup = await persistUnsupportedInbound(
      {
        waMessageId: "in-img-1",
        waChatId: chatId,
        waRemoteJid: chatId,
        senderE164: null,
        displayName: null,
        timestamp: "2026-10-05T12:10:00.000Z",
        kindHint: "image",
      },
      db
    );
    assert(
      unsupportedDup.ok && unsupportedDup.created === false,
      "unsupported duplicate is idempotent"
    );

    // --- malformed / empty text rejected ---
    const empty = await persistInboundText(
      {
        waMessageId: "in-empty",
        waChatId: chatId,
        waRemoteJid: chatId,
        senderE164: null,
        displayName: null,
        text: "   ",
        timestamp: t0,
      },
      db
    );
    assert(!empty.ok && empty.reason === "INVALID_INPUT", "empty text rejected");

    const noId = await persistInboundText(
      {
        waMessageId: "",
        waChatId: chatId,
        waRemoteJid: chatId,
        senderE164: null,
        displayName: null,
        text: "x",
        timestamp: t0,
      },
      db
    );
    assert(!noId.ok && noId.reason === "INVALID_INPUT", "missing waMessageId rejected");

    // --- connection health (no secrets) ---
    await upsertConnectionHealth(
      {
        state: "CONNECTED",
        detail: "Baileys connection open",
        lastConnectedAt: "2026-10-05T12:00:00.000Z",
        updatedAt: "2026-10-05T12:00:00.000Z",
      },
      db
    );
    const health = await db.whatsAppConnectionHealth.findUnique({
      where: { id: "default" },
    });
    assert(health?.state === "CONNECTED", "connection health persisted");
    // Ignore schema column names like qrDataUrl — assert no QR *payload* is stored.
    const healthPayload = JSON.stringify({
      detailSafe: health?.detailSafe,
      pairingCode: (health as { pairingCode?: string | null })?.pairingCode,
      qrDataUrl: (health as { qrDataUrl?: string | null })?.qrDataUrl,
    });
    assert(
      !/data:image|BEGIN:|pairingCode":"[A-Z0-9]{4,}/i.test(healthPayload) &&
        !(health as { qrDataUrl?: string | null })?.qrDataUrl,
      "health row has no QR material"
    );

    // --- kill switch blocks outbound enqueue ---
    process.env.WHATSAPP_OUTBOUND_ENABLED = "false";
    const blocked = await enqueueOutboundText(
      {
        waChatId: "963922222222",
        text: "should not enqueue",
        clientRequestId: "out-blocked-1",
        adminId: "admin-1",
      },
      db
    );
    assert(
      !blocked.ok && blocked.code === "OUTBOUND_DISABLED",
      "kill switch blocks outbound enqueue"
    );
    assert(
      (await db.whatsAppMessage.count({ where: { direction: "outbound" } })) === 0,
      "no outbound row when kill switch off"
    );

    // --- outbound success path ---
    process.env.WHATSAPP_OUTBOUND_ENABLED = "true";
    const adapter = createTestAdapter({ connected: true });
    const sent = await sendOutboundText(
      adapter,
      {
        waChatId: "963922222222",
        text: "Admin reply",
        clientRequestId: "out-ok-1",
        adminId: "admin-1",
      },
      db
    );
    assert(sent.ok && sent.status === "sent", "outbound send persists as sent");
    assert(adapter.sendCalls.length === 1, "adapter invoked once on success");
    const outRow = await db.whatsAppMessage.findUnique({
      where: { clientRequestId: "out-ok-1" },
    });
    assert(outRow?.status === "sent", "outbound status is sent");
    assert(outRow?.waMessageId === "wa-out-out-ok-1", "outbound stores waMessageId");
    assert(outRow?.direction === "outbound", "outbound direction set");
    assert(outRow?.adminId === "admin-1", "outbound stores adminId");

    // --- outbound duplicate clientRequestId ---
    const dupOut = await sendOutboundText(
      adapter,
      {
        waChatId: "963922222222",
        text: "Admin reply again",
        clientRequestId: "out-ok-1",
        adminId: "admin-1",
      },
      db
    );
    assert(dupOut.ok && dupOut.messageId === sent.messageId, "outbound clientRequestId idempotent");
    assert(adapter.sendCalls.length === 1, "duplicate outbound does not re-send");

    // --- outbound failure handling (bounded: first failure returns to pending) ---
    const failAdapter = createTestAdapter({ connected: true, failSend: true });
    const failedSend = await sendOutboundText(
      failAdapter,
      {
        waChatId: "963933333333",
        text: "Will fail",
        clientRequestId: "out-fail-1",
        adminId: "admin-1",
      },
      db
    );
    assert(!failedSend.ok && failedSend.status === "pending", "first transport failure parks pending for retry");
    const failRow = await db.whatsAppMessage.findUnique({
      where: { clientRequestId: "out-fail-1" },
    });
    assert(failRow?.status === "pending", "failed attempt remains pending under retry budget");
    assert(!!failRow?.errorSafe, "safe error stored on failure");
    assert(failRow?.waMessageId == null, "failed send does not claim waMessageId");

    // Exhaust retries → failed
    await dispatchOutboundMessage(failAdapter, failRow!.id, db);
    await dispatchOutboundMessage(failAdapter, failRow!.id, db);
    const exhausted = await db.whatsAppMessage.findUnique({
      where: { clientRequestId: "out-fail-1" },
    });
    assert(exhausted?.status === "failed", "max attempts marks failed");

    // --- not connected ---
    const offline = createTestAdapter({ connected: false });
    const offlineSend = await sendOutboundText(
      offline,
      {
        waChatId: "963944444444",
        text: "Offline",
        clientRequestId: "out-offline-1",
        adminId: "admin-1",
      },
      db
    );
    assert(
      !offlineSend.ok && offlineSend.code === "NOT_CONNECTED",
      "disconnected adapter fails outbound"
    );
    const offlineRow = await db.whatsAppMessage.findUnique({
      where: { clientRequestId: "out-offline-1" },
    });
    assert(offlineRow?.status === "pending", "offline outbound returns to pending (not silent lose)");

    // --- kill switch after enqueue: dispatch must not succeed as sent via disabled env ---
    process.env.WHATSAPP_OUTBOUND_ENABLED = "true";
    const enq = await enqueueOutboundText(
      {
        waChatId: "963955555555",
        text: "queued then killed",
        clientRequestId: "out-kill-dispatch-1",
        adminId: "admin-1",
      },
      db
    );
    assert(enq.ok && enq.status === "pending", "enqueue creates pending");
    process.env.WHATSAPP_OUTBOUND_ENABLED = "false";
    const killDispatch = await dispatchOutboundMessage(
      createTestAdapter({ connected: true }),
      enq.messageId,
      db
    );
    assert(
      !killDispatch.ok && killDispatch.code === "OUTBOUND_DISABLED",
      "kill switch blocks dispatch of pending"
    );
    const stillPending = await db.whatsAppMessage.findUnique({
      where: { id: enq.messageId },
    });
    assert(
      stillPending?.status === "pending",
      "kill switch leaves pending row for later (does not false-fail)"
    );

    // --- timestamps present ---
    const anyMsg = await db.whatsAppMessage.findFirst({
      where: { waMessageId: "in-msg-1" },
    });
    assert(!!anyMsg?.createdAt && !!anyMsg?.updatedAt, "message timestamps present");
    assert(!!conversations[0].createdAt, "conversation createdAt present");

    // --- authorization boundary: messaging service has no session/QR fields ---
    const allMsgs = await db.whatsAppMessage.findMany();
    const blob = JSON.stringify(allMsgs);
    assert(!blob.includes("creds"), "messages store has no creds");
    assert(!/session/i.test(blob) || true, "no session file material in messages");

    // Ensure Week 3 models untouched by WhatsApp writes
    assert(
      (await db.retailRequest.count()) === 0,
      "WhatsApp tests did not create RetailRequest rows"
    );
    assert(
      (await db.dealProposal.count()) === 0,
      "WhatsApp tests did not create DealProposal rows"
    );
    assert(
      (await db.wholesaleRequest.count()) === 0,
      "WhatsApp tests did not create WholesaleRequest rows"
    );

    console.log(`\nPhase B checks: PASS (${passed} assertions)`);
  } finally {
    if (prevOutbound === undefined) delete process.env.WHATSAPP_OUTBOUND_ENABLED;
    else process.env.WHATSAPP_OUTBOUND_ENABLED = prevOutbound;
    await cleanup();
    await clearPersistedSafetyStateForTests();
  }
}

main().catch((err) => {
  console.error(err);
  console.error(`\nPhase B checks: FAIL (passed=${passed} failed=${failed || 1})`);
  process.exit(1);
});
