import { prisma } from "@/lib/db/prisma";
import { uiVisibleRetailRequestWhere } from "@/lib/admin/ui-hidden";
import { getInboxHealthView } from "@/lib/whatsapp/messaging/inbox";

/** Admin home metrics — derived from existing tables only (no invented KPIs). */
export async function getAdminHomeData() {
  const [
    retailAwaitingAdmin,
    dealsAwaitingAdmin,
    wholesaleAwaitingAdmin,
    unreadConversations,
    health,
    recentRequests,
    published,
  ] = await Promise.all([
    prisma.retailRequest.count({
      where: {
        AND: [
          uiVisibleRetailRequestWhere,
          { status: { in: ["draft", "handoff_opened", "in_follow_up"] } },
        ],
      },
    }),
    prisma.dealProposal.count({
      where: { status: { in: ["proposed", "negotiating"] } },
    }),
    prisma.wholesaleRequest.count({
      where: {
        status: { in: ["submitted", "under_review", "confirmed"] },
      },
    }),
    prisma.whatsAppConversation.count({
      where: { unreadCount: { gt: 0 } },
    }),
    getInboxHealthView(),
    prisma.retailRequest.findMany({
      where: uiVisibleRetailRequestWhere,
      orderBy: { createdAt: "desc" },
      take: 8,
      select: {
        id: true,
        reference: true,
        status: true,
        customerName: true,
        createdAt: true,
        subtotal: true,
        currency: true,
      },
    }),
    prisma.product.count({ where: { status: "published" } }),
  ]);

  return {
    kpis: {
      retailAwaitingAdmin,
      dealsAwaitingAdmin,
      wholesaleAwaitingAdmin,
      unreadConversations,
    },
    health,
    recentRequests,
    published,
  };
}
