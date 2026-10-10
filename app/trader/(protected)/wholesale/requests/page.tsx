import Link from "next/link";
import { DealCard } from "@/components/trader/deal-card";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusChip } from "@/components/ui/status-chip";
import { requireTraderSession } from "@/lib/auth/trader-session";
import { getRequestDictionary } from "@/lib/i18n/server";
import { getStatusMeta } from "@/lib/ui/status";
import { fmt, wholesaleStatusLabel } from "@/lib/ui/trader-labels";
import { listWholesaleRequestsForTrader } from "@/lib/wholesale/service";

export default async function TraderWholesaleRequestsPage() {
  const session = await requireTraderSession();
  const { dict } = await getRequestDictionary();
  const t = dict.trader;
  const requests = await listWholesaleRequestsForTrader(session.sub);

  const rows = requests.map((r) => {
    const meta = getStatusMeta("wholesale", r.status);
    return {
      r,
      tone: meta.tone,
      statusLabel: wholesaleStatusLabel(t, r.status),
      modeLabel: t.requestMode[r.requestMode] ?? r.requestMode,
      waiting: meta.nextActor === "trader",
    };
  });

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h1 className="font-display text-3xl font-semibold tracking-tight">
          {t.wsMyRequests}
        </h1>
        <Link
          href="/trader/wholesale"
          className="inline-flex min-h-11 items-center bg-ro-purple px-4 text-sm text-ro-ivory"
        >
          {t.wsNewRequest}
        </Link>
      </div>

      {rows.length === 0 ? (
        <EmptyState
          title={t.wsEmpty}
          body={t.wsEmptyBody}
          actionHref="/trader/wholesale"
          actionLabel={t.wsNewRequest}
        />
      ) : (
        <>
          <ul className="space-y-3 md:hidden">
            {rows.map(({ r, tone, statusLabel, modeLabel, waiting }) => (
              <li key={r.id}>
                <DealCard
                  href={`/trader/wholesale/${r.id}`}
                  reference={r.reference}
                  tone={tone}
                  statusLabel={statusLabel}
                  waitingLabel={waiting ? t.waitingOnYou : null}
                  meta={`${modeLabel} · ${fmt(t.wsLinesCount, { n: r._count.lines })}`}
                />
              </li>
            ))}
          </ul>

          <div className="hidden overflow-x-auto border border-ro-line md:block">
            <table className="min-w-full text-start text-sm">
              <thead className="border-b border-ro-line bg-ro-surface">
                <tr>
                  <th className="p-3 text-start font-medium">{t.wsColReference}</th>
                  <th className="p-3 text-start font-medium">{t.wsColMode}</th>
                  <th className="p-3 text-start font-medium">{t.wsColStatus}</th>
                  <th className="p-3 text-start font-medium">{t.wsColLines}</th>
                  <th className="p-3" />
                </tr>
              </thead>
              <tbody>
                {rows.map(({ r, tone, statusLabel, modeLabel, waiting }) => (
                  <tr key={r.id} className="border-b border-ro-line">
                    <td className="p-3">{r.reference}</td>
                    <td className="p-3">{modeLabel}</td>
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
                    <td className="p-3">{r._count.lines}</td>
                    <td className="p-3">
                      <Link
                        href={`/trader/wholesale/${r.id}`}
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
