import { Suspense, cache } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Activity,
  Compass,
  Handshake,
  Home,
  Package,
  Sparkles,
} from "lucide-react";
import { CountUp } from "@/components/motion/count-up";
import { DrawIn, RosetteMark } from "@/components/motion/draw-in";
import { Stagger } from "@/components/motion/reveal";
import { PressLink } from "@/components/portal/press-link";
import { DealCard } from "@/components/trader/deal-card";
import { TaskCard } from "@/components/trader/task-card";
import { TraderPageHeader } from "@/components/trader/page-header";
import { PortalReveal } from "@/components/portal/reveal";
import { Timeline } from "@/components/ui/timeline";
import { Skeleton } from "@/components/ui/skeleton";
import { ButtonLink } from "@/components/ui/button";
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
import { dealNextActor, getStatusMeta } from "@/lib/ui/status";
import {
  dealStatusLabel,
  fmt,
  wholesaleStatusLabel,
} from "@/lib/ui/trader-labels";
import { brokerageStatusLabel } from "@/components/brokerage/labels";

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

async function HomeGreeting({
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

  if (dealsR.ok) {
    recordsOk = true;
    waitingCount += dealsR.data.filter((d) => {
      const last = d.entries[0]?.actorRole as "trader" | "admin" | undefined;
      return dealNextActor(d.status, last ?? null) === "trader";
    }).length;
  }
  if (wholesaleR.ok) {
    recordsOk = true;
    waitingCount += wholesaleR.data.filter(
      (w) => getStatusMeta("wholesale", w.status).nextActor === "trader"
    ).length;
  }
  if (brokerageR.ok) {
    recordsOk = true;
    waitingCount += brokerageR.data.filter(
      (b) => brokerageNextActor(b.status) === "trader"
    ).length;
  }

  const waitingLine = !recordsOk
    ? t.lead
    : waitingCount === 0
      ? t.waitingTodayZero.replace("{date}", today)
      : t.waitingToday
          .replace("{n}", String(waitingCount))
          .replace("{date}", today);

  return (
    <TraderPageHeader
      title={greetingHeadline(traderName, dict.common)}
      description={`${waitingLine} — ${t.lead}`}
      icon={<Home className="size-5" strokeWidth={1.5} />}
    />
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
      <div className="flex flex-col space-y-3 lg:col-span-6">
        <h2 className="ro-portal-section-title flex items-center gap-2">
          <span className="ro-portal-icon-well size-8 [&>svg]:size-4" aria-hidden>
            <Handshake className="size-4" strokeWidth={1.5} />
          </span>
          {t.waitingTitle}
        </h2>
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
      href: `/trader/deals/${d.id}`,
      reference: d.reference,
      title: d.title,
      tone: getStatusMeta("deal", d.status).tone,
      label: dealStatusLabel(t, d.status),
    })),
    ...waitingWholesale.map((w) => ({
      key: `ws-${w.id}`,
      href: `/trader/wholesale/${w.id}`,
      reference: w.reference,
      title: undefined as string | undefined,
      tone: getStatusMeta("wholesale", w.status).tone,
      label: wholesaleStatusLabel(t, w.status),
    })),
    ...waitingBrokerage.map((b) => ({
      key: `br-${b.id}`,
      href: `/trader/brokerage/${b.id}`,
      reference: b.reference,
      title: b.descriptionAr || undefined,
      tone: "attention" as const,
      label: brokerageStatusLabel(b.status, locale),
    })),
  ];

  const myDeals = t.myDeals.replace("{n}", String(deals.length));

  return (
    <div className="flex flex-col space-y-3 lg:col-span-6">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="ro-portal-section-title flex items-center gap-2">
          <span className="ro-portal-icon-well size-8 [&>svg]:size-4" aria-hidden>
            <Handshake className="size-4" strokeWidth={1.5} />
          </span>
          {t.waitingTitle}
        </h2>
        {waiting.length > 0 ? (
          <span className="text-xs tabular-nums text-ro-muted">
            <CountUp value={waiting.length} durationMs={420} />
          </span>
        ) : null}
      </div>
      <div className="ro-portal-card flex min-h-[12rem] flex-1 flex-col border p-4 sm:p-5">
        {waiting.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
            <DrawIn durationMs={900} className="size-16">
              <RosetteMark width={64} height={64} />
            </DrawIn>
            <p className="text-sm font-medium text-[var(--ro-success-700)]">
              {t.waitingIdle}
            </p>
            <p className="text-sm text-ro-muted">{t.lead}</p>
            <ButtonLink href="/trader/deals" variant="secondary" size="sm">
              {myDeals}
            </ButtonLink>
          </div>
        ) : (
          <Stagger stepMs={70} className="space-y-3">
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
          </Stagger>
        )}
      </div>
    </div>
  );
}

function TasksBlock({ dict }: { dict: Dictionary }) {
  const t = dict.trader;
  return (
    <div className="flex flex-col space-y-3 lg:col-span-6">
      <h2 className="ro-portal-section-title flex items-center gap-2">
        <span className="ro-portal-icon-well size-8 [&>svg]:size-4" aria-hidden>
          <Sparkles className="size-4" strokeWidth={1.5} />
        </span>
        {t.homeTasksTitle}
      </h2>
      <div className="grid flex-1 gap-3">
        <TaskCard
          href="/trader/deals/new"
          title={t.taskDealTitle}
          body={t.taskDealBody}
          icon="handshake"
          imageSrc="/brand/hero-oud-majestic.jpg"
        />
        <TaskCard
          href="/trader/wholesale"
          title={t.taskWholesaleTitle}
          body={t.taskWholesaleBody}
          icon="package"
          imageSrc="/brand/hero-oud-atelier-a.jpg"
        />
        <TaskCard
          href="/trader/brokerage/new"
          title={t.taskBrokerageTitle}
          body={t.taskBrokerageBody}
          icon="compass"
          imageSrc="/brand/hero-oud-resonance.jpg"
        />
      </div>
    </div>
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
  const [dealsR, wholesaleR, brokerageR] = await Promise.all([
    loadDeals(traderId),
    loadWholesale(traderId),
    loadBrokerage(traderId),
  ]);

  if (!dealsR.ok && !wholesaleR.ok && !brokerageR.ok) {
    return <BlockError dict={dict} compact />;
  }

  const deals = dealsR.ok ? dealsR.data : [];
  const wholesale = wholesaleR.ok ? wholesaleR.data : [];
  const brokerage = brokerageR.ok ? brokerageR.data : [];

  const openDeals = deals.filter(
    (d) => !["accepted", "rejected", "closed", "cancelled"].includes(d.status)
  ).length;
  const openWholesale = wholesale.filter(
    (w) => !["completed", "cancelled"].includes(w.status)
  ).length;
  const openBrokerage = brokerage.filter(
    (b) =>
      !["CLOSED", "DECLINED", "REJECTED", "CANCELLED"].includes(b.status)
  ).length;

  return (
    <div className="space-y-3">
      <h2 className="ro-portal-section-title">{t.homeStatsTitle}</h2>
      <div className="grid gap-4 border-b border-ro-line pb-6 sm:grid-cols-3">
        {[
          {
            label: t.homeStatDeals,
            value: openDeals,
            hint: t.homeStatOpen,
          },
          {
            label: t.homeStatWholesale,
            value: openWholesale,
            hint: t.homeStatOpen,
          },
          {
            label: t.homeStatBrokerage,
            value: openBrokerage,
            hint: t.homeStatOpen,
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className="border-s-2 border-[color-mix(in_srgb,var(--ro-plum-900)_35%,transparent)] ps-4"
          >
            <p className="text-xs text-ro-muted">{stat.label}</p>
            <p className="font-display text-3xl font-bold tabular-nums text-ro-ink">
              <CountUp value={stat.value} durationMs={520} />
            </p>
            <p className="text-xs text-ro-muted">{stat.hint}</p>
          </div>
        ))}
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
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-display text-xl font-semibold">{t.offersNow}</h2>
        <Link
          href="/trader/offers"
          className="text-sm font-medium text-ro-plum transition-colors hover:text-[var(--ro-plum-900)] hover:underline"
        >
          {t.viewAllOffers}
        </Link>
      </div>

      {!offersR.ok ? (
        <BlockError dict={dict} compact />
      ) : (
        (() => {
          const rankedOffers = rankOffersByInterest(
            offersR.data,
            parseInterestSlugs(
              traderR.ok ? traderR.data?.interestCategorySlugs : null
            )
          );
          const offerPreview = rankedOffers.slice(0, 4);
          if (offerPreview.length === 0) {
            return null;
          }
          return (
            <ul className="flex gap-3 overflow-x-auto pb-1">
              {offerPreview.map((o) => {
                const title =
                  locale === "ar"
                    ? o.titleAr || o.titleEn || o.slug
                    : o.titleEn || o.titleAr || o.slug;
                const summary =
                  locale === "ar"
                    ? o.summaryAr || o.summaryEn
                    : o.summaryEn || o.summaryAr;
                const productName = o.product
                  ? locale === "ar"
                    ? o.product.nameAr || o.product.nameEn
                    : o.product.nameEn || o.product.nameAr
                  : null;
                const imagePath = o.product?.images?.[0]?.path ?? null;
                return (
                  <li key={o.id} className="w-64 shrink-0">
                    <PressLink
                      href={`/trader/offers/${o.slug}`}
                      className="ro-portal-card group block overflow-hidden border focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ro-focus)]"
                    >
                      <div className="relative h-28 bg-[var(--ro-sand-200)]">
                        {imagePath ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={imagePath}
                            alt=""
                            className="size-full object-cover"
                          />
                        ) : (
                          <Image
                            src="/brand/hero-oud-atelier-d.jpg"
                            alt=""
                            fill
                            className="object-cover opacity-80"
                            sizes="256px"
                          />
                        )}
                      </div>
                      <div className="space-y-2 p-4">
                        <p className="font-display font-semibold leading-snug transition-colors group-hover:text-[var(--ro-plum-900)]">
                          {title}
                        </p>
                        {summary ? (
                          <p className="line-clamp-2 text-xs text-ro-muted">
                            {summary}
                          </p>
                        ) : null}
                        {productName ? (
                          <p className="line-clamp-1 text-xs font-semibold text-[var(--ro-plum-800)]">
                            {productName}
                          </p>
                        ) : null}
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
      <div className="space-y-3">
        <h2 className="ro-portal-section-title flex items-center gap-2">
          <span className="ro-portal-icon-well size-8 [&>svg]:size-4" aria-hidden>
            <Activity className="size-4" strokeWidth={1.5} />
          </span>
          {t.recentActivity}
        </h2>
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
      title: fmt(t.activityDeal, { ref: d.reference }),
      actor: t.actorRole.trader,
      href: `/trader/deals/${d.id}`,
      kind: "deal" as const,
    })),
    ...wholesale.map((w) => ({
      id: `ws-${w.id}`,
      at: w.updatedAt,
      title: fmt(t.activityWholesale, { ref: w.reference }),
      actor: t.actorRole.trader,
      href: `/trader/wholesale/${w.id}`,
      kind: "wholesale" as const,
    })),
    ...brokerage.map((b) => ({
      id: `br-${b.id}`,
      at: b.updatedAt,
      title: b.reference,
      actor: t.actorRole.trader,
      href: `/trader/brokerage/${b.id}`,
      kind: "brokerage" as const,
    })),
  ]
    .sort((a, b) => b.at.getTime() - a.at.getTime())
    .slice(0, 5);

  return (
    <div className="space-y-3">
      <h2 className="ro-portal-section-title flex items-center gap-2">
        <span className="ro-portal-icon-well size-8 [&>svg]:size-4" aria-hidden>
          <Activity className="size-4" strokeWidth={1.5} />
        </span>
        {t.recentActivity}
      </h2>
      {activity.length === 0 ? (
        <EmptyState
          variant="first-use"
          title={t.recentActivity}
          body={t.recentActivityEmpty}
          actionHref="/trader/deals/new"
          actionLabel={t.taskDealTitle}
        />
      ) : (
        <div className="ro-portal-card border p-3 md:p-4">
          <Timeline
            label={t.recentActivity}
            events={activity.map((ev) => ({
              id: ev.id,
              title: ev.title,
              actor: ev.actor,
              relativeTime: formatRelative(ev.at, locale),
              absoluteTime: formatDate(ev.at, locale, {
                dateStyle: "medium",
                timeStyle: "short",
              }),
              icon:
                ev.kind === "wholesale" ? (
                  <Package className="size-4" strokeWidth={1.5} aria-hidden />
                ) : ev.kind === "brokerage" ? (
                  <Compass className="size-4" strokeWidth={1.5} aria-hidden />
                ) : (
                  <Handshake className="size-4" strokeWidth={1.5} aria-hidden />
                ),
              tone:
                ev.kind === "wholesale"
                  ? "wholesale"
                  : ev.kind === "brokerage"
                    ? "deal"
                    : "deal",
              detail: (
                <Link href={ev.href} className="ro-icon-btn">
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

function HeaderSkeleton() {
  return <Skeleton className="h-16 w-full max-w-xl" />;
}

function WaitingSkeleton() {
  return <Skeleton className="min-h-[12rem] lg:col-span-6" />;
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
    <section data-trader-home className="relative space-y-8">
      <div className="relative space-y-10">
        <Suspense fallback={<HeaderSkeleton />}>
          <HomeGreeting
            traderId={session.sub}
            traderName={session.displayName}
            locale={locale}
            dict={dict}
          />
        </Suspense>

        <PortalReveal className="grid items-stretch gap-6 lg:grid-cols-12 lg:gap-8">
          <Suspense fallback={<WaitingSkeleton />}>
            <WaitingBlock
              traderId={session.sub}
              locale={locale}
              dict={dict}
            />
          </Suspense>
          <TasksBlock dict={dict} />
        </PortalReveal>

        <PortalReveal>
          <Suspense fallback={<StatsSkeleton />}>
            <StatsBlock traderId={session.sub} dict={dict} />
          </Suspense>
        </PortalReveal>

        <PortalReveal>
          <Suspense fallback={<OffersSkeleton />}>
            <OffersBlock
              traderId={session.sub}
              locale={locale}
              dict={dict}
            />
          </Suspense>
        </PortalReveal>

        <PortalReveal>
          <Suspense fallback={<ActivitySkeleton />}>
            <ActivityBlock
              traderId={session.sub}
              locale={locale}
              dict={dict}
            />
          </Suspense>
        </PortalReveal>
      </div>
    </section>
  );
}
