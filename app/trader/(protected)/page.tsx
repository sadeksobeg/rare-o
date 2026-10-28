import { Suspense } from "react";
import Link from "next/link";
import { Activity, Handshake, Home, Package, Sparkles } from "lucide-react";
import { CountUp } from "@/components/motion/count-up";
import { DrawIn, RosetteMark } from "@/components/motion/draw-in";
import { Stagger } from "@/components/motion/reveal";
import { HomeAmbient } from "@/components/portal/home-ambient";
import { PressLink } from "@/components/portal/press-link";
import { DealCard } from "@/components/trader/deal-card";
import { TaskCard } from "@/components/trader/task-card";
import { TraderPageHeader } from "@/components/trader/page-header";
import { PortalReveal } from "@/components/portal/reveal";
import { Timeline } from "@/components/ui/timeline";
import { Skeleton } from "@/components/ui/skeleton";
import { ButtonLink } from "@/components/ui/button";
import { requireTraderSession } from "@/lib/auth/trader-session";
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

async function TraderHomeBody({
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
  const [deals, wholesale, offers, trader] = await Promise.all([
    listDealsForTrader(traderId),
    listWholesaleRequestsForTrader(traderId),
    listPublishedPublicOffers(),
    prisma.traderAccount.findUnique({
      where: { id: traderId },
      select: { interestCategorySlugs: true },
    }),
  ]);
  const rankedOffers = rankOffersByInterest(
    offers,
    parseInterestSlugs(trader?.interestCategorySlugs)
  );

  const waitingDeals = deals.filter((d) => {
    const last = d.entries[0]?.actorRole as "trader" | "admin" | undefined;
    return dealNextActor(d.status, last ?? null) === "trader";
  });
  const waitingWholesale = wholesale.filter(
    (w) => getStatusMeta("wholesale", w.status).nextActor === "trader"
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
  ];

  const activity = [
    ...deals.map((d) => ({
      id: `deal-${d.id}`,
      at: d.updatedAt,
      title: fmt(t.activityDeal, { ref: d.reference }),
      actor: t.actorRole.trader,
      href: `/trader/deals/${d.id}`,
    })),
    ...wholesale.map((w) => ({
      id: `ws-${w.id}`,
      at: w.updatedAt,
      title: fmt(t.activityWholesale, { ref: w.reference }),
      actor: t.actorRole.trader,
      href: `/trader/wholesale/${w.id}`,
    })),
  ]
    .sort((a, b) => b.at.getTime() - a.at.getTime())
    .slice(0, 5);

  const offerPreview = rankedOffers.slice(0, 4);
  const myDeals = t.myDeals.replace("{n}", String(deals.length));
  const today = formatDate(new Date(), locale, {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
  const waitingLine =
    waiting.length === 0
      ? t.waitingTodayZero.replace("{date}", today)
      : t.waitingToday
          .replace("{n}", String(waiting.length))
          .replace("{date}", today);

  return (
    <div className="relative space-y-10">
      <HomeAmbient />
      <TraderPageHeader
        title={greetingHeadline(traderName, dict.common)}
        description={`${waitingLine} — ${t.lead}`}
        icon={<Home className="size-5" strokeWidth={1.5} />}
      />
      {/* TR-02 desktop: waiting + tasks balanced 6/6 */}
      <PortalReveal className="grid items-stretch gap-6 lg:grid-cols-12 lg:gap-8">
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
                <ButtonLink
                  href="/trader/deals"
                  variant="secondary"
                  size="sm"
                >
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

        <div className="flex flex-col space-y-3 lg:col-span-6">
          <h2 className="ro-portal-section-title flex items-center gap-2">
            <span className="ro-portal-icon-well size-8 [&>svg]:size-4" aria-hidden>
              <Sparkles className="size-4" strokeWidth={1.5} />
            </span>
            {t.homeTasksTitle}
          </h2>
          <div className="grid flex-1 gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
            <TaskCard
              href="/trader/deals/new"
              title={t.taskDealTitle}
              body={t.taskDealBody}
              icon={Handshake}
            />
            <TaskCard
              href="/trader/wholesale"
              title={t.taskWholesaleTitle}
              body={t.taskWholesaleBody}
              icon={Package}
            />
          </div>
        </div>
      </PortalReveal>

      {offerPreview.length > 0 ? (
        <PortalReveal className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-display text-xl font-semibold">{t.offersNow}</h2>
            <Link
              href="/trader/offers"
              className="text-sm font-medium text-ro-plum transition-colors hover:text-[var(--ro-plum-900)] hover:underline"
            >
              {t.viewAllOffers}
            </Link>
          </div>
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
              return (
                <li key={o.id} className="w-64 shrink-0">
                  <PressLink
                    href={`/trader/offers/${o.slug}`}
                    className="ro-portal-card group block space-y-2 border p-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ro-focus)]"
                  >
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
                  </PressLink>
                </li>
              );
            })}
          </ul>
        </PortalReveal>
      ) : null}

      <PortalReveal className="space-y-3">
        <h2 className="ro-portal-section-title flex items-center gap-2">
          <span className="ro-portal-icon-well size-8 [&>svg]:size-4" aria-hidden>
            <Activity className="size-4" strokeWidth={1.5} />
          </span>
          {t.recentActivity}
        </h2>
        {activity.length === 0 ? (
          <p className="ro-portal-card border p-4 text-sm font-semibold text-ro-muted">
            {t.recentActivityEmpty}
          </p>
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
                icon: ev.id.startsWith("ws-") ? (
                  <Package className="size-4" strokeWidth={1.5} aria-hidden />
                ) : (
                  <Handshake className="size-4" strokeWidth={1.5} aria-hidden />
                ),
                tone: ev.id.startsWith("ws-") ? "wholesale" : "deal",
                detail: (
                  <Link href={ev.href} className="ro-icon-btn">
                    {t.openRecord}
                  </Link>
                ),
              }))}
            />
          </div>
        )}
      </PortalReveal>
    </div>
  );
}

export default async function TraderHomePage() {
  const session = await requireTraderSession();
  const { locale, dict } = await getRequestDictionary();

  return (
    <section data-trader-home className="relative space-y-8">
      <Suspense
        fallback={
          <div className="space-y-6" aria-busy="true">
            <div className="h-16" />
            <div className="grid gap-6 lg:grid-cols-12">
              <Skeleton className="h-48 lg:col-span-6" />
              <div className="grid gap-3 lg:col-span-6 sm:grid-cols-2">
                <Skeleton className="h-24" />
                <Skeleton className="h-24" />
              </div>
            </div>
            <Skeleton className="h-40 w-full" />
          </div>
        }
      >
        <TraderHomeBody
          traderId={session.sub}
          traderName={session.displayName}
          locale={locale}
          dict={dict}
        />
      </Suspense>
    </section>
  );
}
