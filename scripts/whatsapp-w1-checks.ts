/**
 * WA-W1 checks — dedupe, backoff retry, SSE resume, rate limit, kill switch.
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
} from "@/lib/whatsapp/messaging/enqueue-rate-limit";
import {
  listInboxEventsAfter,
  publishInboxEvent,
} from "@/lib/whatsapp/messaging/inbox-events";
import {
  enqueueOutboundText,
  recordOutboundStatusUpdate,
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
} from "@/lib/whatsapp/messaging/outbound-kill-switch";

function assert(cond: unknown, msg: string): asserts cond {
  if (!cond) throw new Error(`ASSERT: ${msg}`);
}

async function main() {
  const prevOutbound = process.env.WHATSAPP_OUTBOUND_ENABLED;
  process.env.WHATSAPP_OUTBOUND_ENABLED = "true";
  primeOutboundKillSwitch(false);
  clearEnqueueRateLimitForTests();

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
    // --- rate limit ---
    console.log("[w1] rate limit");
    clearEnqueueRateLimitForTests();
    assert(assessEnqueueRateLimit(waChatId).ok, "first rate ok");
    recordEnqueueAccepted(waChatId);
    const limited = assessEnqueueRateLimit(waChatId);
    assert(!limited.ok && limited.code === "RATE_LIMITED", "per-chat 1/s");

    // --- kill switch ---
    console.log("[w1] kill switch");
    process.env.WHATSAPP_OUTBOUND_ENABLED = "true";
    primeOutboundKillSwitch(false);
    assert(isOutboundEnvEnabled(), "env on");
    assert(isOutboundEnabled(), "enabled before kill");
    const killed = await setOutboundKillSwitch(true, "CONNECTED");
    assert(killed.ok, "set kill");
    assert(!isOutboundEnabled(), "disabled by kill");
    const blocked = await enqueueOutboundText({
      waChatId,
      text: "should block",
      clientRequestId: randomUUID(),
      adminId,
      allowCreateConversation: false,
    });
    assert(!blocked.ok && blocked.code === "OUTBOUND_DISABLED", "enqueue blocked");
    const resumed = await setOutboundKillSwitch(false, "CONNECTED");
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

    console.log("[w1] OK");
  } finally {
    await prisma.whatsAppMessage.deleteMany({
      where: { conversationId: conversation.id },
    });
    await prisma.whatsAppConversation.delete({ where: { id: conversation.id } });
    await setOutboundKillSwitch(false).catch(() => undefined);
    if (prevOutbound === undefined) delete process.env.WHATSAPP_OUTBOUND_ENABLED;
    else process.env.WHATSAPP_OUTBOUND_ENABLED = prevOutbound;
    await prisma.$disconnect();
  }
}

main().catch(async (err) => {
  console.error("[w1] FAIL", err);
  await prisma.$disconnect().catch(() => undefined);
  process.exit(1);
});
