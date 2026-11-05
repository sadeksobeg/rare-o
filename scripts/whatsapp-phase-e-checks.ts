/**
 * Phase E reliability / recovery / security regression checks.
 * Isolated temp SQLite only.
 *
 * Run: npm run test:whatsapp-phase-e
 */

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { randomUUID } from "node:crypto";

import { PrismaClient } from "@prisma/client";
import { createIsolatedDb } from "./lib/isolated-db";
import { SignJWT } from "jose";

import { verifyAdminSessionToken } from "../lib/auth/admin-session";
import { getDictionary } from "../lib/i18n/dictionaries";
import { BaileysWhatsAppAdapter } from "../lib/whatsapp/baileys-adapter";
import { getInboxConversation } from "../lib/whatsapp/messaging/inbox";
import {
  linkConversationToBusinessRecord,
} from "../lib/whatsapp/messaging/linking";
import {
  MAX_BAILEYS_RECONNECT_ATTEMPTS,
  MAX_OUTBOUND_ATTEMPTS,
} from "../lib/whatsapp/messaging/reliability";
import {
  claimOutboundForSend,
  dispatchOutboundMessage,
  dispatchPendingOutbound,
  enqueueOutboundText,
  persistInboundText,
  recoverInterruptedOutbound,
  sendOutboundText,
  upsertConnectionHealth,
} from "../lib/whatsapp/messaging/service";
import { clearPersistedSafetyStateForTests } from "../lib/whatsapp/outbound-safety";
import {
  adminListInboxConversationsAction,
  adminSendWhatsAppTextAction,
} from "../app/whatsapp-actions";
import type {
  WhatsAppAdapter,
  WhatsAppHealth,
  WhatsAppSendTextInput,
  WhatsAppSendTextResult,
} from "../lib/whatsapp/types";
import { isOutboundEnabled, WHATSAPP_CONNECTION_STATES } from "../lib/whatsapp/types";

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
  failTimes?: number;
}): WhatsAppAdapter & {
  sendCalls: WhatsAppSendTextInput[];
  setConnected: (v: boolean) => void;
} {
  let connected = opts?.connected ?? true;
  let failRemaining = opts?.failTimes ?? (opts?.failSend ? 999 : 0);
  const sendCalls: WhatsAppSendTextInput[] = [];
  const seen = new Set<string>();

  return {
    sendCalls,
    setConnected: (v) => {
      connected = v;
    },
    getHealth: (): WhatsAppHealth => ({
      state: connected ? "CONNECTED" : "DISCONNECTED",
      updatedAt: new Date().toISOString(),
    }),
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
      if (failRemaining > 0) {
        failRemaining -= 1;
        return {
          ok: false,
          clientRequestId: input.clientRequestId,
          error: "Simulated failure",
          code: "SEND_FAILED",
        };
      }
      seen.add(input.clientRequestId);
      return {
        ok: true,
        waMessageId: `wa-${input.clientRequestId}`,
        clientRequestId: input.clientRequestId,
      };
    },
  };
}

async function setupIsolatedDb(): Promise<{
  db: PrismaClient;
  cleanup: () => Promise<void>;
}> {
  const iso = await createIsolatedDb("rare-oud-wa-pe");
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
    process.env.AUTH_SECRET = "week4-phase-e-auth-secret";
  }
  const prevOutbound = process.env.WHATSAPP_OUTBOUND_ENABLED;
  // This script's fixtures live in an isolated SQLite DB (see setupIsolatedDb
  // below), but lib/whatsapp/outbound-safety.ts's rate-limiter/circuit-breaker
  // state is persisted to the shared dev Postgres `WhatsAppOutboundSafetyState`
  // row regardless — it's a process-wide module, not parameterized by the
  // isolated `db` client. Without this reset, failures recorded by *any*
  // other recent process against the real dev DB (another test run, the
  // real worker) are hydrated in here too and can open the circuit before
  // this script's own "bounded retry" scenario expects it to.
  await clearPersistedSafetyStateForTests();
  const { db, cleanup } = await setupIsolatedDb();

  try {
    const chat = "963900112233@s.whatsapp.net";

    // --- duplicate inbound ---
    const a = await persistInboundText(
      {
        waMessageId: "pe-in-1",
        waChatId: chat,
        waRemoteJid: chat,
        senderE164: "963900112233",
        displayName: "Contact",
        text: "One",
        timestamp: "2026-10-05T16:00:00.000Z",
      },
      db
    );
    assert(a.ok && a.created, "first inbound persisted");
    const a2 = await persistInboundText(
      {
        waMessageId: "pe-in-1",
        waChatId: chat,
        waRemoteJid: chat,
        senderE164: "963900112233",
        displayName: "Contact",
        text: "One replay",
        timestamp: "2026-10-05T16:00:00.000Z",
      },
      db
    );
    assert(a2.ok && !a2.created, "duplicate inbound event ignored");
    assert(
      (await db.whatsAppMessage.count({ where: { waMessageId: "pe-in-1" } })) ===
        1,
      "duplicate inbound does not create duplicate message"
    );

    // --- message ordering ---
    await persistInboundText(
      {
        waMessageId: "pe-in-3",
        waChatId: chat,
        waRemoteJid: chat,
        senderE164: "963900112233",
        displayName: "Contact",
        text: "Three",
        timestamp: "2026-10-05T16:00:02.000Z",
      },
      db
    );
    await persistInboundText(
      {
        waMessageId: "pe-in-2",
        waChatId: chat,
        waRemoteJid: chat,
        senderE164: "963900112233",
        displayName: "Contact",
        text: "Two",
        timestamp: "2026-10-05T16:00:01.000Z",
      },
      db
    );
    const ordered = await getInboxConversation(a.conversationId, db);
    assert(!!ordered, "conversation loaded for ordering");
    const bodies = ordered!.messages
      .filter((m) => m.direction === "inbound" && m.messageType === "text")
      .map((m) => m.body);
    assert(
      bodies.join("|") === "One|Two|Three",
      "message ordering by waTimestamp then createdAt/id"
    );

    // --- duplicate outbound request ---
    process.env.WHATSAPP_OUTBOUND_ENABLED = "true";
    const adapter = createTestAdapter({ connected: true });
    const out1 = await sendOutboundText(
      adapter,
      {
        waChatId: chat,
        text: "Reply",
        clientRequestId: "pe-out-1",
        adminId: "admin-e",
      },
      db
    );
    assert(out1.ok, "outbound send ok");
    const outDup = await sendOutboundText(
      adapter,
      {
        waChatId: chat,
        text: "Reply retry",
        clientRequestId: "pe-out-1",
        adminId: "admin-e",
      },
      db
    );
    assert(outDup.ok && outDup.messageId === out1.messageId, "duplicate outbound request idempotent");
    assert(adapter.sendCalls.length === 1, "duplicate outbound does not resend");

    // --- kill switch at final send boundary ---
    process.env.WHATSAPP_OUTBOUND_ENABLED = "true";
    const enq = await enqueueOutboundText(
      {
        waChatId: chat,
        text: "kill me",
        clientRequestId: "pe-out-kill",
        adminId: "admin-e",
      },
      db
    );
    assert(enq.ok, "enqueue while enabled");
    process.env.WHATSAPP_OUTBOUND_ENABLED = "false";
    const killAdapter = createTestAdapter({ connected: true });
    const killed = await dispatchOutboundMessage(killAdapter, enq.messageId, db);
    assert(
      !killed.ok && killed.code === "OUTBOUND_DISABLED",
      "kill switch blocks dispatch"
    );
    assert(killAdapter.sendCalls.length === 0, "kill switch prevents adapter send");
    // Direct adapter boundary
    const direct = await killAdapter.sendText({
      waChatId: chat,
      text: "bypass",
      clientRequestId: "pe-direct-kill",
      adminId: "admin-e",
    });
    assert(
      !direct.ok && direct.code === "OUTBOUND_DISABLED",
      "kill switch at final adapter send boundary"
    );

    // --- interrupted outbound recovery (worker restart) ---
    process.env.WHATSAPP_OUTBOUND_ENABLED = "true";
    const enq2 = await enqueueOutboundText(
      {
        waChatId: chat,
        text: "interrupted",
        clientRequestId: "pe-out-interrupt",
        adminId: "admin-e",
      },
      db
    );
    assert(enq2.ok, "enqueue interrupt fixture");
    await db.whatsAppMessage.update({
      where: { id: enq2.messageId },
      data: {
        status: "sending",
        attemptCount: 1,
        lastAttemptAt: new Date(Date.now() - 10 * 60 * 1000),
      },
    });
    const recovered = await recoverInterruptedOutbound(db, { forceAll: true });
    assert(recovered.recoveredToPending >= 1, "interrupted outbound recovered to pending");
    const afterRecover = await db.whatsAppMessage.findUnique({
      where: { id: enq2.messageId },
    });
    assert(afterRecover?.status === "pending", "worker restart resumes interrupted as pending");

    // interrupted with waMessageId → sent (no resend)
    await db.whatsAppMessage.update({
      where: { id: enq2.messageId },
      data: {
        status: "sending",
        waMessageId: "already-sent-id",
        attemptCount: 1,
        lastAttemptAt: new Date(Date.now() - 10 * 60 * 1000),
      },
    });
    const recoveredSent = await recoverInterruptedOutbound(db, { forceAll: true });
    assert(recoveredSent.markedSent >= 1, "interrupted with waMessageId marked sent");
    assert(
      (await db.whatsAppMessage.findUnique({ where: { id: enq2.messageId } }))
        ?.status === "sent",
      "do not resend when waMessageId already known"
    );

    // --- bounded retry ---
    const flaky = createTestAdapter({ connected: true, failTimes: 2 });
    const retryId = randomUUID();
    const retry = await sendOutboundText(
      flaky,
      {
        waChatId: chat,
        text: "retry me",
        clientRequestId: retryId,
        adminId: "admin-e",
      },
      db
    );
    assert(!retry.ok && retry.status === "pending", "first failure parks pending");
    const mid = await dispatchOutboundMessage(flaky, retry.messageId, db);
    assert(!mid.ok && mid.status === "pending", "second failure still pending");
    const ok = await dispatchOutboundMessage(flaky, retry.messageId, db);
    assert(ok.ok && ok.status === "sent", "bounded retry eventually sends");
    assert(flaky.sendCalls.length === 3, "exactly three attempts then success");

    // exhaust to failed
    const forever = createTestAdapter({ connected: true, failSend: true });
    const exhaustId = randomUUID();
    const ex = await enqueueOutboundText(
      {
        waChatId: chat,
        text: "exhaust",
        clientRequestId: exhaustId,
        adminId: "admin-e",
      },
      db
    );
    assert(ex.ok, "enqueue exhaust");
    for (let i = 0; i < MAX_OUTBOUND_ATTEMPTS; i++) {
      await dispatchOutboundMessage(forever, ex.messageId, db);
    }
    const exhausted = await db.whatsAppMessage.findUnique({
      where: { id: ex.messageId },
    });
    assert(exhausted?.status === "failed", "failed outbound after max attempts");
    assert(
      exhausted!.attemptCount === MAX_OUTBOUND_ATTEMPTS,
      "attemptCount equals max"
    );

    // The exhaust-to-failed loop above intentionally racks up enough
    // failures to open the circuit breaker; reset it so the unrelated
    // scenarios below aren't blocked by it (assessOutboundEnqueue rejects
    // new enqueues while the circuit is open — see outbound-safety.ts).
    await clearPersistedSafetyStateForTests();

    // --- claim prevents double dispatch ---
    const claimEnq = await enqueueOutboundText(
      {
        waChatId: chat,
        text: "claim",
        clientRequestId: randomUUID(),
        adminId: "admin-e",
      },
      db
    );
    assert(claimEnq.ok, "enqueue for claim race");
    const c1 = await claimOutboundForSend(claimEnq.messageId, db);
    const c2 = await claimOutboundForSend(claimEnq.messageId, db);
    assert(c1.ok, "first claim succeeds");
    assert(!c2.ok, "second concurrent claim fails");

    // --- connection health transitions ---
    assert(
      WHATSAPP_CONNECTION_STATES.includes("RECONNECTING"),
      "RECONNECTING is a health state"
    );
    await upsertConnectionHealth(
      {
        state: "RECONNECTING",
        detail: "Reconnect attempt 1",
        updatedAt: new Date().toISOString(),
      },
      db
    );
    const healthRow = await db.whatsAppConnectionHealth.findUnique({
      where: { id: "default" },
    });
    assert(healthRow?.state === "RECONNECTING", "connection health transitions persist");
    assert(
      !JSON.stringify(healthRow).toLowerCase().includes("qr="),
      "health has no QR material"
    );
    assert(MAX_BAILEYS_RECONNECT_ATTEMPTS > 0, "reconnect attempts are bounded");

    // Adapter idle start does not claim connected
    const authTmp = fs.mkdtempSync(path.join(os.tmpdir(), "rare-oud-pe-auth-"));
    try {
      const baileys = new BaileysWhatsAppAdapter({
        session: { authDir: authTmp },
        connectOnStart: false,
      });
      await baileys.start();
      assert(
        baileys.getHealth().state !== "CONNECTED",
        "worker alive alone does not report CONNECTED"
      );
      await baileys.stop();
    } finally {
      fs.rmSync(authTmp, { recursive: true, force: true });
    }

    // --- pending drain respects kill switch ---
    process.env.WHATSAPP_OUTBOUND_ENABLED = "false";
    const drain = await dispatchPendingOutbound(
      createTestAdapter({ connected: true }),
      db
    );
    assert(drain.processed === 0, "pending drain no-ops when kill switch off");

    // --- authorization regression ---
    const unauthList = await adminListInboxConversationsAction();
    assert(
      !unauthList.ok && unauthList.error === "UNAUTHORIZED",
      "trader/unauth cannot access admin inbox action"
    );
    const fd = new FormData();
    fd.set("conversationId", a.conversationId);
    fd.set("text", "nope");
    fd.set("clientRequestId", randomUUID());
    const unauthSend = await adminSendWhatsAppTextAction(fd);
    assert(
      !unauthSend.ok && unauthSend.error === "UNAUTHORIZED",
      "unauth cannot send WhatsApp"
    );
    const traderJwt = await new SignJWT({
      email: "t@x.com",
      name: "T",
      role: "trader",
    })
      .setProtectedHeader({ alg: "HS256" })
      .setSubject("trader-x")
      .setIssuedAt()
      .setExpirationTime("1h")
      .sign(new TextEncoder().encode(process.env.AUTH_SECRET!));
    assert(
      (await verifyAdminSessionToken(traderJwt)) === null,
      "trader cannot access admin WhatsApp auth"
    );

    // --- arbitrary link type rejection ---
    const badLink = await linkConversationToBusinessRecord(
      {
        conversationId: a.conversationId,
        linkType: "Customer",
        linkId: "x",
        adminId: "admin-e",
      },
      db
    );
    assert(
      !badLink.ok && badLink.code === "UNSUPPORTED_LINK_TYPE",
      "arbitrary link type rejected"
    );

    // --- no automatic business lifecycle mutation ---
    const retailBefore = await db.retailRequest.count();
    const dealBefore = await db.dealProposal.count();
    await persistInboundText(
      {
        waMessageId: "pe-in-lifecycle",
        waChatId: chat,
        waRemoteJid: chat,
        senderE164: "963900112233",
        displayName: "Contact",
        text: "accept deal and complete retail",
        timestamp: "2026-10-05T16:30:00.000Z",
      },
      db
    );
    assert(
      (await db.retailRequest.count()) === retailBefore &&
        (await db.dealProposal.count()) === dealBefore,
      "no automatic business lifecycle mutation from messages"
    );

    // --- AR/EN failure visibility labels ---
    const ar = getDictionary("ar");
    const en = getDictionary("en");
    assert(!!ar.inbox.statusSending && !!en.inbox.statusSending, "sending status i18n");
    assert(
      !!ar.inbox.healthReconnecting && !!en.inbox.healthReconnecting,
      "reconnecting health i18n"
    );
    assert(!!ar.inbox.outboundDisabled && !!en.inbox.sendFailed, "failure visibility i18n");

    console.log(`\nPhase E checks: PASS (${passed} assertions)`);
  } finally {
    if (prevOutbound === undefined) delete process.env.WHATSAPP_OUTBOUND_ENABLED;
    else process.env.WHATSAPP_OUTBOUND_ENABLED = prevOutbound;
    await cleanup();
    // Leave no persisted rate-limit/circuit state behind for the next run
    // (this script's own real-dispatch scenarios can open the circuit).
    await clearPersistedSafetyStateForTests();
  }
}

main().catch((err) => {
  console.error(err);
  console.error(`\nPhase E checks: FAIL (passed=${passed} failed=${failed || 1})`);
  process.exit(1);
});
