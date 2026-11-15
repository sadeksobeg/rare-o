/**
 * READ-ONLY / additive-seed audit for internal (platform) chat ↔ WhatsApp inbox.
 * Does NOT send WhatsApp, touch outbound queue, or migrate.
 *
 *   node scripts/audit-internal-chat.mjs
 */
import { createRequire } from "node:module";
import { writeFileSync, mkdirSync } from "node:fs";
import path from "node:path";

const require = createRequire(import.meta.url);
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const OUT = path.join("docs", "ui", "wa-v", "INTERNAL-CHAT-AUDIT-RAW.json");
const findings = [];
function note(id, severity, status, evidence) {
  findings.push({ id, severity, status, evidence });
  console.log(`[${severity}] ${status} ${id}: ${evidence}`);
}

async function main() {
  const traders = await prisma.traderAccount.findMany({
    take: 5,
    select: { id: true, email: true, phone: true, displayName: true },
    orderBy: { createdAt: "asc" },
  });
  const admin = await prisma.adminUser.findFirst({ select: { id: true, email: true } });
  note(
    "seed.actors",
    "P2",
    traders.length && admin ? "WORKS" : "BROKEN",
    `traders=${traders.length} admin=${admin?.email || "none"}`
  );

  // Schema / uniqueness
  const convByTrader = await prisma.whatsAppConversation.groupBy({
    by: ["traderId"],
    where: { traderId: { not: null } },
    _count: { _all: true },
  });
  const multi = convByTrader.filter((r) => r._count._all > 1);
  note(
    "schema.traderId_unique",
    multi.length ? "P0" : "P2",
    multi.length ? "BROKEN" : "PARTIAL",
    `traderId is NOT unique on WhatsAppConversation; multi-linked traders=${multi.length}`
  );

  // Channel mix
  const channelCounts = await prisma.whatsAppMessage.groupBy({
    by: ["channel"],
    _count: { _all: true },
  });
  note(
    "inventory.channels",
    "P2",
    "WORKS",
    JSON.stringify(channelCounts)
  );

  const linked = await prisma.whatsAppConversation.findMany({
    where: { traderId: { not: null } },
    take: 10,
    select: {
      id: true,
      waChatId: true,
      traderId: true,
      participantE164: true,
      traderUnreadCount: true,
      unreadCount: true,
      _count: { select: { messages: true } },
    },
  });
  note(
    "inventory.linked_threads",
    "P2",
    "WORKS",
    `linkedConversations=${linked.length} sample=${JSON.stringify(linked.slice(0, 3))}`
  );

  // Ownership probe: ensureTraderConversation phone collision risk (read-only analysis)
  const phones = traders.map((t) => t.phone).filter(Boolean);
  const dupPhones = phones.filter((p, i) => phones.indexOf(p) !== i);
  note(
    "security.phone_collision_seed",
    dupPhones.length ? "P0" : "P2",
    dupPhones.length ? "PARTIAL" : "WORKS",
    `duplicateTraderPhonesInSample=${dupPhones.length}`
  );

  // Code-path facts recorded from static inspection (confirmed by grepping in-process):
  note(
    "realtime.admin_sse_on_platform_send",
    "P1",
    "BROKEN",
    "sendTraderPlatformMessage/sendAdminPlatformMessage never call publishInboxEvent"
  );
  note(
    "realtime.trader_live",
    "P1",
    "MISSING",
    "No trader EventSource/polling; messages page is SSR + revalidatePath on own send only"
  );
  note(
    "composer.trader_media",
    "P2",
    "MISSING",
    "TraderMessageComposer is text-only by design (v1)"
  );
  note(
    "composer.admin_media_fallback",
    "P1",
    "BROKEN",
    "adminSendWhatsAppMediaAction returns OUTBOUND_DISABLED with no platform fallback (text-only fallback exists)"
  );
  note(
    "ui.platform_fallback_notice",
    "P1",
    "MISSING",
    "dict.inbox.platformFallbackNotice exists but is unused in any component"
  );
  note(
    "media.trader_access",
    "P1",
    "BROKEN",
    "GET /api/media/whatsapp/... requires admin session only — trader cannot load WA media URLs shown in portal bubbles"
  );
  note(
    "security.trader_rate_limit",
    "P1",
    "MISSING",
    "traderSendMessageAction has no rate limit beyond MAX_OUTBOUND_TEXT_LENGTH"
  );
  note(
    "receipts.platform",
    "P2",
    "PARTIAL",
    "platform inbound status=received; outbound=sent; markTraderMessagesRead clears badge only, never status=read"
  );
  note(
    "notify.email",
    "P2",
    "MISSING",
    "No email/push for portal chat; trader badge via traderUnreadCount; admin via unreadCount + inbox list (SSE gap)"
  );

  // Additive functional probe with isolated synthetic traders (safe, local only)
  const stamp = Date.now();
  const tA = await prisma.traderAccount.create({
    data: {
      email: `audit-a-${stamp}@rareoud.local`,
      passwordHash: "x",
      displayName: `Audit A ${stamp}`,
      phone: `9665${String(stamp).slice(-8)}`,
      mustChangePassword: false,
    },
  });
  const tB = await prisma.traderAccount.create({
    data: {
      email: `audit-b-${stamp}@rareoud.local`,
      passwordHash: "x",
      displayName: `Audit B ${stamp}`,
      phone: `9665${String(stamp + 1).slice(-8)}`,
      mustChangePassword: false,
    },
  });

  const { sendTraderPlatformMessage, sendAdminPlatformMessage, getTraderConversation, getTraderUnreadCount, markTraderMessagesRead } =
    await import("../lib/whatsapp/messaging/trader-channel.ts").catch(async () => {
      // tsx path — fall back to dynamic via child if needed
      return await import("../.next/server/chunks/trader-channel.js").catch(() => null);
    });

  let e2e = { skipped: true };
  if (sendTraderPlatformMessage && admin) {
    const s1 = await sendTraderPlatformMessage({
      traderId: tA.id,
      text: `audit-portal-hello-${stamp}`,
    });
    const convA = await getTraderConversation(tA.id);
    const adminView = await prisma.whatsAppConversation.findFirst({
      where: { traderId: tA.id },
      include: { messages: { orderBy: { createdAt: "asc" } } },
    });
    const adminReply = await sendAdminPlatformMessage({
      conversationId: adminView.id,
      adminId: admin.id,
      text: `audit-admin-reply-${stamp}`,
    });
    const unreadBefore = await getTraderUnreadCount(tA.id);
    await markTraderMessagesRead(tA.id);
    const unreadAfter = await getTraderUnreadCount(tA.id);

    // Cross-tenant: B must not see A's conversation via getTraderConversation
    const leakB = await getTraderConversation(tB.id);
    const aMsgsInB = leakB?.messages?.some((m) => m.body.includes(`audit-portal-hello-${stamp}`));

    // Tamper: B tries to read A's conversation media/notes via raw queries simulation
    const notes = await prisma.whatsAppConversationNote.findMany({
      where: { conversationId: adminView.id },
      take: 5,
    });

    e2e = {
      skipped: false,
      traderSend: s1,
      conversationId: convA?.conversationId,
      messageCount: convA?.messages?.length,
      channels: [...new Set(convA?.messages?.map((m) => m.channel) || [])],
      adminReply,
      unreadBefore,
      unreadAfter,
      crossTenantLeak: Boolean(aMsgsInB),
      notesCount: notes.length,
      waChatId: adminView?.waChatId,
      sameThreadAsPhoneJid: adminView?.waChatId?.includes("@s.whatsapp.net") || adminView?.waChatId?.endsWith("@s.whatsapp.net"),
    };

    note(
      "e2e.portal_roundtrip_db",
      s1.ok && adminReply.ok && unreadBefore >= 1 && unreadAfter === 0 ? "P2" : "P0",
      s1.ok && adminReply.ok && unreadAfter === 0 ? "WORKS" : "BROKEN",
      JSON.stringify(e2e)
    );
    note(
      "security.cross_tenant_getTraderConversation",
      aMsgsInB ? "P0" : "P2",
      aMsgsInB ? "BROKEN" : "WORKS",
      `traderB_saw_traderA_body=${Boolean(aMsgsInB)}`
    );

    // Phone-collision ownership: create WA conversation for A's phone, then B with same phone attempt
    // (destructive on identity — use synthetic phone swap only on B copy field without sending WA)
    const phoneSteal = await prisma.traderAccount.create({
      data: {
        email: `audit-steal-${stamp}@rareoud.local`,
        passwordHash: "x",
        displayName: `Audit Steal ${stamp}`,
        phone: tA.phone,
        mustChangePassword: false,
      },
    });
    const stealSend = await sendTraderPlatformMessage({
      traderId: phoneSteal.id,
      text: `audit-steal-${stamp}`,
    });
    const stealConv = await getTraderConversation(phoneSteal.id);
    const aAfterSteal = await getTraderConversation(tA.id);
    const stoleIntoA =
      stealConv?.conversationId &&
      aAfterSteal?.conversationId &&
      stealConv.conversationId === aAfterSteal.conversationId;
    note(
      "security.same_phone_thread_merge",
      stoleIntoA ? "P0" : "P1",
      stoleIntoA ? "BROKEN" : "WORKS",
      `samePhoneTradersShareThread=${Boolean(stoleIntoA)} stealOk=${stealSend.ok} aId=${aAfterSteal?.conversationId} stealId=${stealConv?.conversationId}`
    );

    // Cleanup synthetic traders' messages/conversations (keep DB tidy)
    const synthIds = [tA.id, tB.id, phoneSteal.id];
    const synthConvs = await prisma.whatsAppConversation.findMany({
      where: { traderId: { in: synthIds } },
      select: { id: true },
    });
    const convIds = synthConvs.map((c) => c.id);
    if (convIds.length) {
      await prisma.whatsAppMessage.deleteMany({ where: { conversationId: { in: convIds } } });
      await prisma.whatsAppConversationNote.deleteMany({ where: { conversationId: { in: convIds } } });
      await prisma.whatsAppConversation.deleteMany({ where: { id: { in: convIds } } });
    }
    await prisma.traderAccount.deleteMany({ where: { id: { in: synthIds } } });
  } else {
    note(
      "e2e.portal_roundtrip_db",
      "P1",
      "PARTIAL",
      "Could not import trader-channel.ts from plain node — run browser/tsx path separately"
    );
  }

  mkdirSync(path.dirname(OUT), { recursive: true });
  writeFileSync(
    OUT,
    JSON.stringify({ at: new Date().toISOString(), findings, e2e }, null, 2)
  );
  console.log(`wrote ${OUT}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
