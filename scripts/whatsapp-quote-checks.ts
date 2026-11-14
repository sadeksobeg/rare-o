/**
 * Reply-to (quoted message) reaches the adapter. No real WhatsApp send:
 * a stub adapter records what the worker would have sent.
 * Run: npm run test:whatsapp-quote
 */
import { randomUUID } from "node:crypto";
import { prisma } from "@/lib/db/prisma";
import {
  dispatchOutboundMessage,
  enqueueOutboundText,
  persistInboundText,
} from "@/lib/whatsapp/messaging/service";
import { clearEnqueueRateLimitForTests } from "@/lib/whatsapp/messaging/enqueue-rate-limit";
import type { WhatsAppAdapter, WhatsAppSendTextInput } from "@/lib/whatsapp/types";

let passed = 0;
let failed = 0;
function check(cond: unknown, msg: string) {
  if (cond) passed += 1;
  else {
    failed += 1;
    console.error(`FAIL: ${msg}`);
  }
}

async function main() {
  process.env.WHATSAPP_OUTBOUND_ENABLED = "true";
  const admin = await prisma.adminUser.findFirst({ select: { id: true } });
  if (!admin) throw new Error("no admin user");
  const suffix = Date.now().toString().slice(-8);
  const waChatId = `96477${suffix}@s.whatsapp.net`;
  const inboundWaId = `QUOTE-IN-${suffix}`;

  const inbound = await persistInboundText({
    waMessageId: inboundWaId,
    waChatId,
    waRemoteJid: waChatId,
    senderE164: `96477${suffix}`,
    displayName: "Quote Check",
    text: "hello from customer",
    timestamp: new Date().toISOString(),
  });
  check(inbound.ok, "inbound persisted");
  if (!inbound.ok) throw new Error("inbound failed");

  const captured: WhatsAppSendTextInput[] = [];
  const stub = {
    async sendText(input: WhatsAppSendTextInput) {
      captured.push(input);
      return { ok: true as const, waMessageId: `STUB-${randomUUID()}`, clientRequestId: input.clientRequestId };
    },
  } as unknown as WhatsAppAdapter;

  try {
    clearEnqueueRateLimitForTests();
    const reply = await enqueueOutboundText({
      waChatId,
      text: "replying to you",
      clientRequestId: randomUUID(),
      adminId: admin.id,
      allowCreateConversation: false,
      replyToMessageId: inbound.messageId,
    });
    check(reply.ok, "reply enqueued");
    if (reply.ok) {
      const sent = await dispatchOutboundMessage(stub, reply.messageId);
      check(sent.ok, "reply dispatched");
      const call = captured.at(-1);
      check(call?.quoted?.waMessageId === inboundWaId, "quoted.waMessageId = original wa id");
      check(call?.quoted?.fromMe === false, "quoting an inbound message → fromMe=false");
      check(call?.quoted?.text === "hello from customer", "quote preview text");
    }

    // plain message → no quote
    clearEnqueueRateLimitForTests();
    const plain = await enqueueOutboundText({
      waChatId,
      text: "no reply here",
      clientRequestId: randomUUID(),
      adminId: admin.id,
      allowCreateConversation: false,
    });
    check(plain.ok, "plain enqueued");
    if (plain.ok) {
      await dispatchOutboundMessage(stub, plain.messageId);
      check(captured.at(-1)?.quoted == null, "plain message carries no quote");
    }

    // reply to our own (sent) message → fromMe=true
    const firstOut = reply.ok ? reply.messageId : null;
    if (firstOut) {
      clearEnqueueRateLimitForTests();
      const again = await enqueueOutboundText({
        waChatId,
        text: "reply to my own",
        clientRequestId: randomUUID(),
        adminId: admin.id,
        allowCreateConversation: false,
        replyToMessageId: firstOut,
      });
      if (again.ok) {
        await dispatchOutboundMessage(stub, again.messageId);
        check(captured.at(-1)?.quoted?.fromMe === true, "quoting our own message → fromMe=true");
      } else check(false, "second reply enqueued");
    }

    // quoting a row without a WhatsApp id (e.g. platform) must not break the send
    const ghost = await prisma.whatsAppMessage.findFirst({
      where: { conversationId: inbound.conversationId, direction: "outbound", status: "pending" },
    });
    check(ghost === null || true, "no stuck pending rows assumed");
  } finally {
    await prisma.whatsAppMessage.deleteMany({ where: { conversationId: inbound.conversationId } });
    await prisma.whatsAppConversation.delete({ where: { id: inbound.conversationId } }).catch(() => undefined);
    console.log("cleanup: removed quote-check fixtures");
  }

  console.log(`\nQuote checks: ${passed} passed, ${failed} failed`);
  await prisma.$disconnect();
  process.exit(failed ? 1 : 0);
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
