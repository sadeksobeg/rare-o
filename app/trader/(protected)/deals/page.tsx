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
import { formatRelative } from "@/lib/i18n/format";
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
          ? formatMoney(d.proposedPrice, d.currency, locale)
          : "—",
      updatedLabel: formatRelative(d.updatedAt, locale),
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
    <section className="relative space-y-6 pb-[calc(68px+56px+env(safe-area-inset-bottom,0px)+28px)] min-[901px]:pb-0">
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

      {/* Single mobile CTA: FAB only ≤900px (header CTA ≥901px) */}
      <PressRipple className="fixed end-4 bottom-[calc(68px+env(safe-area-inset-bottom,0px)+12px)] z-30 rounded-full max-[900px]:inline-flex min-[901px]:hidden">
        <Link
          href="/trader/deals/new"
          aria-label={t.newDeal}
          className="inline-flex size-14 items-center justify-center rounded-full bg-[color:var(--rad-btn)] text-[color:var(--rad-btn-tx)] shadow-[0_12px_32px_-8px_color-mix(in_srgb,var(--rad-btn)_70%,transparent)] transition-transform duration-[var(--ro-dur-fast)] hover:scale-105 active:scale-95"
        >
          <Plus className="size-6" aria-hidden />
        </Link>
      </PressRipple>
    </section>
  );
}
