import Link from "next/link";
import { Handshake, Package } from "lucide-react";
import { TaskCard } from "@/components/trader/task-card";
import { StatusChip } from "@/components/ui/status-chip";
import { requireTraderSession } from "@/lib/auth/trader-session";
import { listDealsForTrader } from "@/lib/deals/service";
import { listPublishedPublicOffers } from "@/lib/offers/service";
import { listWholesaleRequestsForTrader } from "@/lib/wholesale/service";
import { getRequestDictionary } from "@/lib/i18n/server";
import { dealNextActor, getStatusMeta } from "@/lib/ui/status";
import {
  dealStatusLabel,
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
      title: d.reference,
      meta: getStatusMeta("deal", d.status),
      label: dealStatusLabel(t, d.status),
    })),
    ...waitingWholesale.map((w) => ({
      key: `ws-${w.id}`,
      href: `/trader/wholesale/${w.id}`,
      title: w.reference,
      meta: getStatusMeta("wholesale", w.status),
      label: wholesaleStatusLabel(t, w.status),
    })),
  ];

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
            <ul className="divide-y divide-ro-line border border-ro-line">
              {waiting.map((item) => (
                <li key={item.key}>
                  <Link
                    href={item.href}
                    className="flex flex-wrap items-center justify-between gap-2 p-4 text-sm hover:bg-ro-sunken"
                  >
                    <span className="font-medium">{item.title}</span>
                    <StatusChip
                      tone={item.meta.tone}
                      label={item.label}
                      size="sm"
                    />
                    <span className="text-ro-plum">{t.openRecord}</span>
                  </Link>
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
            className="inline-block text-sm text-ro-plum hover:underline"
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
                locale === "ar" ? o.summaryAr || o.summaryEn : o.summaryEn || o.summaryAr;
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
    </section>
  );
}
