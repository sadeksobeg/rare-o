import { prisma } from "@/lib/db/prisma";
import {
  ensureTraderConversation,
  sendAdminPlatformMessage,
  sendTraderPlatformMessage,
} from "@/lib/whatsapp/messaging/trader-channel";
import { resetTraderSendRateLimitForTests } from "@/lib/whatsapp/messaging/trader-send-rate-limit";

const traderEmail = process.env.TRADER_EMAIL || "trader@rareoud.local";
const stamp = Date.now();

async function main() {
  resetTraderSendRateLimitForTests();
  const trader = await prisma.traderAccount.findUnique({
    where: { email: traderEmail },
    select: { id: true, phone: true, passwordHash: true },
  });
  if (!trader) throw new Error("trader missing");
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

  const ens = await ensureTraderConversation(trader.id);
  // Keep a single traderId conversation for the portal view (findFirst).
  const extras = await prisma.whatsAppConversation.findMany({
    where: { traderId: trader.id, NOT: { id: ens.id } },
    select: { id: true },
  });
  if (extras.length) {
    const xids = extras.map((e) => e.id);
    await prisma.whatsAppMessage.deleteMany({
      where: { conversationId: { in: xids } },
    });
    await prisma.whatsAppConversation.updateMany({
      where: { id: { in: xids } },
      data: { traderId: null },
    });
  }

  await sendTraderPlatformMessage({
    traderId: trader.id,
    text: `لقطة مالك — رسالة تاجر ${stamp}`,
  });
  await sendAdminPlatformMessage({
    conversationId: ens.id,
    adminId: admin.id,
    text: `لقطة مالك — رد منصة ${stamp}`,
  });

  await prisma.whatsAppMessage.create({
    data: {
      conversationId: ens.id,
      direction: "outbound",
      channel: "whatsapp",
      messageType: "image",
      body: "",
      caption: "مرفق تجريبي",
      storageKey: `${ens.id}/fake-wa-image.jpg`,
      mediaMime: "image/jpeg",
      mediaFileName: "fake-wa-image.jpg",
      status: "delivered",
      waTimestamp: new Date(),
    },
  });

  let conflictTrader = await prisma.traderAccount.findFirst({
    where: { email: "f1-conflict@rareoud.local" },
    select: { id: true },
  });
  if (!conflictTrader) {
    conflictTrader = await prisma.traderAccount.create({
      data: {
        email: "f1-conflict@rareoud.local",
        passwordHash: trader.passwordHash,
        displayName: "تعارض هاتف",
        phone,
        status: "active",
        mustChangePassword: false,
      },
      select: { id: true },
    });
  } else {
    await prisma.traderAccount.update({
      where: { id: conflictTrader.id },
      data: { phone, status: "active" },
    });
  }
  const conflict = await ensureTraderConversation(conflictTrader.id);

  console.log(
    JSON.stringify({
      ok: true,
      conversationId: ens.id,
      conflictConversationId: conflict.id,
      phoneConflict: conflict.phoneConflict,
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
