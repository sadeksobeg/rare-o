import { NegotiationForm } from "@/components/deals/negotiation-form";
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
  formatDateTime,
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
    // Ownership enforced: traderId from session, not from URL alone
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
          <dd>
            {deal.product
              ? `${productName} (${deal.product.slug})`
              : t.dealNonCatalog}
          </dd>
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

      <div>
        <h2 className="mb-3 text-lg font-semibold">{t.dealHistory}</h2>
        <ul className="divide-y divide-ro-line border border-ro-line">
          {deal.entries.map((e) => (
            <li key={e.id} className="space-y-1 p-4 text-sm">
              <div className="flex flex-wrap items-center gap-3">
                <strong>{t.dealAction[e.action] ?? e.action}</strong>
                <span className="text-ro-muted">
                  {t.actorRole[e.actorRole] ?? e.actorRole}
                </span>
                <span className="text-ro-muted">
                  {formatDateTime(locale, e.createdAt)}
                </span>
              </div>
              {e.message ? <p>{e.message}</p> : null}
              {e.proposedPrice != null || e.quantity != null ? (
                <p className="text-ro-muted">
                  {t.dealTerms}:{" "}
                  {e.proposedPrice != null
                    ? formatMoney(e.proposedPrice, e.currency)
                    : ""}
                  {e.quantity != null ? ` · ${t.dealQtyShort} ${e.quantity}` : ""}
                </p>
              ) : null}
              {e.conditionsNotes ? (
                <p className="text-ro-muted">{e.conditionsNotes}</p>
              ) : null}
            </li>
          ))}
        </ul>
      </div>

      {open ? (
        <NegotiationForm dealId={deal.id} mode="trader" labels={t} />
      ) : (
        <p className="text-sm text-ro-muted">
          {fmt(t.dealClosed, { status: statusText })}
        </p>
      )}
    </section>
  );
}
