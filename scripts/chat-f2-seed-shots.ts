/**
 * Seed local fake data for CHAT-F2 feature shots (not prod).
 *   npx tsx scripts/chat-f2-seed-shots.ts
 */
import { prisma } from "@/lib/db/prisma";
import {
  ensureTraderConversation,
  sendAdminPlatformMessage,
  sendTraderPlatformMessage,
} from "@/lib/whatsapp/messaging/trader-channel";
import { unifyTraderConversations } from "@/lib/whatsapp/messaging/trader-unify";
import { resetTraderSendRateLimitForTests } from "@/lib/whatsapp/messaging/trader-send-rate-limit";

const traderEmail = process.env.TRADER_EMAIL || "trader@rareoud.local";
const stamp = Date.now();

async function main() {
  resetTraderSendRateLimitForTests();
  const trader = await prisma.traderAccount.findUnique({
    where: { email: traderEmail },
    select: { id: true, phone: true, passwordHash: true, displayName: true },
  });
  if (!trader) throw new Error("demo trader missing");
  const admin = await prisma.adminUser.findFirst({ select: { id: true } });
  if (!admin) throw new Error("admin missing");

  const phone =
    trader.phone && trader.phone.replace(/\D/g, "").length >= 8
      ? trader.phone
      : "+966500099988";
  if (!trader.phone || trader.phone.replace(/\D/g, "").length < 8) {
    await prisma.traderAccount.update({
      where: { id: trader.id },
      data: { phone },
    });
  }
  const e164 = phone.replace(/\D/g, "");

  // Wipe prior F2 shot threads for this trader + any leftover phone JID row.
  await prisma.whatsAppConversation.deleteMany({
    where: {
      OR: [
        { traderId: trader.id },
        { waChatId: `${e164}@s.whatsapp.net` },
        { waChatId: `trader-${trader.id}@platform.local` },
        { tags: { has: "f2-shot" } },
        { tags: { has: "f2-lid" } },
        { tags: { has: "f2-phone" } },
        { tags: { has: "f2-empty-orphan" } },
      ],
    },
  });

  // Platform shell + WhatsApp LID inbound (will unify → phone JID primary via ensure).
  const platform = await prisma.whatsAppConversation.create({
    data: {
      waChatId: `trader-${trader.id}@platform.local`,
      remoteJid: `trader-${trader.id}@platform.local`,
      displayName: trader.displayName || "Demo Trader",
      traderId: trader.id,
      tags: ["f2-shot"],
    },
  });
  const lid = await prisma.whatsAppConversation.create({
    data: {
      waChatId: `1913${String(stamp).slice(-10)}@lid`,
      remoteJid: `1913${String(stamp).slice(-10)}@lid`,
      participantE164: e164,
      displayName: trader.displayName || "Demo Trader",
      traderId: trader.id,
      tags: ["f2-lid"],
    },
  });
  const phoneJid = await prisma.whatsAppConversation.create({
    data: {
      waChatId: `${e164}@s.whatsapp.net`,
      remoteJid: `${e164}@s.whatsapp.net`,
      participantE164: e164,
      displayName: trader.displayName || "Demo Trader",
      traderId: trader.id,
      tags: ["f2-phone"],
    },
  });

  const t0 = new Date(stamp - 120_000);
  const t1 = new Date(stamp - 90_000);
  const t2 = new Date(stamp - 60_000);
  const t3 = new Date(stamp - 30_000);

  await prisma.whatsAppMessage.createMany({
    data: [
      {
        conversationId: lid.id,
        direction: "inbound",
        channel: "whatsapp",
        body: `F2-WA وارد — مرحباً من واتساب ${stamp}`,
        status: "received",
        waTimestamp: t0,
        createdAt: t0,
      },
      {
        conversationId: platform.id,
        direction: "outbound",
        channel: "platform",
        body: `F2-PLAT رد منصة — قبل الدمج ${stamp}`,
        status: "sent",
        adminId: admin.id,
        waTimestamp: t1,
        createdAt: t1,
      },
      {
        conversationId: phoneJid.id,
        direction: "inbound",
        channel: "whatsapp",
        body: `F2-WA وارد على JID الهاتف ${stamp}`,
        status: "received",
        waTimestamp: t2,
        createdAt: t2,
      },
      {
        conversationId: platform.id,
        direction: "inbound",
        channel: "platform",
        body: `F2-PLAT رسالة تاجر عبر المنصة ${stamp}`,
        status: "received",
        waTimestamp: t3,
        createdAt: t3,
      },
    ],
  });

  const merged = await unifyTraderConversations(trader.id);
  if (!merged.ok || merged.dryRun) {
    throw new Error(`unify failed: ${JSON.stringify(merged)}`);
  }

  // Extra live platform send so trader portal composer path is warm.
  await sendTraderPlatformMessage({
    traderId: trader.id,
    text: `F2-PLAT بعد الدمج — تاجر ${stamp}`,
  });
  await sendAdminPlatformMessage({
    conversationId: merged.primaryId,
    adminId: admin.id,
    text: `F2-PLAT بعد الدمج — إدارة ${stamp}`,
  });

  // Empty-phone trader: platform only + orphan LID that must NOT auto-link.
  let empty = await prisma.traderAccount.findFirst({
    where: { email: "f2-empty@rareoud.local" },
    select: { id: true },
  });
  if (!empty) {
    empty = await prisma.traderAccount.create({
      data: {
        email: "f2-empty@rareoud.local",
        passwordHash: trader.passwordHash,
        displayName: "تاجر بلا هاتف",
        phone: "",
        status: "active",
        mustChangePassword: false,
      },
      select: { id: true },
    });
  } else {
    await prisma.traderAccount.update({
      where: { id: empty.id },
      data: { phone: "", displayName: "تاجر بلا هاتف", status: "active" },
    });
  }
  await prisma.whatsAppConversation.deleteMany({
    where: { traderId: empty.id },
  });
  const emptyEns = await ensureTraderConversation(empty.id);
  const emptyLid = await prisma.whatsAppConversation.create({
    data: {
      waChatId: `2888${String(stamp).slice(-10)}@lid`,
      remoteJid: `2888${String(stamp).slice(-10)}@lid`,
      displayName: "LID بلا ربط",
      participantE164: null,
      tags: ["f2-empty-orphan"],
    },
  });
  await prisma.whatsAppMessage.create({
    data: {
      conversationId: emptyLid.id,
      direction: "inbound",
      channel: "whatsapp",
      body: "وارد LID بلا تاجر — يجب أن يبقى منفصلاً",
      status: "received",
    },
  });
  await sendAdminPlatformMessage({
    conversationId: emptyEns.id,
    adminId: admin.id,
    text: `منصة فقط — تاجر بلا هاتف ${stamp}`,
  });

  const primary = await prisma.whatsAppConversation.findUnique({
    where: { id: merged.primaryId },
    select: {
      id: true,
      waChatId: true,
      _count: { select: { messages: true } },
    },
  });

  console.log(
    JSON.stringify({
      ok: true,
      stamp,
      mergedConversationId: merged.primaryId,
      mergedWaChatId: primary?.waChatId,
      mergedMessageCount: primary?._count.messages,
      emptyTraderId: empty.id,
      emptyPlatformConversationId: emptyEns.id,
      emptyOrphanLidId: emptyLid.id,
      traderEmail,
    })
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
