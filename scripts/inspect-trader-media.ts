import { prisma } from "@/lib/db/prisma";
import { getTraderConversation } from "@/lib/whatsapp/messaging/trader-channel";

async function main() {
  const t = await prisma.traderAccount.findUnique({
    where: { email: "trader@rareoud.local" },
    select: { id: true },
  });
  if (!t) throw new Error("no trader");
  const convs = await prisma.whatsAppConversation.findMany({
    where: { traderId: t.id },
    select: { id: true, waChatId: true, createdAt: true },
    orderBy: { createdAt: "asc" },
  });
  const v = await getTraderConversation(t.id);
  const media = (v?.messages ?? []).filter(
    (m) => m.messageType === "image" || m.whatsappMediaUnavailable
  );
  console.log(
    JSON.stringify(
      {
        convCount: convs.length,
        jidShapes: convs.map((c) => c.waChatId.split("@")[1] ?? c.waChatId),
        viewId: v?.conversationId,
        msgCount: v?.messages.length ?? 0,
        media: media.map((m) => ({
          type: m.messageType,
          ch: m.channel,
          unavail: Boolean(m.whatsappMediaUnavailable),
        })),
      },
      null,
      2
    )
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
