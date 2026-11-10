/**
 * One-shot: clear participantE164 values that are LID mirrors (not real phones).
 */
import { PrismaClient } from "@prisma/client";
import { isE164LikelyLidMirror } from "../lib/whatsapp/jid";

async function main() {
  const prisma = new PrismaClient();
  try {
    const rows = await prisma.whatsAppConversation.findMany({
      select: { id: true, waChatId: true, participantE164: true },
    });
    let cleared = 0;
    for (const row of rows) {
      if (!isE164LikelyLidMirror(row.participantE164, row.waChatId)) continue;
      await prisma.whatsAppConversation.update({
        where: { id: row.id },
        data: { participantE164: null },
      });
      cleared += 1;
    }
    console.log(`cleared_lid_phones=${cleared}`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
