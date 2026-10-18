import { QuoteCard } from "@/components/trader/quote-card";
import { TraderWholesaleActions } from "@/components/trader/wholesale-actions";
import { Banner } from "@/components/ui/banner";
import { StatusChip } from "@/components/ui/status-chip";
import { requireTraderSession } from "@/lib/auth/trader-session";
import { getRequestDictionary } from "@/lib/i18n/server";
import { getStatusMeta } from "@/lib/ui/status";
import {
  formatDateTime,
  formatMoney,
  wholesaleStatusLabel,
} from "@/lib/ui/trader-labels";
import { getWholesaleRequestForTrader } from "@/lib/wholesale/service";
import { notFound } from "next/navigation";

export default async function TraderWholesaleDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireTraderSession();
  const { id } = await params;
  const { locale, dict } = await getRequestDictionary();
  const t = dict.trader;

  let request;
  try {
    request = await getWholesaleRequestForTrader(id, session.sub);
  } catch {
    notFound();
  }

  const meta = getStatusMeta("wholesale", request.status);
  const lineName = (l: (typeof request.lines)[number]) =>
    locale === "ar"
      ? l.productNameAr || l.productNameEn
      : l.productNameEn || l.productNameAr;
  const hasQuote = Boolean(request.quoteMessage || request.quotedAt);

  return (
    <section className="space-y-8">
      <div className="space-y-2">
        <p className="text-sm text-ro-muted">{request.reference}</p>
        <h1 className="font-display text-3xl font-semibold tracking-tight">
          {t.wsDetailTitle}
        </h1>
        <p className="flex flex-wrap items-center gap-2 text-sm">
          <StatusChip
            tone={meta.tone}
            label={wholesaleStatusLabel(t, request.status)}
          />
          <span className="text-ro-muted">
            {t.requestMode[request.requestMode] ?? request.requestMode}
          </span>
        </p>
      </div>

      {meta.nextActor === "trader" ? (
        <Banner tone="attention">{t.wsQuoteBanner}</Banner>
      ) : null}

      {request.traderNotes ? (
        <div className="text-sm">
          <p className="text-ro-muted">{t.wsYourNotes}</p>
          <p className="whitespace-pre-wrap">{request.traderNotes}</p>
        </div>
      ) : null}

      {hasQuote ? (
        <QuoteCard
          title={t.wsQuoteTitle}
          quotedAtLabel={t.wsQuotedAt}
          quotedAt={
            request.quotedAt ? formatDateTime(locale, request.quotedAt) : null
          }
          currencyLabel={t.wsQuoteCurrency}
          currency={request.quoteCurrency}
          messageLabel={t.wsQuoteMessage}
          message={request.quoteMessage}
          linesLabel={t.wsQuoteLines}
          qtyLabel={t.wsQty}
          lines={request.lines.map((l) => ({
            id: l.id,
            name: lineName(l),
            quantity: l.quantity,
            quotedUnitPrice:
              l.quotedUnitPrice != null ? Number(l.quotedUnitPrice) : null,
            currency: l.currency,
          }))}
        />
      ) : null}

      {request.traderResponseNote ? (
        <div className="text-sm">
          <p className="text-ro-muted">{t.wsTraderResponse}</p>
          <p className="whitespace-pre-wrap">{request.traderResponseNote}</p>
        </div>
      ) : null}

      {request.carrier || request.trackingReference ? (
        <div className="ro-portal-card space-y-2 border p-4 text-sm">
          <h2 className="font-semibold">{dict.adminUi.form.shippingTitle}</h2>
          {request.carrier ? (
            <p>
              <span className="text-ro-muted">{dict.adminUi.form.carrier}: </span>
              {request.carrier}
            </p>
          ) : null}
          {request.trackingReference ? (
            <p>
              <span className="text-ro-muted">
                {dict.adminUi.form.trackingReference}:{" "}
              </span>
              <span dir="ltr">{request.trackingReference}</span>
            </p>
          ) : null}
          {request.shippedAt ? (
            <p className="text-ro-muted">
              {formatDateTime(locale, request.shippedAt)}
            </p>
          ) : null}
        </div>
      ) : null}

      <div>
        <h2 className="mb-3 text-lg font-semibold">{t.wsLines}</h2>
        <ul className="divide-y divide-ro-line border border-ro-line text-sm">
          {request.lines.map((l) => (
            <li key={l.id} className="space-y-1 p-4">
              <div>
                {lineName(l)}{" "}
                <span className="text-ro-muted">({l.productSlugSnapshot})</span>
              </div>
              <div>
                {t.wsQty}: {l.quantity}
              </div>
              {l.proposedUnitPrice != null ? (
                <div>
                  {t.wsProposed}:{" "}
                  {formatMoney(l.proposedUnitPrice, l.currency)}
                </div>
              ) : null}
              {l.quotedUnitPrice != null ? (
                <div>
                  {t.wsQuoted}:{" "}
                  {formatMoney(
                    l.quotedUnitPrice,
                    request.quoteCurrency || l.currency
                  )}
                </div>
              ) : null}
              {l.catalogRetailPriceSnapshot != null ? (
                <div className="text-ro-muted">
                  {t.wsRetailRef}:{" "}
                  {formatMoney(
                    l.catalogRetailPriceSnapshot,
                    l.catalogCurrencySnapshot
                  )}
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      </div>

      <TraderWholesaleActions
        requestId={request.id}
        status={request.status}
        labels={t}
      />

      <div>
        <h2 className="mb-3 text-lg font-semibold">{t.wsHistory}</h2>
        <ul className="divide-y divide-ro-line border border-ro-line text-sm">
          {request.events.map((e) => (
            <li key={e.id} className="space-y-1 p-3">
              <div className="flex flex-wrap items-center gap-3">
                <strong>{t.wholesaleEvent[e.eventType] ?? e.eventType}</strong>
                <span className="text-ro-muted">
                  {t.actorRole[e.actorRole] ?? e.actorRole}
                </span>
                <span className="text-ro-muted">
                  {e.fromStatus ? wholesaleStatusLabel(t, e.fromStatus) : "—"}
                  {" → "}
                  {e.toStatus ? wholesaleStatusLabel(t, e.toStatus) : "—"}
                </span>
                <span className="text-ro-muted">
                  {formatDateTime(locale, e.createdAt)}
                </span>
              </div>
              {e.note ? <p className="text-ro-muted">{e.note}</p> : null}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
