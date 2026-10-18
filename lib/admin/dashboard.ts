import { prisma } from "@/lib/db/prisma";
import {
  isUiHiddenReference,
  uiVisibleDealWhere,
  uiVisibleRetailRequestWhere,
  uiVisibleWholesaleWhere,
} from "@/lib/admin/ui-hidden";
import {
  dealNextActor,
  retailNextActor,
  statusesAwaitingAdmin,
  wholesaleNextActor,
} from "@/lib/ui/status";
import { getInboxHealthView } from "@/lib/whatsapp/messaging/inbox";

export type ActionQueueDomain = "retail" | "deal" | "wholesale";

export type ActionQueueRow = {
  id: string;
  domain: ActionQueueDomain;
  title: string;
  href: string;
  ageAt: Date;
  status: string;
};

export type ActivityFeedDomain = "retail" | "deal" | "wholesale";

export type ActivityFeedItem = {
  id: string;
  domain: ActivityFeedDomain;
  /** Record reference shown in the feed title */
  reference: string;
  /** Raw event/action key — UI maps via dictionary (never render Latin in AR) */
  eventKey: string;
  href: string;
  at: Date;
  actor: string;
  detail?: string | null;
};

/** Admin home metrics — KPI counts from approved status / nextActor table (D40). */
export async function getAdminHomeData() {
  const retailAdminStatuses = statusesAwaitingAdmin("retail");
  const dealStaticAdminStatuses = statusesAwaitingAdmin("deal").filter(
    (s) => s !== "negotiating"
  );
  const wholesaleAdminStatuses = statusesAwaitingAdmin("wholesale");

  const [
    retailAwaitingAdmin,
    dealCandidates,
    wholesaleAwaitingAdmin,
    unreadConversations,
    health,
    actionQueue,
    activityFeed,
  ] = await Promise.all([
    prisma.retailRequest.count({
      where: {
        AND: [
          uiVisibleRetailRequestWhere(),
          { status: { in: retailAdminStatuses } },
        ],
      },
    }),
    prisma.dealProposal.findMany({
      where: {
        AND: [
          uiVisibleDealWhere(),
          { status: { in: [...dealStaticAdminStatuses, "negotiating"] } },
        ],
      },
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
      where: {
        AND: [
          uiVisibleWholesaleWhere(),
          { status: { in: wholesaleAdminStatuses } },
        ],
      },
    }),
    prisma.whatsAppConversation.count({
      where: { unreadCount: { gt: 0 } },
    }),
    getInboxHealthView(),
    getActionQueueRows(),
    getActivityFeedItems(),
  ]);

  const dealsAwaitingAdmin = dealCandidates.filter((d) => {
    const last = d.entries[0]?.actorRole;
    const lastRole =
      last === "admin" || last === "trader" ? last : null;
    return dealNextActor(d.status, lastRole) === "admin";
  }).length;

  return {
    kpis: {
      retailAwaitingAdmin,
      dealsAwaitingAdmin,
      wholesaleAwaitingAdmin,
      unreadConversations,
    },
    health,
    actionQueue,
    activityFeed,
  };
}

/**
 * D31b — merged retail / deal / wholesale where nextActor === admin,
 * oldest first, max 8.
 */
export async function getActionQueueRows(
  limit = 8
): Promise<ActionQueueRow[]> {
  const retailAdminStatuses = statusesAwaitingAdmin("retail");
  const dealStaticAdminStatuses = statusesAwaitingAdmin("deal").filter(
    (s) => s !== "negotiating"
  );
  const wholesaleAdminStatuses = statusesAwaitingAdmin("wholesale");

  const [retail, deals, wholesale] = await Promise.all([
    prisma.retailRequest.findMany({
      where: {
        AND: [
          uiVisibleRetailRequestWhere(),
          { status: { in: retailAdminStatuses } },
        ],
      },
      select: {
        id: true,
        reference: true,
        customerName: true,
        status: true,
        updatedAt: true,
        createdAt: true,
      },
      take: 40,
    }),
    prisma.dealProposal.findMany({
      where: {
        AND: [
          uiVisibleDealWhere(),
          { status: { in: [...dealStaticAdminStatuses, "negotiating"] } },
        ],
      },
      select: {
        id: true,
        reference: true,
        title: true,
        status: true,
        updatedAt: true,
        createdAt: true,
        entries: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: { actorRole: true },
        },
      },
      take: 40,
    }),
    prisma.wholesaleRequest.findMany({
      where: {
        AND: [
          uiVisibleWholesaleWhere(),
          { status: { in: wholesaleAdminStatuses } },
        ],
      },
      select: {
        id: true,
        reference: true,
        status: true,
        updatedAt: true,
        createdAt: true,
        trader: { select: { displayName: true } },
      },
      take: 40,
    }),
  ]);

  const rows: ActionQueueRow[] = [];

  for (const r of retail) {
    if (retailNextActor(r.status) !== "admin") continue;
    rows.push({
      id: r.id,
      domain: "retail",
      title: `${r.reference} · ${r.customerName}`,
      href: `/admin/requests/${r.id}`,
      ageAt: r.updatedAt ?? r.createdAt,
      status: r.status,
    });
  }

  for (const d of deals) {
    const last = d.entries[0]?.actorRole;
    const lastRole =
      last === "admin" || last === "trader" ? last : null;
    if (dealNextActor(d.status, lastRole) !== "admin") continue;
    rows.push({
      id: d.id,
      domain: "deal",
      title: `${d.reference} · ${d.title}`,
      href: `/admin/deals/${d.id}`,
      ageAt: d.updatedAt ?? d.createdAt,
      status: d.status,
    });
  }

  for (const w of wholesale) {
    if (wholesaleNextActor(w.status) !== "admin") continue;
    rows.push({
      id: w.id,
      domain: "wholesale",
      title: `${w.reference} · ${w.trader.displayName}`,
      href: `/admin/wholesale/${w.id}`,
      ageAt: w.updatedAt ?? w.createdAt,
      status: w.status,
    });
  }

  rows.sort((a, b) => a.ageAt.getTime() - b.ageAt.getTime());
  return rows.slice(0, limit);
}

/**
 * D31 — last 10 events from RetailHandoffEvent, NegotiationEntry,
 * WholesaleRequestEvent (read-only union).
 */
export async function getActivityFeedItems(
  limit = 10
): Promise<ActivityFeedItem[]> {
  const [handoffs, negotiations, wholesaleEvents] = await Promise.all([
    prisma.retailHandoffEvent.findMany({
      orderBy: { createdAt: "desc" },
      take: limit,
      select: {
        id: true,
        eventType: true,
        actor: true,
        note: true,
        createdAt: true,
        request: { select: { id: true, reference: true } },
      },
    }),
    prisma.negotiationEntry.findMany({
      orderBy: { createdAt: "desc" },
      take: limit,
      select: {
        id: true,
        action: true,
        actorRole: true,
        message: true,
        createdAt: true,
        deal: { select: { id: true, reference: true } },
      },
    }),
    prisma.wholesaleRequestEvent.findMany({
      orderBy: { createdAt: "desc" },
      take: limit,
      select: {
        id: true,
        eventType: true,
        actorRole: true,
        note: true,
        createdAt: true,
        request: { select: { id: true, reference: true } },
      },
    }),
  ]);

  const items: ActivityFeedItem[] = [
    ...handoffs.map((e) => ({
      id: `retail-${e.id}`,
      domain: "retail" as const,
      reference: e.request.reference,
      eventKey: e.eventType,
      href: `/admin/requests/${e.request.id}`,
      at: e.createdAt,
      actor: e.actor,
      detail: e.note,
    })),
    ...negotiations
      .filter((e) => !isUiHiddenReference(e.deal.reference))
      .map((e) => ({
        id: `deal-${e.id}`,
        domain: "deal" as const,
        reference: e.deal.reference,
        eventKey: e.action,
        href: `/admin/deals/${e.deal.id}`,
        at: e.createdAt,
        actor: e.actorRole,
        detail: e.message || null,
      })),
    ...wholesaleEvents
      .filter((e) => !isUiHiddenReference(e.request.reference))
      .map((e) => ({
        id: `wholesale-${e.id}`,
        domain: "wholesale" as const,
        reference: e.request.reference,
        eventKey: e.eventType,
        href: `/admin/wholesale/${e.request.id}`,
        at: e.createdAt,
        actor: e.actorRole,
        detail: e.note,
      })),
  ];

  items.sort((a, b) => b.at.getTime() - a.at.getTime());
  return items.slice(0, limit);
}

/** Retail KPI only — used by Slice A regression (new storefront request). */
export async function countRetailAwaitingAdmin(): Promise<number> {
  return prisma.retailRequest.count({
    where: {
      AND: [
        uiVisibleRetailRequestWhere(),
        { status: { in: statusesAwaitingAdmin("retail") } },
      ],
    },
  });
}
