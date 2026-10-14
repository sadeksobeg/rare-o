import Link from "next/link";
import { Suspense } from "react";
import { Plus } from "lucide-react";
import { DealCard } from "@/components/trader/deal-card";
import { ListFilterTabs } from "@/components/ui/list-filter-tabs";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusChip } from "@/components/ui/status-chip";
import { requireTraderSession } from "@/lib/auth/trader-session";
import { isOpenWholesaleStatus, isWholesaleStatus } from "@/lib/wholesale/constants";
import { getRequestDictionary } from "@/lib/i18n/server";
import { getStatusMeta } from "@/lib/ui/status";
import { fmt, wholesaleStatusLabel } from "@/lib/ui/trader-labels";
import { listWholesaleRequestsForTrader } from "@/lib/wholesale/service";

type TabId = "all" | "waiting" | "open" | "closed";

export default async function TraderWholesaleRequestsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const session = await requireTraderSession();
  const { tab: tabRaw } = await searchParams;
  const { dict } = await getRequestDictionary();
  const t = dict.trader;
  const requests = await listWholesaleRequestsForTrader(session.sub);

  const rows = requests.map((r) => {
    const meta = getStatusMeta("wholesale", r.status);
    const open =
      isWholesaleStatus(r.status) && isOpenWholesaleStatus(r.status);
    return {
      r,
      tone: meta.tone,
      statusLabel: wholesaleStatusLabel(t, r.status),
      modeLabel: t.requestMode[r.requestMode] ?? r.requestMode,
      waiting: meta.nextActor === "trader",
      open,
      closed: !open,
    };
  });

  const counts = {
    all: rows.length,
    waiting: rows.filter((x) => x.waiting).length,
    open: rows.filter((x) => x.open).length,
    closed: rows.filter((x) => x.closed).length,
  };

  const tab = (
    ["all", "waiting", "open", "closed"].includes(tabRaw || "")
      ? tabRaw
      : "all"
  ) as TabId;

  const filtered = rows.filter((x) => {
    if (tab === "waiting") return x.waiting;
    if (tab === "open") return x.open;
    if (tab === "closed") return x.closed;
    return true;
  });

  return (
    <section className="relative space-y-6 pb-20 md:pb-0">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h1 className="font-display text-3xl font-semibold tracking-tight">
          {t.wsMyRequests}
        </h1>
        <Link
          href="/trader/wholesale"
          className="hidden min-h-11 items-center bg-ro-ink px-4 text-sm font-semibold text-ro-canvas md:inline-flex"
        >
          {t.wsNewRequest}
        </Link>
      </div>

      <Suspense fallback={null}>
        <ListFilterTabs
          label={t.wsTabList}
          tabs={[
            { id: "all", label: t.wsTabAll, count: counts.all },
            { id: "waiting", label: t.wsTabWaiting, count: counts.waiting },
            { id: "open", label: t.wsTabOpen, count: counts.open },
            { id: "closed", label: t.wsTabClosed, count: counts.closed },
          ]}
        />
      </Suspense>

      {filtered.length === 0 ? (
        <EmptyState
          title={t.wsEmpty}
          body={t.wsEmptyBody}
          actionHref="/trader/wholesale"
          actionLabel={t.wsNewRequest}
        />
      ) : (
        <>
          <ul className="space-y-3 md:hidden">
            {filtered.map(({ r, tone, statusLabel, modeLabel, waiting }) => (
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
                  <th className="p-3 text-start font-medium">
                    {t.wsColReference}
                  </th>
                  <th className="p-3 text-start font-medium">{t.wsColMode}</th>
                  <th className="p-3 text-start font-medium">{t.wsColStatus}</th>
                  <th className="p-3 text-start font-medium">{t.wsColLines}</th>
                  <th className="p-3" />
                </tr>
              </thead>
              <tbody>
                {filtered.map(
                  ({ r, tone, statusLabel, modeLabel, waiting }) => (
                    <tr key={r.id} className="border-b border-ro-line">
                      <td className="p-3">{r.reference}</td>
                      <td className="p-3">{modeLabel}</td>
                      <td className="p-3">
                        <span className="flex flex-wrap items-center gap-2">
                          <StatusChip
                            tone={tone}
                            label={statusLabel}
                            size="sm"
                          />
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
                  )
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      <Link
        href="/trader/wholesale"
        aria-label={t.wsNewRequest}
        className="fixed bottom-20 end-4 z-30 inline-flex size-14 items-center justify-center rounded-full bg-ro-ink text-ro-canvas shadow-[0_8px_24px_rgba(11,8,13,0.28)] md:hidden"
      >
        <Plus className="size-6" aria-hidden />
      </Link>
    </section>
  );
}
