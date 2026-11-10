import { prisma } from "@/lib/db/prisma";
import {
  isUiHiddenReference,
  uiVisibleCustomerWhere,
  uiVisibleDealWhere,
  uiVisibleRetailRequestWhere,
  uiVisibleTraderWhere,
  uiVisibleWholesaleWhere,
} from "@/lib/admin/ui-hidden";
import { formatDayKey, lastCalendarDayKeys } from "@/lib/i18n/format";
import {
  dealNextActor,
  retailNextActor,
  statusesAwaitingAdmin,
  wholesaleNextActor,
} from "@/lib/ui/status";
import { countActiveBrokerage } from "@/lib/brokerage/service";
import { getInboxHealthView } from "@/lib/whatsapp/messaging/inbox";

export type ActionQueueDomain = "retail" | "deal" | "wholesale";

export type ActionQueueRow = {
  id: string;
  domain: ActionQueueDomain;
  title: string;
  href: string;
  ageAt: Date;
  status: string;
  reference: string;
  subtitle: string;
  lineCount?: number;
};

export type KpiSeries = {
  points: number[];
  today: number;
  yesterday: number;
};

export type AdminKpiSeriesMap = {
  retail: KpiSeries;
  deals: KpiSeries;
  wholesale: KpiSeries;
  inbox: KpiSeries;
};

export type CatalogHealth = {
  published: number;
  withPhoto: number;
  missingPhoto: number;
};

/** Real counts for the dashboard manage strip (products / traders / customers / inbox). */
export type ManageHubCounts = {
  publishedProducts: number;
  traders: number;
  customers: number;
  unreadConversations: number;
};

export type RetailPipeline = {
  ready_for_handoff: number;
  in_follow_up: number;
  handoff_opened: number;
  completed: number;
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
    activeBrokerage,
    visibleTraders,
    visibleCustomers,
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
    countActiveBrokerage(),
    prisma.traderAccount.count({
      where: uiVisibleTraderWhere(),
    }),
    prisma.customer.count({
      where: uiVisibleCustomerWhere(),
    }),
    getInboxHealthView(),
    getActionQueueRows(24),
    getActivityFeedItems(),
  ]);

  const [series, requestsTrend, catalogHealth, pipeline, lastWhatsAppAt] =
    await Promise.all([
      getKpiSeries(sevenDaysAgo()),
      getRequestsTrend(30),
      getCatalogHealth(),
      getRetailPipeline(),
      latestWhatsAppAt(),
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
      activeBrokerage,
    },
    series,
    requestsTrend,
    catalogHealth,
    manageHub: {
      publishedProducts: catalogHealth.published,
      traders: visibleTraders,
      customers: visibleCustomers,
      unreadConversations,
    } satisfies ManageHubCounts,
    pipeline,
    lastWhatsAppAt,
    health,
    actionQueue,
    activityFeed,
  };
}

export type RequestsTrend = {
  /** Oldest → newest daily totals (retail + deals + wholesale created). */
  points: number[];
  total: number;
};

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
        _count: { select: { lines: true } },
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
        trader: { select: { displayName: true } },
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
      reference: r.reference,
      subtitle: r.customerName,
      lineCount: r._count.lines,
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
      reference: d.reference,
      subtitle: d.trader.displayName,
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
      reference: w.reference,
      subtitle: w.trader.displayName,
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

function sevenDaysAgo(): Date {
  return new Date(Date.now() - 8 * 24 * 60 * 60 * 1000);
}

function toSeries(dates: readonly Date[], keys: readonly string[]): KpiSeries {
  const counts: Record<string, number> = Object.fromEntries(
    keys.map((key) => [key, 0])
  );
  for (const date of dates) {
    const key = formatDayKey(date);
    if (key in counts) counts[key] += 1;
  }
  const points = keys.map((key) => counts[key] ?? 0);
  return {
    points,
    today: points[points.length - 1] ?? 0,
    yesterday: points[points.length - 2] ?? 0,
  };
}

async function getKpiSeries(since: Date): Promise<AdminKpiSeriesMap> {
  const keys = lastCalendarDayKeys(7);
  const retail = await prisma.retailRequest.findMany({
    where: {
      AND: [uiVisibleRetailRequestWhere(), { createdAt: { gte: since } }],
    },
    select: { createdAt: true },
  });
  const deals = await prisma.dealProposal.findMany({
    where: {
      AND: [uiVisibleDealWhere(), { createdAt: { gte: since } }],
    },
    select: { createdAt: true },
  });
  const wholesale = await prisma.wholesaleRequest.findMany({
    where: {
      AND: [uiVisibleWholesaleWhere(), { createdAt: { gte: since } }],
    },
    select: { createdAt: true },
  });
  const inbound = await prisma.whatsAppMessage.findMany({
    where: { direction: "inbound", createdAt: { gte: since } },
    select: { createdAt: true },
  });
  return {
    retail: toSeries(
      retail.map((row) => row.createdAt),
      keys
    ),
    deals: toSeries(
      deals.map((row) => row.createdAt),
      keys
    ),
    wholesale: toSeries(
      wholesale.map((row) => row.createdAt),
      keys
    ),
    inbox: toSeries(
      inbound.map((row) => row.createdAt),
      keys
    ),
  };
}

async function getRequestsTrend(days: number): Promise<RequestsTrend> {
  const since = new Date(Date.now() - (days + 1) * 24 * 60 * 60 * 1000);
  const keys = lastCalendarDayKeys(days);
  const [retail, deals, wholesale] = await Promise.all([
    prisma.retailRequest.findMany({
      where: {
        AND: [uiVisibleRetailRequestWhere(), { createdAt: { gte: since } }],
      },
      select: { createdAt: true },
    }),
    prisma.dealProposal.findMany({
      where: {
        AND: [uiVisibleDealWhere(), { createdAt: { gte: since } }],
      },
      select: { createdAt: true },
    }),
    prisma.wholesaleRequest.findMany({
      where: {
        AND: [uiVisibleWholesaleWhere(), { createdAt: { gte: since } }],
      },
      select: { createdAt: true },
    }),
  ]);
  const dates = [
    ...retail.map((r) => r.createdAt),
    ...deals.map((d) => d.createdAt),
    ...wholesale.map((w) => w.createdAt),
  ];
  const series = toSeries(dates, keys);
  return {
    points: series.points,
    total: series.points.reduce((a, b) => a + b, 0),
  };
}

async function getCatalogHealth(): Promise<CatalogHealth> {
  const published = await prisma.product.count({
    where: { status: "published" },
  });
  const withPhoto = await prisma.product.count({
    where: {
      status: "published",
      images: { some: { kind: "image" } },
    },
  });
  return {
    published,
    withPhoto,
    missingPhoto: Math.max(0, published - withPhoto),
  };
}

async function getRetailPipeline(): Promise<RetailPipeline> {
  const groups = await prisma.retailRequest.groupBy({
    by: ["status"],
    where: uiVisibleRetailRequestWhere(),
    _count: { _all: true },
  });
  const countOf = (status: string) =>
    groups.find((row) => row.status === status)?._count._all ?? 0;
  return {
    ready_for_handoff: countOf("ready_for_handoff"),
    in_follow_up: countOf("in_follow_up"),
    handoff_opened: countOf("handoff_opened"),
    completed: countOf("completed"),
  };
}

async function latestWhatsAppAt(): Promise<Date | null> {
  const row = await prisma.whatsAppConversation.findFirst({
    where: { lastMessageAt: { not: null } },
    orderBy: { lastMessageAt: "desc" },
    select: { lastMessageAt: true },
  });
  return row?.lastMessageAt ?? null;
}
