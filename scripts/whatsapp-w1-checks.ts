/**
 * WA-W1 checks — dedupe, backoff retry, SSE resume, rate limit, kill switch,
 * cleanup, sending watchdog, SSE auth mapping, per-session SSE cap.
 * No real WhatsApp sends. Requires DATABASE_URL. Uses fake/env-off patterns.
 *
 * Run: npx tsx scripts/whatsapp-w1-checks.ts
 */

import { randomUUID } from "node:crypto";
import { prisma } from "@/lib/db/prisma";
import {
  clearEnqueueRateLimitForTests,
  assessEnqueueRateLimit,
  recordEnqueueAccepted,
  configureGlobalEnqueueRateLimit,
  getGlobalEnqueueRateLimit,
} from "@/lib/whatsapp/messaging/enqueue-rate-limit";
import {
  listInboxEventsAfter,
  publishInboxEvent,
} from "@/lib/whatsapp/messaging/inbox-events";
import { cleanupInboxEventsOlderThan } from "@/lib/whatsapp/messaging/inbox-event-cleanup";
import { authorizeInboxSseFromSession } from "@/lib/whatsapp/messaging/inbox-sse-auth";
import {
  clearInboxSseSlotsForTests,
  countInboxSseSlotsForTests,
  getInboxSseMaxPerSession,
  tryAcquireInboxSseSlot,
  releaseInboxSseSlot,
} from "@/lib/whatsapp/messaging/sse-session-cap";
import {
  enqueueOutboundText,
  recordOutboundStatusUpdate,
  recoverInterruptedOutbound,
} from "@/lib/whatsapp/messaging/service";
import { outboundRetryDelayMs } from "@/lib/whatsapp/messaging/reliability";
import {
  primeOutboundKillSwitch,
  isOutboundEnabled,
  isOutboundEnvEnabled,
} from "@/lib/whatsapp/types";
import {
  refreshOutboundKillSwitchFromDb,
  setOutboundKillSwitch,
  setOutboundGlobalRatePerMin,
} from "@/lib/whatsapp/messaging/outbound-kill-switch";

function assert(cond: unknown, msg: string): asserts cond {
  if (!cond) throw new Error(`ASSERT: ${msg}`);
}

async function main() {
  const prevOutbound = process.env.WHATSAPP_OUTBOUND_ENABLED;
  const prevRate = process.env.WHATSAPP_OUTBOUND_GLOBAL_RATE_PER_MIN;
  delete process.env.WHATSAPP_OUTBOUND_GLOBAL_RATE_PER_MIN;
  process.env.WHATSAPP_OUTBOUND_ENABLED = "true";
  primeOutboundKillSwitch(false);
  clearEnqueueRateLimitForTests();
  clearInboxSseSlotsForTests();

  const suffix = randomUUID().slice(0, 8);
  const waChatId = `9647000${suffix.slice(0, 6)}@s.whatsapp.net`;
  const adminId = `w1-admin-${suffix}`;

  console.log("[w1] seed conversation");
  const conversation = await prisma.whatsAppConversation.create({
    data: {
      waChatId,
      remoteJid: waChatId,
      displayName: `W1 ${suffix}`,
      lastMessageAt: new Date(),
      lastMessagePreview: "seed",
      unreadCount: 0,
    },
  });

  try {
    // --- SSE auth mapping (401/403) ---
    console.log("[w1] sse auth 401/403");
    const noSession = authorizeInboxSseFromSession(null);
    assert(!noSession.ok && noSession.status === 401, "no session → 401");
    const unauth = authorizeInboxSseFromSession(undefined, "UNAUTHORIZED");
    assert(!unauth.ok && unauth.status === 401, "UNAUTHORIZED → 401");
    const mustPw = authorizeInboxSseFromSession(
      undefined,
      "MUST_CHANGE_PASSWORD"
    );
    assert(!mustPw.ok && mustPw.status === 403, "MUST_CHANGE_PASSWORD → 403");
    const mustPwSession = authorizeInboxSseFromSession({
      sub: "a",
      mustChangePassword: true,
    });
    assert(
      !mustPwSession.ok && mustPwSession.status === 403,
      "mustChangePassword session → 403"
    );
    const okAuth = authorizeInboxSseFromSession({ sub: "admin-1" });
    assert(okAuth.ok && okAuth.sub === "admin-1", "admin session ok");

    // --- SSE per-session cap ---
    console.log("[w1] sse session cap");
    clearInboxSseSlotsForTests();
    const max = getInboxSseMaxPerSession();
    for (let i = 0; i < max; i++) {
      assert(tryAcquireInboxSseSlot("sess-a"), `acquire ${i}`);
    }
    assert(!tryAcquireInboxSseSlot("sess-a"), "cap blocks");
    assert(tryAcquireInboxSseSlot("sess-b"), "other session ok");
    releaseInboxSseSlot("sess-a");
    assert(tryAcquireInboxSseSlot("sess-a"), "slot freed");
    assert(countInboxSseSlotsForTests("sess-a") === max, "count after refill");
    clearInboxSseSlotsForTests();

    // --- configurable global rate ---
    console.log("[w1] configurable global rate");
    clearEnqueueRateLimitForTests();
    configureGlobalEnqueueRateLimit(2);
    assert(getGlobalEnqueueRateLimit() === 2, "rate=2");
    const rateChat = `${waChatId}-rate`;
    assert(assessEnqueueRateLimit(`${rateChat}-1`).ok, "g1");
    recordEnqueueAccepted(`${rateChat}-1`);
    // bypass per-chat 1/s by using different keys
    assert(assessEnqueueRateLimit(`${rateChat}-2`).ok, "g2");
    recordEnqueueAccepted(`${rateChat}-2`);
    const limitedGlobal = assessEnqueueRateLimit(`${rateChat}-3`);
    assert(
      !limitedGlobal.ok && limitedGlobal.code === "RATE_LIMITED",
      "global 2/min"
    );
    const saved = await setOutboundGlobalRatePerMin(20);
    assert(saved.ok && saved.perMin === 20, "persist rate 20");
    clearEnqueueRateLimitForTests();
    configureGlobalEnqueueRateLimit(20);

    // --- rate limit per chat ---
    console.log("[w1] rate limit per chat");
    clearEnqueueRateLimitForTests();
    assert(assessEnqueueRateLimit(waChatId).ok, "first rate ok");
    recordEnqueueAccepted(waChatId);
    const limited = assessEnqueueRateLimit(waChatId);
    assert(!limited.ok && limited.code === "RATE_LIMITED", "per-chat 1/s");

    // --- kill switch with actor ---
    console.log("[w1] kill switch");
    process.env.WHATSAPP_OUTBOUND_ENABLED = "true";
    primeOutboundKillSwitch(false);
    assert(isOutboundEnvEnabled(), "env on");
    assert(isOutboundEnabled(), "enabled before kill");
    const killed = await setOutboundKillSwitch(true, "CONNECTED", {
      by: "admin@test.local",
      reason: "review evidence",
    });
    assert(killed.ok, "set kill");
    assert(killed.ok && killed.killSwitchBy === "admin@test.local", "kill by");
    assert(killed.ok && killed.killSwitchReason === "review evidence", "reason");
    assert(!isOutboundEnabled(), "disabled by kill");
    const blocked = await enqueueOutboundText({
      waChatId,
      text: "should block",
      clientRequestId: randomUUID(),
      adminId,
      allowCreateConversation: false,
    });
    assert(!blocked.ok && blocked.code === "OUTBOUND_DISABLED", "enqueue blocked");
    const resumed = await setOutboundKillSwitch(false, "CONNECTED", {
      by: "admin@test.local",
    });
    assert(resumed.ok, "clear kill");
    await refreshOutboundKillSwitchFromDb();
    assert(isOutboundEnabled(), "enabled after clear");

    // --- cold conversation block ---
    console.log("[w1] cold conversation block");
    const cold = await enqueueOutboundText({
      waChatId: `9647111${suffix.slice(0, 6)}@s.whatsapp.net`,
      text: "cold",
      clientRequestId: randomUUID(),
      adminId,
      allowCreateConversation: false,
    });
    assert(
      !cold.ok && cold.code === "CONVERSATION_REQUIRED",
      "cold number blocked"
    );

    // --- dedupe + publish ---
    console.log("[w1] dedupe + events");
    clearEnqueueRateLimitForTests();
    const clientRequestId = randomUUID();
    const first = await enqueueOutboundText({
      waChatId,
      text: "hello w1",
      clientRequestId,
      adminId,
      allowCreateConversation: false,
    });
    assert(first.ok && !first.duplicate, "first enqueue");
    const dup = await enqueueOutboundText({
      waChatId,
      text: "hello w1",
      clientRequestId,
      adminId,
      allowCreateConversation: false,
    });
    assert(dup.ok && dup.duplicate, "duplicate idempotent");
    assert(dup.messageId === first.messageId, "same message id");

    // --- backoff helper ---
    assert(outboundRetryDelayMs(1) === 2000, "backoff 1");
    assert(outboundRetryDelayMs(2) === 4000, "backoff 2");
    assert(outboundRetryDelayMs(3) === 8000, "backoff 3");

    // --- status event + SSE resume list ---
    console.log("[w1] status + resume");
    await prisma.whatsAppMessage.update({
      where: { id: first.messageId },
      data: { status: "sent", waMessageId: `wamid-${suffix}` },
    });
    const applied = await recordOutboundStatusUpdate(
      `wamid-${suffix}`,
      "delivered"
    );
    assert(applied.ok && applied.applied, "delivered applied");

    const published = await publishInboxEvent("connection.state", {
      connectionState: "CONNECTED",
      outboundEnabled: true,
      outboundKillSwitch: false,
    });
    assert(published, "publish connection.state");
    const after = await listInboxEventsAfter(null, 50);
    assert(after.some((e) => e.id === published!.id), "event listed");
    const resume = await listInboxEventsAfter(published!.id, 50);
    assert(!resume.some((e) => e.id === published!.id), "resume skips anchor");

    // --- stuck sending watchdog ---
    console.log("[w1] stuck sending watchdog");
    const stuckId = randomUUID();
    await prisma.whatsAppMessage.create({
      data: {
        id: stuckId,
        conversationId: conversation.id,
        direction: "outbound",
        messageType: "text",
        body: "stuck",
        status: "sending",
        clientRequestId: randomUUID(),
        adminId,
        attemptCount: 1,
        lastAttemptAt: new Date(Date.now() - 3 * 60_000),
      },
    });
    const recovered = await recoverInterruptedOutbound(prisma, {
      now: new Date(),
    });
    assert(recovered.recoveredToPending >= 1, "watchdog → pending");
    const stuckRow = await prisma.whatsAppMessage.findUnique({
      where: { id: stuckId },
    });
    assert(stuckRow?.status === "pending", "stuck is pending");
    assert(stuckRow?.nextRetryAt != null, "nextRetryAt set");

    // --- event cleanup >48h ---
    console.log("[w1] event cleanup 48h");
    const oldId = `old-${suffix}`;
    await prisma.whatsAppInboxEvent.create({
      data: {
        id: oldId,
        type: "connection.state",
        payloadJson: "{}",
        createdAt: new Date(Date.now() - 49 * 60 * 60 * 1000),
      },
    });
    const pruned = await cleanupInboxEventsOlderThan();
    assert(pruned.deleted >= 1, "deleted old events");
    const gone = await prisma.whatsAppInboxEvent.findUnique({
      where: { id: oldId },
    });
    assert(!gone, "old event removed");

    console.log("[w1] OK");
  } finally {
    await prisma.whatsAppMessage.deleteMany({
      where: { conversationId: conversation.id },
    });
    await prisma.whatsAppConversation.delete({ where: { id: conversation.id } });
    await setOutboundKillSwitch(false).catch(() => undefined);
    if (prevOutbound === undefined) delete process.env.WHATSAPP_OUTBOUND_ENABLED;
    else process.env.WHATSAPP_OUTBOUND_ENABLED = prevOutbound;
    if (prevRate === undefined) delete process.env.WHATSAPP_OUTBOUND_GLOBAL_RATE_PER_MIN;
    else process.env.WHATSAPP_OUTBOUND_GLOBAL_RATE_PER_MIN = prevRate;
    clearInboxSseSlotsForTests();
    await prisma.$disconnect();
  }
}

main().catch(async (err) => {
  console.error("[w1] FAIL", err);
  await prisma.$disconnect().catch(() => undefined);
  process.exit(1);
});
