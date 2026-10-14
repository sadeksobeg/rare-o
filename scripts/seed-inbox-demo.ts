/**
 * Ensure at least one WhatsApp conversation exists for Slice E screenshots.
 * Does not touch worker/adapter — DB rows only.
 */
import { PrismaClient } from "@prisma/client";
import { randomUUID } from "node:crypto";

async function main() {
  const prisma = new PrismaClient();
  const count = await prisma.whatsAppConversation.count();
  console.log("conversations", count);
  if (count > 0) {
    const sample = await prisma.whatsAppConversation.findFirst({
      include: { messages: { take: 3, orderBy: { createdAt: "asc" } } },
    });
    console.log("sample", sample?.id, sample?.displayName, "msgs", sample?.messages.length);
    await prisma.$disconnect();
    return;
  }

  const conv = await prisma.whatsAppConversation.create({
    data: {
      waChatId: "966500000001@s.whatsapp.net",
      remoteJid: "966500000001@s.whatsapp.net",
      participantE164: "966500000001",
      displayName: "عميل تجريبي",
      lastMessagePreview: "مرحبا، أود الاستفسار عن عود",
      lastMessageAt: new Date(),
      unreadCount: 1,
      linkType: "none",
      linkId: null,
      messages: {
        create: [
          {
            direction: "inbound",
            messageType: "text",
            body: "مرحبا، أود الاستفسار عن عود نادر",
            status: "received",
            waTimestamp: new Date(Date.now() - 3600_000),
            clientRequestId: null,
          },
          {
            direction: "outbound",
            messageType: "text",
            body: "أهلاً بك — سنراجع الطلب ونعود إليك.",
            status: "sent",
            waTimestamp: new Date(Date.now() - 1800_000),
            clientRequestId: randomUUID(),
            adminId: "seed",
          },
          {
            direction: "inbound",
            messageType: "unsupported",
            body: "",
            status: "received",
            waTimestamp: new Date(Date.now() - 600_000),
            clientRequestId: null,
          },
        ],
      },
    },
  });

  await prisma.whatsAppConnectionHealth.upsert({
    where: { id: "default" },
    create: {
      id: "default",
      state: "AUTHENTICATION_REQUIRED",
      detailSafe: null,
    },
    update: { state: "AUTHENTICATION_REQUIRED" },
  });

  console.log("seeded conversation", conv.id);
  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  process.exit(1);
});
