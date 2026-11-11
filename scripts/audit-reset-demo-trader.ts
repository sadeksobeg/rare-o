/** Local-only: reset demo trader password for audit login. */
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db/prisma";

async function main() {
  const email = process.env.TRADER_EMAIL || "trader@rareoud.local";
  const password = process.env.TRADER_PASSWORD || "ChangeMeNow!";
  const passwordHash = await bcrypt.hash(password, 12);
  const row = await prisma.traderAccount.update({
    where: { email },
    data: { passwordHash, mustChangePassword: false, status: "active" },
    select: { id: true, email: true },
  });
  // cleanup leftover audit fixtures
  const orphans = await prisma.traderAccount.findMany({
    where: { email: { startsWith: "audit-" } },
    select: { id: true },
  });
  const ids = orphans.map((o) => o.id);
  if (ids.length) {
    const convs = await prisma.whatsAppConversation.findMany({
      where: { traderId: { in: ids } },
      select: { id: true },
    });
    const cids = convs.map((c) => c.id);
    if (cids.length) {
      await prisma.whatsAppMessage.deleteMany({
        where: { conversationId: { in: cids } },
      });
      await prisma.whatsAppConversationNote.deleteMany({
        where: { conversationId: { in: cids } },
      });
      await prisma.whatsAppConversation.deleteMany({ where: { id: { in: cids } } });
    }
    await prisma.traderAccount.deleteMany({ where: { id: { in: ids } } });
  }
  console.log(JSON.stringify({ ok: true, trader: row.email, cleaned: ids.length }));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
