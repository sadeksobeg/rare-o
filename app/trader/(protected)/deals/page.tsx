import Link from "next/link";
import { Suspense } from "react";
import { Handshake, Plus } from "lucide-react";
import { PressRipple } from "@/components/motion/press-ripple";
import { DealsFilterTabs } from "@/components/trader/deals-filter-tabs";
import { DealsTable } from "@/components/trader/deals-table";
import { TraderPageHeader } from "@/components/trader/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { isFresh } from "@/lib/ui/fresh";
import { requireTraderSession } from "@/lib/auth/trader-session";
import { isDealStatus } from "@/lib/deals/constants";
import { listDealsForTrader } from "@/lib/deals/service";
import { getRequestDictionary } from "@/lib/i18n/server";
import { formatListDate } from "@/lib/i18n/format";
import { dealNextActor, getStatusMeta } from "@/lib/ui/status";
import { dealStatusLabel, formatMoney } from "@/lib/ui/trader-labels";

/** True status partition — counts sum to «الكل». */
type StatusTab = "all" | "open" | "payment" | "done";

function statusBucket(status: string): Exclude<StatusTab, "all"> {
  if (status === "proposed" || status === "negotiating") return "open";
  if (status === "accepted" || status === "awaiting_payment") return "payment";
  return "done";
}

export default async function TraderDealsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; waiting?: string }>;
}) {
  const session = await requireTraderSession();
  const { tab: tabRaw, waiting: waitingRaw } = await searchParams;
  const { dict, locale } = await getRequestDictionary();
  const t = dict.trader;
  const deals = await listDealsForTrader(session.sub);

  const rows = deals.map((d) => {
    const last = (d.entries[0]?.actorRole ?? null) as "trader" | "admin" | null;
    const waiting = dealNextActor(d.status, last) === "trader";
    const bucket = isDealStatus(d.status)
      ? statusBucket(d.status)
      : ("done" as const);
    return {
      deal: d,
      tone: getStatusMeta("deal", d.status).tone,
      statusLabel: dealStatusLabel(t, d.status),
      kindLabel: t.dealKind[d.dealKind] ?? d.dealKind,
      waiting,
      bucket,
      amount:
        d.proposedPrice != null
          ? formatMoney(
              d.proposedPrice,
              d.currency?.trim() || "USD",
              locale
            )
          : "—",
      updatedLabel: formatListDate(d.updatedAt),
    };
  });

  const counts = {
    all: rows.length,
    open: rows.filter((r) => r.bucket === "open").length,
    payment: rows.filter((r) => r.bucket === "payment").length,
    done: rows.filter((r) => r.bucket === "done").length,
    waiting: rows.filter((r) => r.waiting).length,
  };

  const tab = (
    ["all", "open", "payment", "done"].includes(tabRaw || "")
      ? tabRaw
      : "all"
  ) as StatusTab;
  const waitingOnly = waitingRaw === "1";

  const filtered = rows.filter((r) => {
    if (tab !== "all" && r.bucket !== tab) return false;
    if (waitingOnly && !r.waiting) return false;
    return true;
  });

  const tableRows = filtered.map(
    ({ deal: d, tone, statusLabel, kindLabel, waiting, amount, updatedLabel }) => ({
      id: d.id,
      href: `/trader/deals/${d.id}`,
      reference: d.reference,
      title: d.title,
      kindLabel,
      statusLabel,
      waitingLabel: waiting ? t.waitingOnYou : null,
      tone,
      amount,
      updatedLabel,
      messages: d._count.entries,
      flash: isFresh(d.updatedAt),
    })
  );

  return (
    <section className="relative space-y-6 pb-[calc(120px+80px+env(safe-area-inset-bottom,0px))] min-[901px]:pb-0">
      <TraderPageHeader
        title={t.dealsTitle}
        icon={<Handshake className="size-5" strokeWidth={1.5} />}
        action={
          <Link
            href="/trader/deals/new"
            className="rad-btn rad-pri rad-sm hidden min-[901px]:inline-flex"
          >
            <Plus className="size-4" aria-hidden />
            {t.newDeal}
          </Link>
        }
      />

      <Suspense fallback={null}>
        <DealsFilterTabs
          label={t.dealsTabList}
          tabs={[
            { id: "all", label: t.dealsTabAll, count: counts.all },
            { id: "open", label: t.dealsTabOpen, count: counts.open },
            {
              id: "payment",
              label: t.dealsTabPayment,
              count: counts.payment,
            },
            { id: "done", label: t.dealsTabDone, count: counts.done },
          ]}
          waiting={{
            label: t.dealsActionWaiting,
            count: counts.waiting,
          }}
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
        <DealsTable
          rows={tableRows}
          labels={{
            reference: t.colReference,
            title: t.colTitle,
            kind: t.colKind,
            status: t.colStatus,
            updated: t.colUpdated,
            amount: t.colAmount,
            messages: t.colMessages,
          }}
        />
      )}

      {/* Mobile: inline CTA below list (avoids FAB covering last status). Desktop: header CTA. */}
      <div className="max-[900px]:block min-[901px]:hidden">
        <PressRipple className="block rounded-[12px]">
          <Link
            href="/trader/deals/new"
            className="rad-btn rad-pri flex w-full min-h-12 items-center justify-center gap-2"
          >
            <Plus className="size-4" aria-hidden />
            {t.newDeal}
          </Link>
        </PressRipple>
      </div>
      <div
        aria-hidden
        className="pointer-events-none h-[calc(88px+env(safe-area-inset-bottom,0px))] min-[901px]:hidden"
      />
    </section>
  );
}
