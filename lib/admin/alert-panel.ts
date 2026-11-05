import { prisma } from "@/lib/db/prisma";
import { uiVisibleDealWhere, uiVisibleRetailRequestWhere } from "@/lib/admin/ui-hidden";

export type AdminAlertPanelItem = {
  id: string;
  href: string;
  title: string;
  body?: string;
  unread?: boolean;
};

/** Lightweight alerts for the admin header notification panel (not full dashboard). */
export async function listAdminAlertPanelItems(limit = 8): Promise<{
  items: AdminAlertPanelItem[];
  unreadCount: number;
}> {
  const [unreadInbox, deals, retail] = await Promise.all([
    prisma.whatsAppConversation.count({ where: { unreadCount: { gt: 0 } } }),
    prisma.dealProposal.findMany({
      where: {
        AND: [uiVisibleDealWhere(), { status: { in: ["proposed", "negotiating", "awaiting_payment"] } }],
      },
      orderBy: { updatedAt: "desc" },
      take: 4,
      select: { id: true, reference: true, title: true, status: true },
    }),
    prisma.retailRequest.findMany({
      where: {
        AND: [
          uiVisibleRetailRequestWhere(),
          { status: { in: ["ready_for_handoff", "handoff_opened", "in_follow_up"] } },
        ],
      },
      orderBy: { updatedAt: "desc" },
      take: 4,
      select: { id: true, reference: true, status: true },
    }),
  ]);

  const items: AdminAlertPanelItem[] = [];
  if (unreadInbox > 0) {
    items.push({
      id: "inbox-unread",
      href: "/admin/inbox?tab=unread",
      title: "__inbox_unread__",
      body: String(unreadInbox),
      unread: true,
    });
  }
  for (const d of deals) {
    items.push({
      id: d.id,
      href: `/admin/deals/${d.id}`,
      title: d.reference,
      body: d.title,
      unread: d.status === "awaiting_payment" || d.status === "proposed",
    });
  }
  for (const r of retail) {
    items.push({
      id: r.id,
      href: `/admin/requests/${r.id}`,
      title: r.reference,
      body: r.status,
      unread: true,
    });
  }

  return {
    items: items.slice(0, limit),
    unreadCount: unreadInbox + deals.filter((d) => d.status === "awaiting_payment").length,
  };
}
