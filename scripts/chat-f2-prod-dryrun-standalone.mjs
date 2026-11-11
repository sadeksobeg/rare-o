/** Read-only prod counts — no trader-unify import (F2 not deployed). */
import { PrismaClient } from "@prisma/client";

function score(waChatId) {
  if (/@s\.whatsapp\.net$/i.test(waChatId)) return 300;
  if (/@lid$/i.test(waChatId)) return 200;
  if (/@platform\.local$/i.test(waChatId)) return 50;
  return 100;
}

const prisma = new PrismaClient();
const grouped = await prisma.whatsAppConversation.groupBy({
  by: ["traderId"],
  where: { traderId: { not: null } },
  _count: { _all: true },
});
const multi = grouped.filter((g) => g.traderId && g._count._all > 1);
const details = [];
for (const g of multi) {
  const rows = await prisma.whatsAppConversation.findMany({
    where: { traderId: g.traderId },
    select: {
      waChatId: true,
      lastMessageAt: true,
      _count: { select: { messages: true } },
    },
  });
  if (rows.length < 2) continue;
  const ranked = [...rows].sort((a, b) => {
    const ds = score(b.waChatId) - score(a.waChatId);
    if (ds !== 0) return ds;
    return (b.lastMessageAt?.getTime() ?? 0) - (a.lastMessageAt?.getTime() ?? 0);
  });
  const secondaries = ranked.slice(1);
  details.push({
    traderId: g.traderId,
    total: rows.length,
    secondaryCount: secondaries.length,
    messageMoveCount: secondaries.reduce((n, s) => n + s._count.messages, 0),
    primaryKind: ranked[0].waChatId.includes("@lid")
      ? "lid"
      : ranked[0].waChatId.includes("@s.whatsapp.net")
        ? "phone"
        : ranked[0].waChatId.includes("@platform.local")
          ? "platform"
          : "other",
  });
}
const out = {
  tradersChecked: grouped.filter((g) => g.traderId).length,
  mergesNeeded: details.length,
  details,
};
console.log(JSON.stringify(out, null, 2));
await prisma.$disconnect();
