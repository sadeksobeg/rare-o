import { prisma } from "@/lib/db/prisma";
import {
  getTraderConversation,
  sendTraderPlatformMessage,
} from "@/lib/whatsapp/messaging/trader-channel";

async function main() {
  const stamp = Date.now();
  const hash =
    "$2a$10$abcdefghijklmnopqrstuuABCDEFGHIJKLMNOPQRSTUVWXYZ012345";
  const phone = `9665${String(stamp).slice(-8)}`;
  const tA = await prisma.traderAccount.create({
    data: {
      email: `audit2-a-${stamp}@rareoud.local`,
      passwordHash: hash,
      displayName: "A",
      phone,
      mustChangePassword: false,
    },
  });
  const tS = await prisma.traderAccount.create({
    data: {
      email: `audit2-s-${stamp}@rareoud.local`,
      passwordHash: hash,
      displayName: "S",
      phone,
      mustChangePassword: false,
    },
  });
  const a1 = await sendTraderPlatformMessage({
    traderId: tA.id,
    text: `from-A-${stamp}`,
  });
  const s1 = await sendTraderPlatformMessage({
    traderId: tS.id,
    text: `from-S-${stamp}`,
  });
  const convA = await prisma.whatsAppConversation.findFirst({
    where: { traderId: tA.id },
    include: { messages: true },
  });
  const convSlink = await prisma.whatsAppConversation.findFirst({
    where: { traderId: tS.id },
  });
  const viewA = await getTraderConversation(tA.id);
  const viewS = await getTraderConversation(tS.id);
  const bodies = (convA?.messages || []).map((m) => m.body);
  console.log(
    JSON.stringify(
      {
        a1,
        s1,
        convAId: convA?.id,
        convSlink,
        viewA_n: viewA?.messages.length,
        viewS,
        bodies,
        pollution: bodies.some((b) => b.includes("from-S")),
      },
      null,
      2
    )
  );
  const ids = [tA.id, tS.id];
  const cids = (
    await prisma.whatsAppConversation.findMany({
      where: { traderId: { in: ids } },
      select: { id: true },
    })
  ).map((c) => c.id);
  if (cids.length) {
    await prisma.whatsAppMessage.deleteMany({
      where: { conversationId: { in: cids } },
    });
    await prisma.whatsAppConversation.deleteMany({ where: { id: { in: cids } } });
  }
  await prisma.traderAccount.deleteMany({ where: { id: { in: ids } } });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
