import { prisma } from "@/lib/db/prisma";
import { dealNextActor } from "@/lib/ui/status";

export async function getTraderWaitingCounts(traderId: string): Promise<{
  deals: number;
  wholesale: number;
}> {
  const [dealRows, wholesale] = await Promise.all([
    prisma.dealProposal.findMany({
      where: { traderId, status: { in: ["proposed", "negotiating"] } },
      select: {
        status: true,
        entries: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: { actorRole: true },
        },
      },
    }),
    prisma.wholesaleRequest.count({
      where: { traderId, status: "quote_provided" },
    }),
  ]);

  const deals = dealRows.filter((row) => {
    const last = row.entries[0]?.actorRole as "trader" | "admin" | undefined;
    return dealNextActor(row.status, last ?? null) === "trader";
  }).length;

  return { deals, wholesale };
}
