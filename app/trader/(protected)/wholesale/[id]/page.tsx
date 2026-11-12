import type { ReactNode } from "react";
import { PaymentHandoffCard } from "@/components/trader/payment-handoff-card";
import { QuoteCard } from "@/components/trader/quote-card";
import { TraderWholesaleActions } from "@/components/trader/wholesale-actions";
import { Banner } from "@/components/ui/banner";
import { Card, CardHeader } from "@/components/ui-kit/card";
import {
  DetailBack,
  DetailHeader,
  DetailStepper,
  KeyValue,
  type DetailStep,
} from "@/components/ui-kit/detail";
import { requireTraderSession } from "@/lib/auth/trader-session";
import { getRequestDictionary } from "@/lib/i18n/server";
import { statusToneToPill } from "@/lib/ui/pill-tone";
import { getStatusMeta, getStatusSequence } from "@/lib/ui/status";
import { getStatusLabel } from "@/lib/ui/status-labels";
import {
  formatDateTime,
  formatMoney,
  humanizeWholesaleNote,
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
  const statusText = wholesaleStatusLabel(t, request.status);
  const lineName = (l: (typeof request.lines)[number]) =>
    locale === "ar"
      ? l.productNameAr || l.productNameEn
      : l.productNameEn || l.productNameAr;
  const hasQuote = Boolean(request.quoteMessage || request.quotedAt);

  const sequence = getStatusSequence("wholesale");
  const index = sequence.indexOf(request.status);
  const offPath = index === -1;
  const terminalDone =
    !offPath && index === sequence.length - 1 && request.status === "completed";
  const steps: DetailStep[] = sequence.map((value, i) => ({
    value,
    label: getStatusLabel(dict, "wholesale", value),
    state: offPath
      ? "upcoming"
      : i < index || (terminalDone && i === index)
        ? "done"
        : i === index
          ? "current"
          : "upcoming",
  }));
  if (offPath) {
    steps.push({ value: request.status, label: statusText, state: "blocked" });
  }

  const modeLabel =
    t.requestMode[request.requestMode] ?? request.requestMode;
  const summaryItems: {
    label: string;
    value: ReactNode;
    full?: boolean;
    nowrap?: boolean;
  }[] = [];
  if (request.traderNotes?.trim()) {
    summaryItems.push({
      label: t.wsYourNotes,
      value: request.traderNotes,
      full: true,
    });
  }
  if (request.traderResponseNote?.trim()) {
    summaryItems.push({
      label: t.wsTraderResponse,
      value: request.traderResponseNote,
      full: true,
    });
  }

  const hasActions =
    request.status === "quote_provided" ||
    request.status === "submitted" ||
    request.status === "under_review";

  const lineTotals = request.lines.map((l) => {
    const unit =
      l.quotedUnitPrice != null
        ? Number(l.quotedUnitPrice)
        : l.proposedUnitPrice != null
          ? Number(l.proposedUnitPrice)
          : null;
    return unit != null && Number.isFinite(unit) ? unit * l.quantity : null;
  });
  const grandTotal = lineTotals.every((n) => n != null)
    ? lineTotals.reduce((a, b) => (a ?? 0) + (b ?? 0), 0)
    : null;
  const moneyCurrency =
    request.quoteCurrency || request.lines[0]?.currency || null;

  return (
    <section className="space-y-6 pb-[calc(88px+env(safe-area-inset-bottom,0px)+48px)] min-[901px]:pb-0">
      <DetailBack href="/trader/wholesale/requests">{t.wsMyRequests}</DetailBack>
      <DetailHeader
        reference={modeLabel}
        mono={false}
        status={statusText}
        statusTone={statusToneToPill(meta.tone)}
        meta={
          <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="rad-mono">{request.reference}</span>
            <span aria-hidden>·</span>
            <span>{t.wsDetailTitle}</span>
          </span>
        }
      />

      <DetailStepper
        aria-label={dict.adminUi.detail.stepperLabel}
        steps={steps}
      />

      {meta.nextActor === "trader" ? (
        <Banner tone="attention">{t.wsQuoteBanner}</Banner>
      ) : null}

      {request.status === "confirmed" ? (
        <PaymentHandoffCard
          kind="wholesale"
          recordId={request.id}
          title={t.wsHandoffTitle}
          body={t.wsHandoffBody}
          openLabel={t.wsHandoffOpenWa}
          unavailableLabel={t.wsHandoffUnavailable}
          deepLink={request.whatsAppDeepLink}
          messageText={request.handoffMessageText}
        />
      ) : null}

      {summaryItems.length > 0 ? (
        <Card padded={false}>
          <CardHeader title={t.wsYourNotes} />
          <div className="rad-cb2">
            <KeyValue items={summaryItems} />
          </div>
        </Card>
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
          showLines={false}
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

      {request.destinationCountry || request.shippingCostAmount != null ? (
        <Card padded={false}>
          <CardHeader
            title={
              locale === "ar"
                ? "تقدير الشحن عند الطلب"
                : "Shipping estimate at submission"
            }
          />
          <div className="rad-cb2">
            <KeyValue
              items={[
                request.destinationCountry
                  ? {
                      label: locale === "ar" ? "الوجهة" : "Destination",
                      value: request.destinationCountry,
                    }
                  : null,
                request.shippingMethodLabel
                  ? {
                      label: locale === "ar" ? "طريقة الشحن" : "Method",
                      value: request.shippingMethodLabel,
                    }
                  : null,
                request.shippingCostAmount != null
                  ? {
                      label:
                        locale === "ar" ? "التكلفة التقديرية" : "Estimated cost",
                      value: (
                        <bdi dir="ltr">
                          {formatMoney(
                            request.shippingCostAmount,
                            request.shippingCostCurrency,
                            locale
                          )}
                        </bdi>
                      ),
                      nowrap: true,
                    }
                  : null,
              ].filter(Boolean) as {
                label: string;
                value: ReactNode;
                nowrap?: boolean;
              }[]}
            />
          </div>
        </Card>
      ) : null}

      {request.carrier || request.trackingReference ? (
        <Card padded={false}>
          <CardHeader title={dict.adminUi.form.shippingTitle} />
          <div className="rad-cb2">
            <KeyValue
              items={[
                request.carrier
                  ? {
                      label: dict.adminUi.form.carrier,
                      value: <span dir="ltr">{request.carrier}</span>,
                      nowrap: true,
                    }
                  : null,
                request.trackingReference
                  ? {
                      label: dict.adminUi.form.trackingReference,
                      value: (
                        <span dir="ltr">{request.trackingReference}</span>
                      ),
                      nowrap: true,
                    }
                  : null,
                request.shippedAt
                  ? {
                      label: locale === "ar" ? "تاريخ الشحن" : "Shipped",
                      value: formatDateTime(locale, request.shippedAt),
                    }
                  : null,
              ].filter(Boolean) as {
                label: string;
                value: ReactNode;
                nowrap?: boolean;
              }[]}
            />
          </div>
        </Card>
      ) : null}

      <Card padded={false}>
        <CardHeader title={t.wsLines} count={request.lines.length} />
        <div
          className="overflow-x-auto"
          tabIndex={0}
          role="region"
          aria-label={t.wsLines}
        >
          <table className="w-full min-w-[36rem] border-collapse text-sm">
            <thead>
              <tr className="border-b border-[color:var(--rad-bd)] text-start text-[color:var(--rad-tx3)]">
                <th className="px-4 py-2.5 font-semibold">{t.wsColProduct}</th>
                <th className="px-4 py-2.5 font-semibold">{t.wsQty}</th>
                <th className="px-4 py-2.5 font-semibold">{t.wsProposed}</th>
                <th className="px-4 py-2.5 font-semibold">{t.wsQuoted}</th>
                <th className="px-4 py-2.5 font-semibold">{t.dealTotal}</th>
              </tr>
            </thead>
            <tbody>
              {request.lines.map((l, i) => {
                const total = lineTotals[i];
                return (
                  <tr
                    key={l.id}
                    className="border-b border-[color:var(--rad-bd)] last:border-b-0"
                  >
                    <td className="px-4 py-3 font-semibold text-[color:var(--rad-tx)]">
                      {lineName(l)}
                    </td>
                    <td className="px-4 py-3 tabular-nums text-[color:var(--rad-tx2)]">
                      {l.quantity}
                    </td>
                    <td className="px-4 py-3 tabular-nums text-[color:var(--rad-tx2)]">
                      {l.proposedUnitPrice != null
                        ? formatMoney(l.proposedUnitPrice, l.currency, locale)
                        : "—"}
                    </td>
                    <td className="px-4 py-3 tabular-nums text-[color:var(--rad-tx2)]">
                      {l.quotedUnitPrice != null
                        ? formatMoney(
                            l.quotedUnitPrice,
                            request.quoteCurrency || l.currency,
                            locale
                          )
                        : "—"}
                    </td>
                    <td className="px-4 py-3 tabular-nums font-semibold text-[color:var(--rad-tx)]">
                      {total != null
                        ? formatMoney(
                            total,
                            request.quoteCurrency || l.currency,
                            locale
                          )
                        : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            {grandTotal != null ? (
              <tfoot>
                <tr>
                  <td
                    colSpan={4}
                    className="px-4 py-3 text-end font-semibold text-[color:var(--rad-tx)]"
                  >
                    {t.dealTotal}
                  </td>
                  <td className="px-4 py-3 tabular-nums font-semibold text-[color:var(--rad-tx)]">
                    {formatMoney(grandTotal, moneyCurrency, locale)}
                  </td>
                </tr>
              </tfoot>
            ) : null}
          </table>
        </div>
      </Card>

      {hasActions ? (
        <TraderWholesaleActions
          requestId={request.id}
          status={request.status}
          labels={t}
        />
      ) : null}

      <Card padded={false}>
        <CardHeader title={t.wsHistory} />
        <ul className="divide-y divide-[color:var(--rad-bd)] text-sm">
          {request.events.map((e) => {
            const note = humanizeWholesaleNote(e.note, t);
            return (
              <li key={e.id} className="space-y-1 px-5 py-3">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <strong className="text-[color:var(--rad-tx)]">
                    {t.wholesaleEvent[e.eventType] ?? e.eventType}
                  </strong>
                  <span className="text-[color:var(--rad-tx3)]">
                    {t.actorRole[e.actorRole] ?? e.actorRole}
                  </span>
                  {e.fromStatus || e.toStatus ? (
                    <span className="text-[color:var(--rad-tx3)]">
                      {e.fromStatus
                        ? `${wholesaleStatusLabel(t, e.fromStatus)} → `
                        : null}
                      {e.toStatus
                        ? wholesaleStatusLabel(t, e.toStatus)
                        : null}
                    </span>
                  ) : null}
                  <span className="text-[color:var(--rad-tx3)]">
                    {formatDateTime(locale, e.createdAt)}
                  </span>
                </div>
                {note ? (
                  <p className="whitespace-pre-wrap text-[color:var(--rad-tx2)]">
                    {note}
                  </p>
                ) : null}
              </li>
            );
          })}
        </ul>
      </Card>
    </section>
  );
}
