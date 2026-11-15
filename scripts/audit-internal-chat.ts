/**
 * Internal chat ↔ WhatsApp — local audit probe (additive synthetic rows, cleaned up).
 * No WhatsApp send. No migrations.
 *   npx tsx scripts/audit-internal-chat.ts
 */
import { writeFileSync, mkdirSync } from "node:fs";
import path from "node:path";
import { prisma } from "@/lib/db/prisma";
import {
  getTraderConversation,
  getTraderUnreadCount,
  markTraderMessagesRead,
  sendAdminPlatformMessage,
  sendTraderPlatformMessage,
} from "@/lib/whatsapp/messaging/trader-channel";

type Finding = {
  id: string;
  severity: "P0" | "P1" | "P2";
  status: "WORKS" | "PARTIAL" | "BROKEN" | "MISSING";
  evidence: string;
};

const findings: Finding[] = [];
function note(
  id: string,
  severity: Finding["severity"],
  status: Finding["status"],
  evidence: string
) {
  findings.push({ id, severity, status, evidence });
  console.log(`[${severity}] ${status} ${id}: ${evidence}`);
}

async function main() {
  const admin = await prisma.adminUser.findFirst({ select: { id: true, email: true } });
  if (!admin) throw new Error("NO_ADMIN");

  const channelCounts = await prisma.whatsAppMessage.groupBy({
    by: ["channel"],
    _count: { _all: true },
  });
  note("inventory.channels", "P2", "WORKS", JSON.stringify(channelCounts));

  const multi = (
    await prisma.whatsAppConversation.groupBy({
      by: ["traderId"],
      where: { traderId: { not: null } },
      _count: { _all: true },
    })
  ).filter((r) => r._count._all > 1);
  note(
    "schema.traderId_not_unique",
    multi.length ? "P0" : "P2",
    multi.length ? "BROKEN" : "PARTIAL",
    `multiLinkedTraders=${multi.length} (column allows many conversations per trader)`
  );

  note(
    "realtime.admin_sse_platform",
    "P1",
    "BROKEN",
    "trader-channel sends never call publishInboxEvent — admin SSE will not refresh on portal traffic"
  );
  note(
    "realtime.trader",
    "P1",
    "MISSING",
    "no EventSource/polling on /trader/messages; SSR + revalidatePath on own send only"
  );
  note(
    "ui.fallback_notice",
    "P1",
    "MISSING",
    "platformFallbackNotice in dictionaries but unused in components"
  );
  note(
    "media.trader_route",
    "P1",
    "BROKEN",
    "/api/media/whatsapp is admin-session only; trader bubbles with mediaUrl will 404"
  );
  note(
    "composer.trader_attachments",
    "P2",
    "MISSING",
    "text-only composer by design"
  );
  note(
    "composer.admin_media_when_outbound_off",
    "P1",
    "BROKEN",
    "media action returns OUTBOUND_DISABLED; text has platform fallback"
  );
  note(
    "security.trader_send_rate_limit",
    "P1",
    "MISSING",
    "no rate limit on traderSendMessageAction"
  );

  const stamp = Date.now();
  const hash =
    "$2a$10$abcdefghijklmnopqrstuuABCDEFGHIJKLMNOPQRSTUVWXYZ012345"; // placeholder — login not used

  const tA = await prisma.traderAccount.create({
    data: {
      email: `audit-a-${stamp}@rareoud.local`,
      passwordHash: hash,
      displayName: `Audit A ${stamp}`,
      phone: `9665${String(stamp).slice(-8)}`,
      mustChangePassword: false,
    },
  });
  const tB = await prisma.traderAccount.create({
    data: {
      email: `audit-b-${stamp}@rareoud.local`,
      passwordHash: hash,
      displayName: `Audit B ${stamp}`,
      phone: `9665${String(stamp + 7).slice(-8)}`,
      mustChangePassword: false,
    },
  });
  const tSteal = await prisma.traderAccount.create({
    data: {
      email: `audit-steal-${stamp}@rareoud.local`,
      passwordHash: hash,
      displayName: `Audit Steal ${stamp}`,
      phone: tA.phone,
      mustChangePassword: false,
    },
  });

  const s1 = await sendTraderPlatformMessage({
    traderId: tA.id,
    text: `audit-portal-hello-${stamp}`,
  });
  const convA1 = await getTraderConversation(tA.id);
  const rowA = await prisma.whatsAppConversation.findFirst({
    where: { traderId: tA.id },
  });
  if (!rowA) throw new Error("no conv A");

  // Seed an admin-only note — must never appear in trader view DTO
  await prisma.whatsAppConversationNote.create({
    data: {
      conversationId: rowA.id,
      authorAdminId: admin.id,
      authorName: "Audit Admin",
      body: `SECRET_NOTE_${stamp}`,
    },
  });

  const adminReply = await sendAdminPlatformMessage({
    conversationId: rowA.id,
    adminId: admin.id,
    text: `audit-admin-reply-${stamp}`,
  });
  const unreadBefore = await getTraderUnreadCount(tA.id);
  await markTraderMessagesRead(tA.id);
  const unreadAfter = await getTraderUnreadCount(tA.id);
  const convA2 = await getTraderConversation(tA.id);

  const traderDtoHasNote = JSON.stringify(convA2).includes(`SECRET_NOTE_${stamp}`);
  const traderDtoHasE164 = Boolean(
    convA2 && JSON.stringify(convA2).includes(String(rowA.participantE164 || "___none___"))
  );

  note(
    "e2e.db_roundtrip",
    s1.ok && adminReply.ok && unreadBefore >= 1 && unreadAfter === 0 ? "P2" : "P0",
    s1.ok && adminReply.ok && unreadAfter === 0 ? "WORKS" : "BROKEN",
    JSON.stringify({
      s1,
      adminReply,
      unreadBefore,
      unreadAfter,
      n: convA2?.messages.length,
      channels: [...new Set(convA2?.messages.map((m) => m.channel) || [])],
      waChatId: rowA.waChatId,
    })
  );
  note(
    "security.note_not_in_trader_dto",
    traderDtoHasNote ? "P0" : "P2",
    traderDtoHasNote ? "BROKEN" : "WORKS",
    `secretNoteLeakedInGetTraderConversation=${traderDtoHasNote}`
  );
  note(
    "security.phone_fields_in_trader_dto",
    "P2",
    traderDtoHasE164 ? "PARTIAL" : "WORKS",
    `participantE164_in_dto=${traderDtoHasE164} (DTO is messages-only by design)`
  );

  const leakB = await getTraderConversation(tB.id);
  const cross = Boolean(
    leakB?.messages.some((m) => m.body.includes(`audit-portal-hello-${stamp}`))
  );
  note(
    "security.cross_tenant_read",
    cross ? "P0" : "P2",
    cross ? "BROKEN" : "WORKS",
    `B_saw_A=${cross}`
  );

  const stealSend = await sendTraderPlatformMessage({
    traderId: tSteal.id,
    text: `audit-steal-${stamp}`,
  });
  const stealConv = await getTraderConversation(tSteal.id);
  const aAfter = await getTraderConversation(tA.id);
  const shared =
    stealConv?.conversationId &&
    aAfter?.conversationId &&
    stealConv.conversationId === aAfter.conversationId;
  note(
    "security.same_phone_merges_thread",
    shared ? "P0" : "P1",
    shared ? "BROKEN" : "WORKS",
    JSON.stringify({
      shared,
      stealSend,
      a: aAfter?.conversationId,
      steal: stealConv?.conversationId,
    })
  );

  // Mixed channel ordering: add a fake whatsapp-channel row into A's thread
  if (aAfter?.conversationId) {
    await prisma.whatsAppMessage.create({
      data: {
        conversationId: aAfter.conversationId,
        direction: "inbound",
        channel: "whatsapp",
        messageType: "text",
        body: `audit-wa-inbound-${stamp}`,
        status: "received",
        waTimestamp: new Date(),
        waMessageId: `audit-wa-${stamp}`,
      },
    });
    const mixed = await getTraderConversation(tA.id);
    const order = mixed?.messages.map((m) => m.channel) || [];
    note(
      "e2e.mixed_channel_labels",
      "P2",
      mixed && order.includes("whatsapp") && order.includes("platform")
        ? "WORKS"
        : "PARTIAL",
      `channelsInOrder=${JSON.stringify(order)}`
    );
  }

  // Cleanup
  const synthIds = [tA.id, tB.id, tSteal.id];
  const convs = await prisma.whatsAppConversation.findMany({
    where: { OR: [{ traderId: { in: synthIds } }, { waChatId: { contains: String(stamp) } }] },
    select: { id: true },
  });
  // Also find by trader link
  const convIds = [
    ...new Set(
      (
        await prisma.whatsAppConversation.findMany({
          where: { traderId: { in: synthIds } },
          select: { id: true },
        })
      ).map((c) => c.id)
    ),
  ];
  void convs;
  if (convIds.length) {
    await prisma.whatsAppMessage.deleteMany({ where: { conversationId: { in: convIds } } });
    await prisma.whatsAppConversationNote.deleteMany({
      where: { conversationId: { in: convIds } },
    });
    await prisma.whatsAppConversation.deleteMany({ where: { id: { in: convIds } } });
  }
  await prisma.traderAccount.deleteMany({ where: { id: { in: synthIds } } });

  const out = path.join("docs", "ui", "wa-v", "INTERNAL-CHAT-AUDIT-RAW.json");
  mkdirSync(path.dirname(out), { recursive: true });
  writeFileSync(
    out,
    JSON.stringify({ at: new Date().toISOString(), findings }, null, 2)
  );
  console.log(`wrote ${out}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
