import Link from "next/link";
import { Handshake, Package } from "lucide-react";
import { DealCard } from "@/components/trader/deal-card";
import { TaskCard } from "@/components/trader/task-card";
import { Timeline } from "@/components/ui/timeline";
import { requireTraderSession } from "@/lib/auth/trader-session";
import { listDealsForTrader } from "@/lib/deals/service";
import { formatDate, formatRelative } from "@/lib/i18n/format";
import { listPublishedPublicOffers } from "@/lib/offers/service";
import { listWholesaleRequestsForTrader } from "@/lib/wholesale/service";
import { getRequestDictionary } from "@/lib/i18n/server";
import { dealNextActor, getStatusMeta } from "@/lib/ui/status";
import {
  dealStatusLabel,
  fmt,
  wholesaleStatusLabel,
} from "@/lib/ui/trader-labels";

export default async function TraderHomePage() {
  const session = await requireTraderSession();
  const { locale, dict } = await getRequestDictionary();
  const t = dict.trader;

  const [deals, wholesale, offers] = await Promise.all([
    listDealsForTrader(session.sub),
    listWholesaleRequestsForTrader(session.sub),
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
  const welcome = t.welcome.replace("{name}", session.displayName);
  const myDeals = t.myDeals.replace("{n}", String(deals.length));

  return (
    <section className="space-y-10">
      <header className="space-y-2">
        <h1 className="font-display text-3xl font-semibold tracking-tight">
          {welcome}
        </h1>
        <p className="max-w-2xl text-sm text-ro-muted">{t.lead}</p>
      </header>

      <div className="grid gap-8 lg:grid-cols-12">
        <div className="space-y-3 lg:col-span-7">
          <h2 className="text-lg font-semibold">{t.waitingTitle}</h2>
          {waiting.length === 0 ? (
            <p className="border border-ro-line bg-[var(--ro-success-100)] px-4 py-3 text-sm text-[var(--ro-success-700)]">
              {t.waitingIdle}
            </p>
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

        <div className="space-y-3 lg:col-span-5">
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
          <Link
            href="/trader/deals"
            className="inline-flex min-h-11 items-center border border-ro-line px-4 text-sm font-medium text-ro-plum transition-colors hover:border-ro-ink/35 hover:bg-ro-sunken"
          >
            {myDeals}
          </Link>
        </div>
      </div>

      {offerPreview.length > 0 ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold">{t.offersNow}</h2>
            <Link
              href="/trader/offers"
              className="text-sm text-ro-plum hover:underline"
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
                <li
                  key={o.id}
                  className="w-64 shrink-0 border border-ro-line bg-ro-surface p-4"
                >
                  <Link href="/trader/offers" className="block space-y-2">
                    <p className="font-semibold leading-snug">{title}</p>
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
        </div>
      ) : null}

      <div className="space-y-3">
        <h2 className="text-lg font-semibold">{t.recentActivity}</h2>
        {activity.length === 0 ? (
          <p className="text-sm text-ro-muted">{t.recentActivityEmpty}</p>
        ) : (
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
                  className="text-ro-plum hover:underline"
                >
                  {t.openRecord}
                </Link>
              ),
            }))}
          />
        )}
      </div>
    </section>
  );
}
