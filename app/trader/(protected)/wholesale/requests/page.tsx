import Link from "next/link";
import { Suspense } from "react";
import { Package, Plus } from "lucide-react";
import { PressRipple } from "@/components/motion/press-ripple";
import { DealsFilterTabs } from "@/components/trader/deals-filter-tabs";
import { TraderPageHeader } from "@/components/trader/page-header";
import { WholesaleTable } from "@/components/trader/wholesale-table";
import { EmptyState } from "@/components/ui/empty-state";
import { requireTraderSession } from "@/lib/auth/trader-session";
import { isOpenWholesaleStatus, isWholesaleStatus } from "@/lib/wholesale/constants";
import { getRequestDictionary } from "@/lib/i18n/server";
import { formatListDate } from "@/lib/i18n/format";
import { getStatusMeta } from "@/lib/ui/status";
import { wholesaleStatusLabel } from "@/lib/ui/trader-labels";
import { listWholesaleRequestsForTrader } from "@/lib/wholesale/service";

type StatusTab = "all" | "open" | "closed";

export default async function TraderWholesaleRequestsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; waiting?: string }>;
}) {
  const session = await requireTraderSession();
  const { tab: tabRaw, waiting: waitingRaw } = await searchParams;
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
      updatedLabel: formatListDate(r.updatedAt),
    };
  });

  const counts = {
    all: rows.length,
    open: rows.filter((x) => x.open).length,
    closed: rows.filter((x) => x.closed).length,
    waiting: rows.filter((x) => x.waiting).length,
  };

  const tab = (
    ["all", "open", "closed"].includes(tabRaw || "") ? tabRaw : "all"
  ) as StatusTab;
  const waitingOnly = waitingRaw === "1";

  const filtered = rows.filter((x) => {
    if (tab === "open" && !x.open) return false;
    if (tab === "closed" && !x.closed) return false;
    if (waitingOnly && !x.waiting) return false;
    return true;
  });

  return (
    <section className="relative space-y-6 pb-[calc(120px+80px+env(safe-area-inset-bottom,0px))] min-[901px]:pb-0">
      <TraderPageHeader
        title={t.wsMyRequests}
        icon={<Package className="size-5" strokeWidth={1.5} />}
        action={
          <Link
            href="/trader/wholesale"
            className="rad-btn rad-pri rad-sm !hidden min-[901px]:!inline-flex"
          >
            <Plus className="size-4" aria-hidden />
            {t.wsNewRequest}
          </Link>
        }
      />

      <Suspense fallback={null}>
        <DealsFilterTabs
          label={t.wsTabList}
          tabs={[
            { id: "all", label: t.wsTabAll, count: counts.all },
            { id: "open", label: t.wsTabOpen, count: counts.open },
            { id: "closed", label: t.wsTabClosed, count: counts.closed },
          ]}
          waiting={{
            label: t.dealsActionWaiting,
            count: counts.waiting,
          }}
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
        <WholesaleTable
          rows={filtered.map(
            ({ r, tone, statusLabel, modeLabel, waiting, updatedLabel }) => ({
              id: r.id,
              href: `/trader/wholesale/${r.id}`,
              reference: r.reference,
              modeLabel,
              statusLabel,
              waitingLabel: waiting ? t.waitingOnYou : null,
              tone,
              lines: r._count.lines,
              updatedLabel,
            })
          )}
          labels={{
            reference: t.wsColReference,
            mode: t.wsColMode,
            status: t.wsColStatus,
            lines: t.wsColLines,
            updated: t.colUpdated,
            linesCount: t.profileLinesLabel,
          }}
        />
      )}

      {/* Mobile: inline CTA below list (no FAB overlay on last status pill). Desktop: header CTA. */}
      {filtered.length > 0 ? (
        <div className="min-[901px]:hidden">
          <PressRipple className="block rounded-[12px]">
            <Link
              href="/trader/wholesale"
              className="rad-btn rad-pri flex w-full min-h-12 items-center justify-center gap-2"
            >
              <Plus className="size-4" aria-hidden />
              {t.wsNewRequest}
            </Link>
          </PressRipple>
        </div>
      ) : null}
      <div
        aria-hidden
        className="pointer-events-none h-[calc(88px+env(safe-area-inset-bottom,0px))] min-[901px]:hidden"
      />
    </section>
  );
}
