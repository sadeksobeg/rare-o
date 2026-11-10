import { prisma } from "@/lib/db/prisma";
import { nextActor as brokerageNextActor } from "@/lib/brokerage/status";
import { dealNextActor } from "@/lib/ui/status";

export async function getTraderWaitingCounts(traderId: string): Promise<{
  deals: number;
  wholesale: number;
  brokerage: number;
}> {
  const [dealRows, wholesale, brokerageRows] = await Promise.all([
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
    prisma.brokerageRequest.findMany({
      where: {
        traderId,
        status: { in: ["QUOTE_SENT", "NEEDS_INFO"] },
      },
      select: { status: true },
    }),
  ]);

  const deals = dealRows.filter((row) => {
    const last = row.entries[0]?.actorRole as "trader" | "admin" | undefined;
    return dealNextActor(row.status, last ?? null) === "trader";
  }).length;

  const brokerage = brokerageRows.filter(
    (row) => brokerageNextActor(row.status) === "trader"
  ).length;

  return { deals, wholesale, brokerage };
}
