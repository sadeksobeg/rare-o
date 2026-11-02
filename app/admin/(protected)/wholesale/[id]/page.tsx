import { ArrowRight } from "lucide-react";
import { AdminWholesaleControls } from "@/components/admin/wholesale-controls";
import {
  DetailItem,
  DetailList,
  DetailSection,
} from "@/components/admin/detail-list";
import { ShippingTracker } from "@/components/admin/shipping-tracker";
import { StatusChip } from "@/components/ui/status-chip";
import { StatusStepper } from "@/components/ui/status-stepper";
import { formatCurrency, formatDate, formatNumber } from "@/lib/i18n/format";
import { getRequestDictionary } from "@/lib/i18n/server";
import { getStatusChipProps } from "@/lib/ui/status-labels";
import { getWholesaleRequestForAdmin } from "@/lib/wholesale/service";
import { notFound } from "next/navigation";

export default async function AdminWholesaleDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { locale, dict } = await getRequestDictionary();
  const a = dict.admin;
  const u = dict.adminUi;
  const d = u.detail;
  const t = dict.trader;

  let request;
  try {
    request = await getWholesaleRequestForAdmin(id);
  } catch {
    notFound();
  }

  const defaultCurrency =
    request.quoteCurrency ||
    request.lines.find((l) => l.currency)?.currency ||
    request.lines[0]?.catalogCurrencySnapshot ||
    "TEST";

  const money = (value: unknown, currency: string | null | undefined) =>
    currency
      ? formatCurrency(
          Number(value),
          currency,
          locale,
          dict.product.priceOnRequest
        )
      : formatNumber(Number(value), locale, { maximumFractionDigits: 2 });
  const productName = (l: { productNameAr: string; productNameEn: string }) =>
    (locale === "ar"
      ? l.productNameAr || l.productNameEn
      : l.productNameEn || l.productNameAr) || "—";

  return (
    <section className="space-y-8">
      <div className="space-y-3">
        <p className="text-sm text-ro-muted">{a.wholesale}</p>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-[28px]">
            {d.wholesaleRequestTitle}
          </h1>
          <span className="text-sm text-ro-muted" dir="ltr">
            {request.reference}
          </span>
          <StatusChip
            {...getStatusChipProps(dict, "wholesale", request.status)}
          />
        </div>
        <p className="text-sm">
          <span className="text-ro-muted">{u.colMode}: </span>
          {t.requestMode[request.requestMode] ?? request.requestMode}
        </p>
        <StatusStepper
          domain="wholesale"
          current={request.status}
          dict={dict}
        />
      </div>

      <DetailList>
        <DetailItem label={u.colTrader}>
          {request.trader.displayName}
          <span className="text-ro-muted"> · </span>
          <span dir="ltr">{request.trader.email}</span>
          {request.trader.companyName ? (
            <div className="text-ro-muted">{request.trader.companyName}</div>
          ) : null}
          {request.trader.phone ? (
            <div className="text-ro-muted" dir="ltr">
              {request.trader.phone}
            </div>
          ) : null}
        </DetailItem>
        <DetailItem label={d.traderNotes}>
          <span className="whitespace-pre-wrap">
            {request.traderNotes || "—"}
          </span>
        </DetailItem>
        <DetailItem label={u.form.carrier}>
          {request.carrier || "—"}
        </DetailItem>
        <DetailItem label={u.form.trackingReference}>
          {request.trackingReference ? (
            <span dir="ltr">{request.trackingReference}</span>
          ) : (
            "—"
          )}
        </DetailItem>
        <DetailItem label={u.form.shippingTitle}>
          {request.shippedAt
            ? formatDate(request.shippedAt, locale, {
                dateStyle: "medium",
                timeStyle: "short",
              })
            : "—"}
        </DetailItem>
      </DetailList>

      <ShippingTracker
        title={u.shippingTracker}
        carrier={request.carrier}
        tracking={request.trackingReference}
        steps={(() => {
          const closed = request.status === "completed";
          const cancelled = request.status === "cancelled";
          const shipped = Boolean(request.shippedAt) || closed;
          const quoted =
            request.status === "quote_provided" ||
            request.status === "confirmed" ||
            shipped ||
            closed;
          return [
            {
              id: "open",
              label: u.shipStepOpen,
              done: quoted || shipped || closed || cancelled,
              current:
                !quoted &&
                !shipped &&
                !closed &&
                !cancelled &&
                (request.status === "submitted" ||
                  request.status === "under_review"),
            },
            {
              id: "quoted",
              label: u.shipStepQuoted,
              done: shipped || closed,
              current: quoted && !shipped && !closed && !cancelled,
            },
            {
              id: "shipped",
              label: u.shipStepShipped,
              done: closed,
              current: shipped && !closed && !cancelled,
            },
            {
              id: "delivered",
              label: u.shipStepDelivered,
              done: closed,
              // A cancelled order never reaches "delivered" — only mark it
              // current when actually closed, so a cancelled request doesn't
              // render as if delivery were in progress.
              current: closed,
            },
          ];
        })()}
      />

      <DetailSection title={d.linesSnapshot}>
        <ul className="divide-y divide-ro-line border border-ro-line text-sm">
          {request.lines.map((l) => (
            <li key={l.id} className="space-y-1 p-4">
              <div className="font-medium">
                {productName(l)}{" "}
                <span className="text-ro-muted" dir="ltr">
                  ({l.productSlugSnapshot})
                </span>
              </div>
              <div>
                {d.qty}: {l.quantity}
              </div>
              {l.proposedUnitPrice != null ? (
                <div>
                  {d.proposedPrice}: {money(l.proposedUnitPrice, l.currency)}
                </div>
              ) : (
                <div className="text-ro-muted">{d.noProposedPrice}</div>
              )}
              {l.quotedUnitPrice != null ? (
                <div>
                  {d.quotedUnit}:{" "}
                  {money(
                    l.quotedUnitPrice,
                    request.quoteCurrency || l.currency
                  )}
                </div>
              ) : null}
              <div className="text-ro-muted">
                {d.catalogRetailRef}:{" "}
                {money(
                  l.catalogRetailPriceSnapshot,
                  l.catalogCurrencySnapshot
                )}
              </div>
            </li>
          ))}
        </ul>
      </DetailSection>

      <AdminWholesaleControls
        requestId={request.id}
        status={request.status}
        requestMode={request.requestMode}
        lines={request.lines.map((l) => ({
          id: l.id,
          productName: productName(l),
          quantity: l.quantity,
        }))}
        quoteCurrencyDefault={defaultCurrency}
        labels={u}
      />

      <DetailSection title={d.auditEvents}>
        {request.events.length === 0 ? (
          <p className="text-sm text-ro-muted">{d.noEvents}</p>
        ) : (
          <ul className="divide-y divide-ro-line border border-ro-line text-sm">
            {request.events.map((e) => (
              <li key={e.id} className="space-y-1 p-3">
                <div className="flex flex-wrap items-center gap-3">
                  <strong>{t.wholesaleEvent[e.eventType] ?? e.eventType}</strong>
                  <span className="text-ro-muted">
                    {t.actorRole[e.actorRole] ?? e.actorRole}
                  </span>
                  <span className="text-ro-muted">
                    {e.fromStatus
                      ? (u.status.wholesale[e.fromStatus] ?? e.fromStatus)
                      : "—"}{" "}
                    <ArrowRight
                      className="mx-1 inline size-3.5 rtl:-scale-x-100"
                      strokeWidth={1.5}
                      aria-hidden
                    />{" "}
                    {e.toStatus
                      ? (u.status.wholesale[e.toStatus] ?? e.toStatus)
                      : "—"}
                  </span>
                  <span className="text-ro-muted">
                    {formatDate(e.createdAt, locale, {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </span>
                </div>
                {e.note ? <p className="text-ro-muted">{e.note}</p> : null}
              </li>
            ))}
          </ul>
        )}
      </DetailSection>
    </section>
  );
}
