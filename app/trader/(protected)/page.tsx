import { Suspense } from "react";
import Link from "next/link";
import { Handshake, Package } from "lucide-react";
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
import type { Dictionary } from "@/lib/i18n/dictionaries";
import type { Locale } from "@/lib/i18n/config";
import { listPublishedPublicOffers } from "@/lib/offers/service";
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
  locale,
  dict,
}: {
  traderId: string;
  locale: Locale;
  dict: Dictionary;
}) {
  const t = dict.trader;
  const [deals, wholesale, offers] = await Promise.all([
    listDealsForTrader(traderId),
    listWholesaleRequestsForTrader(traderId),
    listPublishedPublicOffers(),
  ]);

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

  const offerPreview = offers.slice(0, 4);
  const myDeals = t.myDeals.replace("{n}", String(deals.length));

  return (
    <div className="space-y-10">
      {/* TR-02 desktop: waiting + tasks balanced 6/6 */}
      <PortalReveal className="grid items-stretch gap-6 lg:grid-cols-12 lg:gap-8">
        <div className="flex flex-col space-y-3 lg:col-span-6">
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="font-display text-xl font-semibold">
              {t.waitingTitle}
            </h2>
            {waiting.length > 0 ? (
              <span className="text-xs tabular-nums text-ro-muted">
                {waiting.length}
              </span>
            ) : null}
          </div>
          <div className="ro-portal-card flex min-h-[12rem] flex-1 flex-col border p-4 sm:p-5">
            {waiting.length === 0 ? (
              <div className="flex flex-1 flex-col justify-center gap-3">
                <p className="text-sm font-medium text-[var(--ro-success-700)]">
                  {t.waitingIdle}
                </p>
                <p className="text-sm text-ro-muted">{t.lead}</p>
                <ButtonLink
                  href="/trader/deals"
                  variant="secondary"
                  size="sm"
                  className="self-start"
                >
                  {myDeals}
                </ButtonLink>
              </div>
            ) : (
              <ul className="space-y-3">
                {waiting.map((item) => (
                  <li key={item.key}>
                    <DealCard
                      href={item.href}
                      reference={item.reference}
                      title={item.title}
                      tone={item.tone}
                      statusLabel={item.label}
                      waitingLabel={t.waitingOnYou}
                    />
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="flex flex-col space-y-3 lg:col-span-6">
          <h2 className="font-display text-xl font-semibold">
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
              return (
                <li key={o.id} className="w-64 shrink-0">
                  <Link
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
                  </Link>
                </li>
              );
            })}
          </ul>
        </PortalReveal>
      ) : null}

      <PortalReveal className="space-y-3">
        <h2 className="font-display text-xl font-semibold">
          {t.recentActivity}
        </h2>
        {activity.length === 0 ? (
          <p className="ro-portal-card border p-4 text-sm text-ro-muted">
            {t.recentActivityEmpty}
          </p>
        ) : (
          <div className="ro-portal-card border p-4">
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
                detail: (
                  <Link
                    href={ev.href}
                    className="font-semibold text-ro-plum hover:underline"
                  >
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
  const t = dict.trader;
  const welcome = t.welcome.replace("{name}", session.displayName);

  return (
    <section className="space-y-10 p-5 sm:p-8 md:p-10">
      <TraderPageHeader title={welcome} description={t.lead} />
      <Suspense
        fallback={
          <div className="space-y-6" aria-busy="true">
            <div className="grid gap-4 lg:grid-cols-2">
              <Skeleton className="h-48" />
              <Skeleton className="h-48" />
            </div>
            <Skeleton className="h-40 w-full" />
          </div>
        }
      >
        <TraderHomeBody
          traderId={session.sub}
          locale={locale}
          dict={dict}
        />
      </Suspense>
    </section>
  );
}
