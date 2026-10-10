import Link from "next/link";
import { DealCard } from "@/components/trader/deal-card";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusChip } from "@/components/ui/status-chip";
import { requireTraderSession } from "@/lib/auth/trader-session";
import { listDealsForTrader } from "@/lib/deals/service";
import { getRequestDictionary } from "@/lib/i18n/server";
import { dealNextActor, getStatusMeta } from "@/lib/ui/status";
import { dealStatusLabel, fmt } from "@/lib/ui/trader-labels";

export default async function TraderDealsPage() {
  const session = await requireTraderSession();
  const { dict } = await getRequestDictionary();
  const t = dict.trader;
  const deals = await listDealsForTrader(session.sub);

  const rows = deals.map((d) => {
    const last = (d.entries[0]?.actorRole ?? null) as "trader" | "admin" | null;
    return {
      deal: d,
      tone: getStatusMeta("deal", d.status).tone,
      statusLabel: dealStatusLabel(t, d.status),
      kindLabel: t.dealKind[d.dealKind] ?? d.dealKind,
      waiting: dealNextActor(d.status, last) === "trader",
    };
  });

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h1 className="font-display text-3xl font-semibold tracking-tight">
          {t.dealsTitle}
        </h1>
        <Link
          href="/trader/deals/new"
          className="inline-flex min-h-11 items-center bg-ro-purple px-4 text-sm text-ro-ivory"
        >
          {t.newDeal}
        </Link>
      </div>

      {rows.length === 0 ? (
        <EmptyState
          title={t.dealsEmpty}
          body={t.dealsEmptyBody}
          actionHref="/trader/deals/new"
          actionLabel={t.newDeal}
        />
      ) : (
        <>
          <ul className="space-y-3 md:hidden">
            {rows.map(({ deal: d, tone, statusLabel, kindLabel, waiting }) => (
              <li key={d.id}>
                <DealCard
                  href={`/trader/deals/${d.id}`}
                  reference={d.reference}
                  title={d.title}
                  tone={tone}
                  statusLabel={statusLabel}
                  waitingLabel={waiting ? t.waitingOnYou : null}
                  meta={`${kindLabel} · ${fmt(t.entriesCount, { n: d._count.entries })}`}
                />
              </li>
            ))}
          </ul>

          <div className="hidden overflow-x-auto border border-ro-line md:block">
            <table className="min-w-full text-start text-sm">
              <thead className="border-b border-ro-line bg-ro-surface">
                <tr>
                  <th className="p-3 text-start font-medium">{t.colReference}</th>
                  <th className="p-3 text-start font-medium">{t.colTitle}</th>
                  <th className="p-3 text-start font-medium">{t.colKind}</th>
                  <th className="p-3 text-start font-medium">{t.colStatus}</th>
                  <th className="p-3 text-start font-medium">{t.colEntries}</th>
                  <th className="p-3" />
                </tr>
              </thead>
              <tbody>
                {rows.map(({ deal: d, tone, statusLabel, kindLabel, waiting }) => (
                  <tr key={d.id} className="border-b border-ro-line">
                    <td className="p-3">{d.reference}</td>
                    <td className="p-3">{d.title}</td>
                    <td className="p-3">{kindLabel}</td>
                    <td className="p-3">
                      <span className="flex flex-wrap items-center gap-2">
                        <StatusChip tone={tone} label={statusLabel} size="sm" />
                        {waiting ? (
                          <StatusChip
                            tone="attention"
                            label={t.waitingOnYou}
                            size="sm"
                          />
                        ) : null}
                      </span>
                    </td>
                    <td className="p-3">{d._count.entries}</td>
                    <td className="p-3">
                      <Link
                        href={`/trader/deals/${d.id}`}
                        className="text-ro-plum hover:underline"
                      >
                        {t.openRecord}
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </section>
  );
}
