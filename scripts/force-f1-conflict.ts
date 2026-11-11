import { prisma } from "@/lib/db/prisma";
import {
  ensureTraderConversation,
  PHONE_CONFLICT_TAG,
} from "@/lib/whatsapp/messaging/trader-channel";
import { normalizeUserJid, toE164Digits } from "@/lib/whatsapp/jid";

async function main() {
  const a = await prisma.traderAccount.findUnique({
    where: { email: "trader@rareoud.local" },
    select: { id: true, phone: true, passwordHash: true, displayName: true },
  });
  if (!a) throw new Error("trader missing");
  const phone = "+966500099988";
  await prisma.traderAccount.update({
    where: { id: a.id },
    data: { phone },
  });

  const jid = normalizeUserJid(phone);
  if (!jid) throw new Error("jid failed");

  // Ensure a phone-JID conversation owned by A (claim / create)
  let aPhoneConv = await prisma.whatsAppConversation.findUnique({
    where: { waChatId: jid },
    select: { id: true, traderId: true },
  });
  if (!aPhoneConv) {
    aPhoneConv = await prisma.whatsAppConversation.create({
      data: {
        waChatId: jid,
        remoteJid: jid,
        participantE164: toE164Digits(phone),
        displayName: a.displayName,
        traderId: a.id,
        unreadCount: 0,
        lastMessagePreview: "fixture phone jid",
        tags: [],
      },
      select: { id: true, traderId: true },
    });
  } else if (aPhoneConv.traderId !== a.id) {
    await prisma.whatsAppConversation.update({
      where: { id: aPhoneConv.id },
      data: { traderId: a.id, participantE164: toE164Digits(phone) },
    });
  }

  let b = await prisma.traderAccount.findFirst({
    where: { email: "f1-conflict@rareoud.local" },
    select: { id: true },
  });
  if (!b) {
    b = await prisma.traderAccount.create({
      data: {
        email: "f1-conflict@rareoud.local",
        passwordHash: a.passwordHash,
        displayName: "تعارض هاتف",
        phone,
        status: "active",
        mustChangePassword: false,
      },
      select: { id: true },
    });
  } else {
    await prisma.traderAccount.update({
      where: { id: b.id },
      data: { phone },
    });
  }

  // Wipe B threads so ensure hits conflict path against A's phone JID
  const bConvs = await prisma.whatsAppConversation.findMany({
    where: { traderId: b.id },
    select: { id: true },
  });
  const ids = bConvs.map((c) => c.id);
  if (ids.length) {
    await prisma.whatsAppMessage.deleteMany({
      where: { conversationId: { in: ids } },
    });
    await prisma.whatsAppConversationNote.deleteMany({
      where: { conversationId: { in: ids } },
    });
    await prisma.whatsAppConversation.deleteMany({ where: { id: { in: ids } } });
  }

  const conflict = await ensureTraderConversation(b.id);
  const tagged = await prisma.whatsAppConversation.findMany({
    where: { tags: { has: PHONE_CONFLICT_TAG } },
    select: { id: true, traderId: true },
  });
  console.log(
    JSON.stringify({
      aPhoneConversationId: aPhoneConv.id,
      conflictConversationId: conflict.id,
      phoneConflict: conflict.phoneConflict,
      taggedCount: tagged.length,
      taggedIds: tagged.map((t) => t.id),
    })
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
