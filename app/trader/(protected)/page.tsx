import { Suspense, cache } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Activity,
  Bell,
  Compass,
  Handshake,
  Package,
  Plus,
  Sparkles,
} from "lucide-react";
import { Rings } from "@/components/brand/rings";
import { CountUp } from "@/components/motion/count-up";
import { DrawIn, RosetteMark } from "@/components/motion/draw-in";
import { PressLink } from "@/components/portal/press-link";
import { DealCard } from "@/components/trader/deal-card";
import { TaskCard } from "@/components/trader/task-card";
import { PortalReveal } from "@/components/portal/reveal";
import { Timeline } from "@/components/ui/timeline";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { requireTraderSession } from "@/lib/auth/trader-session";
import { nextActor as brokerageNextActor } from "@/lib/brokerage/status";
import { listDealsForTrader } from "@/lib/deals/service";
import { formatDate, formatRelative } from "@/lib/i18n/format";
import { greetingHeadline } from "@/lib/i18n/greeting";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import type { Locale } from "@/lib/i18n/config";
import { prisma } from "@/lib/db/prisma";
import { listPublishedPublicOffers } from "@/lib/offers/service";
import {
  parseInterestSlugs,
  rankOffersByInterest,
} from "@/lib/offers/rank-by-interest";
import { listWholesaleRequestsForTrader } from "@/lib/wholesale/service";
import { getRequestDictionary } from "@/lib/i18n/server";
import { plural } from "@/lib/i18n/plural";
import { dealNextActor, getStatusMeta } from "@/lib/ui/status";
import {
  dealStatusLabel,
  fmt,
  wholesaleStatusLabel,
} from "@/lib/ui/trader-labels";
import { brokerageStatusLabel } from "@/components/brokerage/labels";
import { countUnreadTraderNotifications } from "@/lib/trader/notifications";
import { cn } from "@/lib/utils";

function waitingTodayLine(
  count: number,
  today: string,
  locale: Locale,
  t: Dictionary["trader"]
) {
  if (count === 0) return t.waitingTodayZero.replace("{date}", today);
  return plural(count, locale, {
    one: t.waitingTodayOne,
    two: t.waitingTodayTwo,
    few: t.waitingTodayFew,
    many: t.waitingTodayMany,
    other: t.waitingTodayOther,
  }).replace("{date}", today);
}

/** Drop week3 regression fixtures that must never surface to traders. */
function isRegressionOfferFixture(o: {
  slug: string;
  titleAr?: string | null;
  titleEn?: string | null;
  summaryAr?: string | null;
  summaryEn?: string | null;
}) {
  if (o.slug.startsWith("reg-gate-")) return true;
  const title = `${o.titleAr ?? ""} ${o.titleEn ?? ""}`;
  const summary = `${o.summaryAr ?? ""} ${o.summaryEn ?? ""}`;
  if (title.includes("فحص البوابة") || /gate check/i.test(title)) return true;
  if (summary.includes("يجب نشره") || /must publish/i.test(summary)) return true;
  if (summary.includes("يجب رفضه") || /must be rejected/i.test(summary)) return true;
  return false;
}

type Ok<T> = { ok: true; data: T };
type Err = { ok: false };
type Result<T> = Ok<T> | Err;

async function settle<T>(p: Promise<T>): Promise<Result<T>> {
  try {
    return { ok: true, data: await p };
  } catch {
    return { ok: false };
  }
}

const loadDeals = cache((traderId: string) =>
  settle(listDealsForTrader(traderId))
);
const loadWholesale = cache((traderId: string) =>
  settle(listWholesaleRequestsForTrader(traderId))
);
const loadBrokerage = cache((traderId: string) =>
  settle(
    prisma.brokerageRequest.findMany({
      where: { traderId },
      orderBy: { updatedAt: "desc" },
      take: 40,
      select: {
        id: true,
        reference: true,
        status: true,
        updatedAt: true,
        descriptionAr: true,
      },
    })
  )
);
const loadOffers = cache(() => settle(listPublishedPublicOffers()));
const loadTraderInterests = cache((traderId: string) =>
  settle(
    prisma.traderAccount.findUnique({
      where: { id: traderId },
      select: { interestCategorySlugs: true },
    })
  )
);
const loadUnread = cache((traderId: string) =>
  settle(countUnreadTraderNotifications(traderId))
);

function BlockError({
  dict,
  compact,
}: {
  dict: Dictionary;
  compact?: boolean;
}) {
  return (
    <ErrorState
      title={dict.common.errorTitle}
      body={dict.common.errorBody}
      retryLabel={dict.common.errorRetry}
      contactHref="/contact"
      contactLabel={dict.nav.contact}
      compact={compact}
    />
  );
}

async function HomeHero({
  traderId,
  traderName,
  locale,
  dict,
}: {
  traderId: string;
  traderName: string;
  locale: Locale;
  dict: Dictionary;
}) {
  const t = dict.trader;
  const [dealsR, wholesaleR, brokerageR] = await Promise.all([
    loadDeals(traderId),
    loadWholesale(traderId),
    loadBrokerage(traderId),
  ]);

  const today = formatDate(new Date(), locale, {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  let waitingCount = 0;
  let recordsOk = false;
  let totalRecords = 0;

  if (dealsR.ok) {
    recordsOk = true;
    totalRecords += dealsR.data.length;
    waitingCount += dealsR.data.filter((d) => {
      const last = d.entries[0]?.actorRole as "trader" | "admin" | undefined;
      return dealNextActor(d.status, last ?? null) === "trader";
    }).length;
  }
  if (wholesaleR.ok) {
    recordsOk = true;
    totalRecords += wholesaleR.data.length;
    waitingCount += wholesaleR.data.filter(
      (w) => getStatusMeta("wholesale", w.status).nextActor === "trader"
    ).length;
  }
  if (brokerageR.ok) {
    recordsOk = true;
    totalRecords += brokerageR.data.length;
    waitingCount += brokerageR.data.filter(
      (b) => brokerageNextActor(b.status) === "trader"
    ).length;
  }

  const isNew = recordsOk && totalRecords === 0;
  const waitingLine = !recordsOk
    ? t.lead
    : isNew
      ? t.lead
      : waitingTodayLine(waitingCount, today, locale, t);

  const waitingPhrase = waitingLine.includes("·")
    ? waitingLine.split("·")[0]?.trim()
    : waitingLine;
  const waitingRest = waitingLine.includes("·")
    ? waitingLine.split("·").slice(1).join("·").trim()
    : null;

  return (
    <section className="rad-thero">
      <Rings className="rad-thero-rings" idle />
      <h1>{greetingHeadline(traderName, dict.common)}</h1>
      <p>
        {waitingCount > 0 ? (
          <>
            <b>{waitingPhrase}</b>
            {waitingRest ? ` · ${waitingRest}` : null}
          </>
        ) : (
          waitingLine
        )}
      </p>
      <div className="rad-thero-actions">
        <Link href="/trader/deals/new" className="rad-thero-btn-cr">
          <Plus width={16} height={16} strokeWidth={1.5} aria-hidden />
          {t.newDeal}
        </Link>
        <Link href="/trader/wholesale" className="rad-thero-btn-ol">
          <Package width={16} height={16} strokeWidth={1.5} aria-hidden />
          {t.wholesale}
        </Link>
      </div>
    </section>
  );
}

async function StatsBlock({
  traderId,
  dict,
}: {
  traderId: string;
  dict: Dictionary;
}) {
  const t = dict.trader;
  const [dealsR, wholesaleR, unreadR] = await Promise.all([
    loadDeals(traderId),
    loadWholesale(traderId),
    loadUnread(traderId),
  ]);

  if (!dealsR.ok && !wholesaleR.ok) {
    return <BlockError dict={dict} compact />;
  }

  const deals = dealsR.ok ? dealsR.data : [];
  const wholesale = wholesaleR.ok ? wholesaleR.data : [];
  const unread = unreadR.ok ? unreadR.data : 0;

  const openDeals = deals.filter(
    (d) => !["accepted", "rejected", "closed", "cancelled"].includes(d.status)
  ).length;
  const openWholesale = wholesale.filter(
    (w) => !["completed", "cancelled"].includes(w.status)
  ).length;

  const items = [
    {
      label: t.homeStatDeals,
      value: openDeals,
      tone: "rad-c-warn" as const,
      Icon: Handshake,
    },
    {
      label: t.homeStatWholesale,
      value: openWholesale,
      tone: "rad-c-info" as const,
      Icon: Package,
    },
    {
      label: t.notifications,
      value: unread,
      tone: "rad-c-ac" as const,
      Icon: Bell,
    },
  ];

  return (
    <div className="rad-tstat">
      {items.map((stat) => (
        <div key={stat.label} className="rad-card rad-tstat-item">
          <span className={`rad-chip rad-chip-lg ${stat.tone}`}>
            <stat.Icon width={22} height={22} strokeWidth={1.5} aria-hidden />
          </span>
          <div>
            <b>
              <CountUp value={stat.value} durationMs={520} />
            </b>
            <span>{stat.label}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

async function WaitingBlock({
  traderId,
  locale,
  dict,
}: {
  traderId: string;
  locale: Locale;
  dict: Dictionary;
}) {
  const t = dict.trader;
  const [dealsR, wholesaleR, brokerageR] = await Promise.all([
    loadDeals(traderId),
    loadWholesale(traderId),
    loadBrokerage(traderId),
  ]);

  if (!dealsR.ok && !wholesaleR.ok && !brokerageR.ok) {
    return (
      <div>
        <div className="rad-tsh">
          <h2>{t.waitingTitle}</h2>
        </div>
        <BlockError dict={dict} compact />
      </div>
    );
  }

  const deals = dealsR.ok ? dealsR.data : [];
  const wholesale = wholesaleR.ok ? wholesaleR.data : [];
  const brokerage = brokerageR.ok ? brokerageR.data : [];

  const waitingDeals = deals.filter((d) => {
    const last = d.entries[0]?.actorRole as "trader" | "admin" | undefined;
    return dealNextActor(d.status, last ?? null) === "trader";
  });
  const waitingWholesale = wholesale.filter(
    (w) => getStatusMeta("wholesale", w.status).nextActor === "trader"
  );
  const waitingBrokerage = brokerage.filter(
    (b) => brokerageNextActor(b.status) === "trader"
  );

  const waiting = [
    ...waitingDeals.map((d) => ({
      key: `deal-${d.id}`,
      kind: "deal" as const,
      href: `/trader/deals/${d.id}`,
      reference: d.reference,
      title: d.title,
      tone: getStatusMeta("deal", d.status).tone,
      label: dealStatusLabel(t, d.status),
    })),
    ...waitingWholesale.map((w) => ({
      key: `ws-${w.id}`,
      kind: "wholesale" as const,
      href: `/trader/wholesale/${w.id}`,
      reference: w.reference,
      title: undefined as string | undefined,
      tone: getStatusMeta("wholesale", w.status).tone,
      label: wholesaleStatusLabel(t, w.status),
    })),
    ...waitingBrokerage.map((b) => ({
      key: `br-${b.id}`,
      kind: "brokerage" as const,
      href: `/trader/brokerage/${b.id}`,
      reference: b.reference,
      title: b.descriptionAr || undefined,
      tone: "attention" as const,
      label: brokerageStatusLabel(b.status, locale),
    })),
  ];

  const kinds = new Set(waiting.map((w) => w.kind));
  const viewAllHref =
    kinds.size === 1 && kinds.has("brokerage")
      ? "/trader/brokerage"
      : kinds.size === 1 && kinds.has("wholesale")
        ? "/trader/wholesale/requests"
        : kinds.size === 1 && kinds.has("deal")
          ? "/trader/deals"
          : waitingDeals.length >= waitingWholesale.length &&
              waitingDeals.length >= waitingBrokerage.length
            ? "/trader/deals"
            : waitingWholesale.length >= waitingBrokerage.length
              ? "/trader/wholesale/requests"
              : "/trader/brokerage";
  const viewAllLabel = `${t.viewAllOffers} (${waiting.length})`;

  return (
    <div>
      <div className="rad-tsh">
        <h2>{t.waitingTitle}</h2>
        {waiting.length > 0 ? (
          <Link href={viewAllHref}>{viewAllLabel}</Link>
        ) : null}
      </div>
      <div className="rad-card p-1.5 sm:p-2">
        {waiting.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 px-4 py-8 text-center">
            <DrawIn durationMs={900} className="size-16">
              <RosetteMark width={64} height={64} />
            </DrawIn>
            <p className="text-sm font-medium text-[color:var(--rad-ok)]">
              {t.waitingIdle}
            </p>
            <p className="text-sm text-[color:var(--rad-tx3)]">{t.lead}</p>
            <Link href="/trader/deals" className="rad-btn rad-gh rad-sm">
              {t.myDeals.replace("{n}", String(deals.length))}
            </Link>
          </div>
        ) : (
          <div>
            {waiting.map((item) => (
              <DealCard
                key={item.key}
                href={item.href}
                reference={item.reference}
                title={item.title}
                tone={item.tone}
                statusLabel={item.label}
                waitingLabel={t.waitingOnYou}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function TasksBlock({ dict }: { dict: Dictionary }) {
  const t = dict.trader;
  return (
    <div>
      <div className="rad-tsh">
        <h2>{t.homeTasksTitle}</h2>
      </div>
      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
        <TaskCard
          href="/trader/deals/new"
          title={t.taskDealTitle}
          body={t.taskDealBody}
          icon="handshake"
        />
        <TaskCard
          href="/trader/wholesale"
          title={t.taskWholesaleTitle}
          body={t.taskWholesaleBody}
          icon="package"
        />
      </div>
    </div>
  );
}

async function OffersBlock({
  traderId,
  locale,
  dict,
}: {
  traderId: string;
  locale: Locale;
  dict: Dictionary;
}) {
  const t = dict.trader;
  const [offersR, traderR] = await Promise.all([
    loadOffers(),
    loadTraderInterests(traderId),
  ]);

  return (
    <div>
      <div className="rad-tsh">
        <h2>{t.offersNow}</h2>
        <Link href="/trader/offers">{t.viewAllOffers}</Link>
      </div>

      {!offersR.ok ? (
        <BlockError dict={dict} compact />
      ) : (
        (() => {
          const cleaned = offersR.data.filter((o) => !isRegressionOfferFixture(o));
          const rankedOffers = rankOffersByInterest(
            cleaned,
            parseInterestSlugs(
              traderR.ok ? traderR.data?.interestCategorySlugs : null
            )
          );
          const seenTitles = new Set<string>();
          const offerPreview = rankedOffers
            .filter((o) => {
              const key = (
                locale === "ar"
                  ? o.titleAr || o.titleEn || o.slug
                  : o.titleEn || o.titleAr || o.slug
              )
                .trim()
                .toLowerCase();
              if (seenTitles.has(key)) return false;
              seenTitles.add(key);
              return true;
            })
            .slice(0, 3);
          if (offerPreview.length === 0) {
            return null;
          }
          const cols =
            offerPreview.length >= 3
              ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
              : offerPreview.length === 2
                ? "grid-cols-1 sm:grid-cols-2"
                : "grid-cols-1";
          return (
            <ul className={cn("grid gap-3.5", cols)}>
              {offerPreview.map((o) => {
                const title =
                  locale === "ar"
                    ? o.titleAr || o.titleEn || o.slug
                    : o.titleEn || o.titleAr || o.slug;
                const summary =
                  locale === "ar"
                    ? o.summaryAr || o.summaryEn
                    : o.summaryEn || o.summaryAr;
                const imagePath = o.product?.images?.[0]?.path ?? null;
                return (
                  <li key={o.id}>
                    <PressLink
                      href={`/trader/offers/${o.slug}`}
                      className="rad-card rad-tocard block focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--rad-ac)]"
                    >
                      <div className="rad-tocard-im">
                        {imagePath ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={imagePath}
                            alt=""
                            className="absolute inset-0 size-full object-cover"
                          />
                        ) : (
                          <Image
                            src="/brand/hero-oud-atelier-d.jpg"
                            alt=""
                            fill
                            className="object-cover opacity-80"
                            sizes="(max-width:640px) 100vw, 33vw"
                          />
                        )}
                        <span className="absolute start-3 top-3 inline-flex h-6 items-center gap-1.5 rounded-full bg-[rgba(11,8,13,.62)] px-2.5 text-[11.5px] font-semibold text-[#F4E7D8] backdrop-blur-[6px]">
                          <Sparkles width={13} height={13} strokeWidth={1.5} aria-hidden />
                          {t.offers}
                        </span>
                      </div>
                      <div className="rad-tocard-bd">
                        <b>{title}</b>
                        {summary ? <p className="line-clamp-2">{summary}</p> : null}
                        <div className="mt-3.5">
                          <span className="rad-btn rad-gh rad-sm inline-flex">
                            {t.offersViewDetails}
                          </span>
                        </div>
                      </div>
                    </PressLink>
                  </li>
                );
              })}
            </ul>
          );
        })()
      )}
    </div>
  );
}

async function ActivityBlock({
  traderId,
  locale,
  dict,
}: {
  traderId: string;
  locale: Locale;
  dict: Dictionary;
}) {
  const t = dict.trader;
  const [dealsR, wholesaleR, brokerageR] = await Promise.all([
    loadDeals(traderId),
    loadWholesale(traderId),
    loadBrokerage(traderId),
  ]);

  if (!dealsR.ok && !wholesaleR.ok && !brokerageR.ok) {
    return (
      <div>
        <div className="rad-tsh">
          <h2>{t.recentActivity}</h2>
        </div>
        <BlockError dict={dict} compact />
      </div>
    );
  }

  const deals = dealsR.ok ? dealsR.data : [];
  const wholesale = wholesaleR.ok ? wholesaleR.data : [];
  const brokerage = brokerageR.ok ? brokerageR.data : [];

  const activity = [
    ...deals.map((d) => ({
      id: `deal-${d.id}`,
      at: d.updatedAt,
      title: d.title
        ? `${d.reference} · ${d.title}`
        : fmt(t.activityDeal, { ref: d.reference }),
      status: dealStatusLabel(t, d.status),
      href: `/trader/deals/${d.id}`,
      kind: "deal" as const,
    })),
    ...wholesale.map((w) => ({
      id: `ws-${w.id}`,
      at: w.updatedAt,
      title: fmt(t.activityWholesale, { ref: w.reference }),
      status: wholesaleStatusLabel(t, w.status),
      href: `/trader/wholesale/${w.id}`,
      kind: "wholesale" as const,
    })),
    ...brokerage.map((b) => ({
      id: `br-${b.id}`,
      at: b.updatedAt,
      title: b.descriptionAr
        ? `${b.reference} · ${b.descriptionAr}`
        : b.reference,
      status: brokerageStatusLabel(b.status, locale),
      href: `/trader/brokerage/${b.id}`,
      kind: "brokerage" as const,
    })),
  ]
    .sort((a, b) => b.at.getTime() - a.at.getTime())
    .slice(0, 5);

  return (
    <div>
      <div className="rad-tsh">
        <h2 className="flex items-center gap-2">
          <Activity className="size-4" strokeWidth={1.5} aria-hidden />
          {t.recentActivity}
        </h2>
      </div>
      {activity.length === 0 ? (
        <EmptyState
          variant="first-use"
          title={t.recentActivity}
          body={t.recentActivityEmpty}
          actionHref="/trader/deals/new"
          actionLabel={t.taskDealTitle}
        />
      ) : (
        <div className="rad-card min-w-0 overflow-x-clip p-2 md:p-3">
          <Timeline
            compact
            label={t.recentActivity}
            events={activity.map((ev) => ({
              id: ev.id,
              title: ev.title,
              actor: ev.status,
              relativeTime: formatRelative(ev.at, locale),
              absoluteTime: formatDate(ev.at, locale, {
                year: "numeric",
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
                hour12: false,
              }),
              icon:
                ev.kind === "wholesale" ? (
                  <Package className="size-3.5" strokeWidth={1.5} aria-hidden />
                ) : ev.kind === "brokerage" ? (
                  <Compass className="size-3.5" strokeWidth={1.5} aria-hidden />
                ) : (
                  <Handshake className="size-3.5" strokeWidth={1.5} aria-hidden />
                ),
              tone:
                ev.kind === "wholesale"
                  ? "wholesale"
                  : ev.kind === "brokerage"
                    ? "deal"
                    : "deal",
              detail: (
                <Link
                  href={ev.href}
                  className="inline-flex h-8 items-center rounded-[var(--rad-r-sm,10px)] px-2.5 text-xs font-semibold text-[color:var(--rad-ac)] transition-colors hover:bg-[color:var(--rad-surface3)]"
                >
                  {t.openRecord}
                </Link>
              ),
            }))}
          />
        </div>
      )}
    </div>
  );
}

function HeroSkeleton() {
  return <Skeleton className="mb-5 h-48 w-full rounded-[22px]" />;
}

function WaitingSkeleton() {
  return <Skeleton className="min-h-[12rem] w-full" />;
}

function StatsSkeleton() {
  return <Skeleton className="h-28 w-full" />;
}

function OffersSkeleton() {
  return <Skeleton className="h-40 w-full" />;
}

function ActivitySkeleton() {
  return <Skeleton className="h-48 w-full" />;
}

export default async function TraderHomePage() {
  const session = await requireTraderSession();
  const { locale, dict } = await getRequestDictionary();

  return (
    <section data-trader-home className="relative">
      <Suspense fallback={<HeroSkeleton />}>
        <HomeHero
          traderId={session.sub}
          traderName={session.displayName}
          locale={locale}
          dict={dict}
        />
      </Suspense>

      <PortalReveal eager>
        <Suspense fallback={<StatsSkeleton />}>
          <StatsBlock traderId={session.sub} dict={dict} />
        </Suspense>
      </PortalReveal>

      <PortalReveal eager>
        <Suspense fallback={<WaitingSkeleton />}>
          <WaitingBlock
            traderId={session.sub}
            locale={locale}
            dict={dict}
          />
        </Suspense>
      </PortalReveal>

      <PortalReveal eager>
        <TasksBlock dict={dict} />
      </PortalReveal>

      <PortalReveal
        eager
        className="grid min-w-0 items-start gap-4 lg:grid-cols-2"
      >
        <div className="min-w-0">
          <Suspense fallback={<OffersSkeleton />}>
            <OffersBlock
              traderId={session.sub}
              locale={locale}
              dict={dict}
            />
          </Suspense>
        </div>
        <div className="min-w-0" data-trader-activity>
          <Suspense fallback={<ActivitySkeleton />}>
            <ActivityBlock
              traderId={session.sub}
              locale={locale}
              dict={dict}
            />
          </Suspense>
        </div>
      </PortalReveal>
    </section>
  );
}
