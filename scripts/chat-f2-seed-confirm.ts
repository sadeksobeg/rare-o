/**
 * Seed an unlinked WA thread that would merge into Demo Trader on manual link.
 *   npx tsx scripts/chat-f2-seed-confirm.ts
 */
import { prisma } from "@/lib/db/prisma";
import { ensureTraderConversation } from "@/lib/whatsapp/messaging/trader-channel";

const traderEmail = process.env.TRADER_EMAIL || "trader@rareoud.local";
const stamp = Date.now();

async function main() {
  const trader = await prisma.traderAccount.findUnique({
    where: { email: traderEmail },
    select: { id: true, phone: true, displayName: true },
  });
  if (!trader) throw new Error("demo trader missing");
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

  // Ensure this E.164 is unique so «ربط كتاجر» appears (shared-phone hides the button).
  const others = await prisma.traderAccount.findMany({
    where: { id: { not: trader.id } },
    select: { id: true, phone: true },
  });
  for (const o of others) {
    const p = (o.phone || "").replace(/\D/g, "");
    if (p && p === e164) {
      await prisma.traderAccount.update({
        where: { id: o.id },
        data: { phone: `+9665${String(stamp).slice(-8)}` },
      });
    }
  }

  // Ensure trader already owns at least one conversation.
  const ens = await ensureTraderConversation(trader.id);
  await prisma.whatsAppMessage.create({
    data: {
      conversationId: ens.id,
      direction: "outbound",
      channel: "platform",
      body: `confirm-seed owned ${stamp}`,
      status: "sent",
    },
  });

  // Unlinked inbound with same phone — linking as trader will merge.
  await prisma.whatsAppConversation.deleteMany({
    where: { tags: { has: "f2-confirm-orphan" } },
  });
  const unlinked = await prisma.whatsAppConversation.create({
    data: {
      waChatId: `confirm${String(stamp).slice(-10)}@lid`,
      remoteJid: `confirm${String(stamp).slice(-10)}@lid`,
      participantE164: e164,
      displayName: "F2 Confirm Orphan",
      tags: ["f2-confirm-orphan"],
    },
  });
  await prisma.whatsAppMessage.createMany({
    data: [
      {
        conversationId: unlinked.id,
        direction: "inbound",
        channel: "whatsapp",
        body: `confirm orphan A ${stamp}`,
        status: "received",
      },
      {
        conversationId: unlinked.id,
        direction: "inbound",
        channel: "whatsapp",
        body: `confirm orphan B ${stamp}`,
        status: "received",
      },
    ],
  });

  console.log(
    JSON.stringify({
      ok: true,
      traderId: trader.id,
      ownedConversationId: ens.id,
      unlinkedConversationId: unlinked.id,
      e164,
      stamp,
    })
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
