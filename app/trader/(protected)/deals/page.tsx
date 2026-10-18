import Link from "next/link";
import { Suspense } from "react";
import { Plus } from "lucide-react";
import { DealCard } from "@/components/trader/deal-card";
import { TraderPageHeader } from "@/components/trader/page-header";
import { ButtonLink } from "@/components/ui/button";
import { ListFilterTabs } from "@/components/ui/list-filter-tabs";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusChip } from "@/components/ui/status-chip";
import { requireTraderSession } from "@/lib/auth/trader-session";
import { isOpenDealStatus, isDealStatus } from "@/lib/deals/constants";
import { listDealsForTrader } from "@/lib/deals/service";
import { getRequestDictionary } from "@/lib/i18n/server";
import { dealNextActor, getStatusMeta } from "@/lib/ui/status";
import { dealStatusLabel, fmt } from "@/lib/ui/trader-labels";

type TabId = "all" | "waiting" | "negotiating" | "closed";

export default async function TraderDealsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const session = await requireTraderSession();
  const { tab: tabRaw } = await searchParams;
  const { dict } = await getRequestDictionary();
  const t = dict.trader;
  const deals = await listDealsForTrader(session.sub);

  const rows = deals.map((d) => {
    const last = (d.entries[0]?.actorRole ?? null) as "trader" | "admin" | null;
    const waiting = dealNextActor(d.status, last) === "trader";
    const open = isDealStatus(d.status) && isOpenDealStatus(d.status);
    return {
      deal: d,
      tone: getStatusMeta("deal", d.status).tone,
      statusLabel: dealStatusLabel(t, d.status),
      kindLabel: t.dealKind[d.dealKind] ?? d.dealKind,
      waiting,
      open,
      negotiating: d.status === "negotiating",
      closed: !open,
    };
  });

  const counts = {
    all: rows.length,
    waiting: rows.filter((r) => r.waiting).length,
    negotiating: rows.filter((r) => r.negotiating).length,
    closed: rows.filter((r) => r.closed).length,
  };

  const tab = (
    ["all", "waiting", "negotiating", "closed"].includes(tabRaw || "")
      ? tabRaw
      : "all"
  ) as TabId;

  const filtered = rows.filter((r) => {
    if (tab === "waiting") return r.waiting;
    if (tab === "negotiating") return r.negotiating;
    if (tab === "closed") return r.closed;
    return true;
  });

  return (
    <section className="ro-portal-stagger relative space-y-6 p-5 pb-20 sm:p-8 md:p-10 md:pb-10">
      <TraderPageHeader
        title={t.dealsTitle}
        action={
          <ButtonLink
            href="/trader/deals/new"
            variant="primary"
            size="sm"
            className="hidden md:inline-flex"
          >
            <Plus className="size-4" aria-hidden />
            {t.newDeal}
          </ButtonLink>
        }
      />

      <Suspense fallback={null}>
        <ListFilterTabs
          label={t.dealsTabList}
          tabs={[
            { id: "all", label: t.dealsTabAll, count: counts.all },
            { id: "waiting", label: t.dealsTabWaiting, count: counts.waiting },
            {
              id: "negotiating",
              label: t.dealsTabNegotiating,
              count: counts.negotiating,
            },
            { id: "closed", label: t.dealsTabClosed, count: counts.closed },
          ]}
        />
      </Suspense>

      {filtered.length === 0 ? (
        <EmptyState
          title={t.dealsEmpty}
          body={t.dealsEmptyBody}
          actionHref="/trader/deals/new"
          actionLabel={t.newDeal}
        />
      ) : (
        <>
          <ul className="space-y-3 md:hidden">
            {filtered.map(
              ({ deal: d, tone, statusLabel, kindLabel, waiting }) => (
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
              )
            )}
          </ul>

          <div className="hidden overflow-x-auto border border-ro-line md:block">
            <table className="min-w-full text-start text-sm">
              <thead className="border-b border-ro-line bg-ro-surface">
                <tr>
                  <th className="p-3 text-start font-medium">
                    {t.colReference}
                  </th>
                  <th className="p-3 text-start font-medium">{t.colTitle}</th>
                  <th className="p-3 text-start font-medium">{t.colKind}</th>
                  <th className="p-3 text-start font-medium">{t.colStatus}</th>
                  <th className="p-3 text-start font-medium">{t.colEntries}</th>
                  <th className="p-3" />
                </tr>
              </thead>
              <tbody>
                {filtered.map(
                  ({ deal: d, tone, statusLabel, kindLabel, waiting }) => (
                    <tr key={d.id} className="border-b border-ro-line">
                      <td className="p-3">{d.reference}</td>
                      <td className="p-3">{d.title}</td>
                      <td className="p-3">{kindLabel}</td>
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
                  )
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      <Link
        href="/trader/deals/new"
        aria-label={t.newDeal}
        className="fixed bottom-20 end-4 z-30 inline-flex size-14 items-center justify-center rounded-full bg-[linear-gradient(165deg,var(--ro-plum-700),var(--ro-plum-900))] text-[var(--ro-sand-100)] shadow-[0_12px_32px_-8px_color-mix(in_srgb,var(--ro-plum-900)_70%,transparent)] transition-transform duration-[var(--ro-dur-fast)] hover:scale-105 active:scale-95 md:hidden"
      >
        <Plus className="size-6" aria-hidden />
      </Link>
    </section>
  );
}
