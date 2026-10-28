import Link from "next/link";
import { Suspense } from "react";
import { Package, Plus } from "lucide-react";
import {
  DataTable,
  DataTableHead,
  RowHit,
  Td,
  Th,
  Tr,
} from "@/components/admin/data-table";
import { PressRipple } from "@/components/motion/press-ripple";
import { PressLink } from "@/components/portal/press-link";
import { DealCard } from "@/components/trader/deal-card";
import { TraderPageHeader } from "@/components/trader/page-header";
import { ButtonLink } from "@/components/ui/button";
import { ListFilterTabs } from "@/components/ui/list-filter-tabs";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusChip } from "@/components/ui/status-chip";
import { isFresh } from "@/lib/ui/fresh";
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
    <section className="ro-portal-stagger relative space-y-6 pb-20 md:pb-0">
      <TraderPageHeader
        title={t.wsMyRequests}
        icon={<Package className="size-5" strokeWidth={2} />}
        action={
          <ButtonLink
            href="/trader/wholesale"
            variant="primary"
            size="sm"
            className="hidden md:inline-flex"
          >
            <Plus className="size-4" aria-hidden />
            {t.wsNewRequest}
          </ButtonLink>
        }
      />

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
                  className={isFresh(r.updatedAt) ? "ro-s10-flash" : undefined}
                />
              </li>
            ))}
          </ul>

          <div className="hidden md:block">
            <DataTable>
              <DataTableHead>
                <Th>{t.wsColReference}</Th>
                <Th>{t.wsColMode}</Th>
                <Th>{t.wsColStatus}</Th>
                <Th>{t.wsColLines}</Th>
                <Th />
              </DataTableHead>
              <tbody>
                {filtered.map(
                  ({ r, tone, statusLabel, modeLabel, waiting }) => (
                    <Tr key={r.id} flash={isFresh(r.updatedAt)}>
                      <Td>
                        <RowHit href={`/trader/wholesale/${r.id}`}>
                          {r.reference}
                        </RowHit>
                      </Td>
                      <Td>{modeLabel}</Td>
                      <Td>
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
                      </Td>
                      <Td className="tabular-nums">{r._count.lines}</Td>
                      <Td>
                        <PressLink
                          href={`/trader/wholesale/${r.id}`}
                          className="text-sm font-semibold text-ro-plum hover:underline"
                        >
                          {t.openRecord}
                        </PressLink>
                      </Td>
                    </Tr>
                  )
                )}
              </tbody>
            </DataTable>
          </div>
        </>
      )}

      <PressRipple className="fixed bottom-20 end-4 z-30 rounded-full md:hidden">
        <Link
          href="/trader/wholesale"
          aria-label={t.wsNewRequest}
          className="inline-flex size-14 items-center justify-center rounded-full bg-[linear-gradient(165deg,var(--ro-plum-700),var(--ro-plum-900))] text-[var(--ro-sand-100)] shadow-[0_12px_32px_-8px_color-mix(in_srgb,var(--ro-plum-900)_70%,transparent)] transition-transform duration-[var(--ro-dur-fast)] hover:scale-105 active:scale-95"
        >
          <Plus className="size-6" aria-hidden />
        </Link>
      </PressRipple>
    </section>
  );
}
