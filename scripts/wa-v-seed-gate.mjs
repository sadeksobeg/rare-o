/**
 * Local-only seed for WA-V overlay gate:
 * - ensure a conversation with text + image messages
 * - copy a public brand asset into private WA storage with a valid storageKey
 * Writes docs/ui/wa-v/GATE-SEED.json with conversationId for the gate.
 * Does NOT enable real WhatsApp connect/outbound.
 */
import { PrismaClient } from "@prisma/client";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { randomBytes } from "node:crypto";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = path.join(ROOT, "docs/ui/wa-v");
const SRC = path.join(ROOT, "public", "brand", "mark-small.webp");

async function main() {
  if (!fs.existsSync(SRC)) throw new Error(`missing ${SRC}`);
  const prisma = new PrismaClient();

  let conv = await prisma.whatsAppConversation.findFirst({
    where: { displayName: "بوابة WA-V" },
  });
  if (!conv) {
    conv = await prisma.whatsAppConversation.create({
      data: {
        waChatId: "966500009999@s.whatsapp.net",
        remoteJid: "966500009999@s.whatsapp.net",
        participantE164: "966500009999",
        displayName: "بوابة WA-V",
        lastMessagePreview: "صورة تجريبية",
        lastMessageAt: new Date(),
        unreadCount: 1,
        linkType: "none",
        linkId: null,
      },
    });
  }

  const textCount = await prisma.whatsAppMessage.count({
    where: { conversationId: conv.id, messageType: "text" },
  });
  if (textCount === 0) {
    await prisma.whatsAppMessage.createMany({
      data: [
        {
          conversationId: conv.id,
          direction: "inbound",
          messageType: "text",
          body: "مرحبا، أود الاستفسار عن عود نادر",
          status: "received",
          waTimestamp: new Date(Date.now() - 3600_000),
        },
        {
          conversationId: conv.id,
          direction: "outbound",
          messageType: "text",
          body: "أهلاً بك — سنراجع الطلب ونعود إليك.",
          status: "sent",
          waTimestamp: new Date(Date.now() - 1800_000),
          clientRequestId: `gate-seed-${Date.now()}`,
          adminId: "seed",
        },
      ],
    });
  }

  const imageMsg = await prisma.whatsAppMessage.findFirst({
    where: {
      conversationId: conv.id,
      messageType: "image",
      caption: "لقطة بوابة — صورة تجريبية",
    },
  });
  if (!imageMsg) {
    const fileName = `${Date.now()}-${randomBytes(6).toString("hex")}.webp`;
    const dir = path.join(ROOT, "storage", "uploads", "whatsapp", conv.id);
    fs.mkdirSync(dir, { recursive: true });
    const dest = path.join(dir, fileName);
    fs.copyFileSync(SRC, dest);
    const storageKey = `${conv.id}/${fileName}`;
    await prisma.whatsAppMessage.create({
      data: {
        conversationId: conv.id,
        direction: "inbound",
        messageType: "image",
        body: "",
        caption: "لقطة بوابة — صورة تجريبية",
        status: "received",
        waTimestamp: new Date(),
        storageKey,
        thumbnailKey: storageKey,
        mediaFileName: "gate-seed.webp",
        mediaMime: "image/webp",
        mediaSize: fs.statSync(dest).size,
      },
    });
    console.log("seeded image", storageKey);
  }

  await prisma.whatsAppConversation.update({
    where: { id: conv.id },
    data: {
      lastMessagePreview: "صورة تجريبية",
      lastMessageAt: new Date(),
      unreadCount: 1,
    },
  });

  fs.mkdirSync(OUT, { recursive: true });
  const meta = { conversationId: conv.id, displayName: "بوابة WA-V" };
  fs.writeFileSync(path.join(OUT, "GATE-SEED.json"), JSON.stringify(meta, null, 2));
  console.log(JSON.stringify(meta));
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
