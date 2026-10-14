import { NegotiationThread } from "@/components/deals/negotiation-thread";
import { Banner } from "@/components/ui/banner";
import { StatusChip } from "@/components/ui/status-chip";
import { requireTraderSession } from "@/lib/auth/trader-session";
import { getDealForTrader } from "@/lib/deals/service";
import { isOpenDealStatus, isDealStatus } from "@/lib/deals/constants";
import { getRequestDictionary } from "@/lib/i18n/server";
import { dealNextActor, getStatusMeta } from "@/lib/ui/status";
import {
  dealStatusLabel,
  fmt,
  formatMoney,
} from "@/lib/ui/trader-labels";
import { notFound } from "next/navigation";

export default async function TraderDealDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireTraderSession();
  const { id } = await params;
  const { locale, dict } = await getRequestDictionary();
  const t = dict.trader;

  let deal;
  try {
    deal = await getDealForTrader(id, session.sub);
  } catch {
    notFound();
  }

  const open =
    isDealStatus(deal.status) && isOpenDealStatus(deal.status);
  const lastActor = (deal.entries[deal.entries.length - 1]?.actorRole ??
    null) as "trader" | "admin" | null;
  const nextActor = dealNextActor(deal.status, lastActor);
  const statusText = dealStatusLabel(t, deal.status);
  const productName = deal.product
    ? locale === "ar"
      ? deal.product.nameAr || deal.product.nameEn
      : deal.product.nameEn || deal.product.nameAr
    : null;

  return (
    <section className="space-y-8">
      <div className="space-y-2">
        <p className="text-sm text-ro-muted">{deal.reference}</p>
        <h1 className="font-display text-3xl font-semibold tracking-tight">
          {deal.title}
        </h1>
        <p className="flex flex-wrap items-center gap-2 text-sm">
          <StatusChip
            tone={getStatusMeta("deal", deal.status).tone}
            label={statusText}
          />
          <span className="text-ro-muted">
            {t.dealKind[deal.dealKind] ?? deal.dealKind}
          </span>
        </p>
      </div>

      {open && nextActor === "trader" ? (
        <Banner tone="attention">{t.dealWaitingBanner}</Banner>
      ) : open && nextActor === "admin" ? (
        <Banner tone="info">{t.dealWaitingAdmin}</Banner>
      ) : null}

      <dl className="grid gap-3 text-sm md:grid-cols-2">
        <div>
          <dt className="text-ro-muted">{t.dealProduct}</dt>
          <dd>{deal.product ? productName : t.dealNonCatalog}</dd>
        </div>
        <div>
          <dt className="text-ro-muted">{t.dealSnapshot}</dt>
          <dd>
            {deal.proposedPrice != null
              ? formatMoney(deal.proposedPrice, deal.currency)
              : "—"}
            {deal.quantity != null ? ` · ${t.dealQtyShort} ${deal.quantity}` : ""}
          </dd>
        </div>
        <div className="md:col-span-2">
          <dt className="text-ro-muted">{t.dealConditions}</dt>
          <dd className="whitespace-pre-wrap">
            {deal.conditionsNotes || "—"}
          </dd>
        </div>
      </dl>

      <NegotiationThread
        entries={deal.entries}
        dealId={deal.id}
        mode="trader"
        open={open}
        locale={locale}
        labels={t}
        title={t.dealHistory}
        money={(v, c) => formatMoney(v as number, c)}
        termsLabel={t.dealTerms}
        qtyLabel={t.dealQtyShort}
      />

      {!open ? (
        <p className="text-sm text-ro-muted">
          {fmt(t.dealClosed, { status: statusText })}
        </p>
      ) : null}
    </section>
  );
}
