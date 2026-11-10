import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, Package, Store, Truck } from "lucide-react";
import { AdminWholesaleControls } from "@/components/admin/wholesale-controls";
import { RevealPhone } from "@/components/admin/reveal-phone";
import {
  Avatar,
  Card,
  CardHeader,
  DetailBack,
  DetailGrid,
  DetailHeader,
  DetailStepper,
  KeyValue,
  LineItem,
  Timeline,
} from "@/components/ui-kit";
import { formatCurrency, formatDate, formatNumber, formatRelative } from "@/lib/i18n/format";
import { getRequestDictionary } from "@/lib/i18n/server";
import { buildDetailSteps } from "@/lib/ui/detail-stepper";
import { statusToneToPill } from "@/lib/ui/pill-tone";
import { getStatusChipProps } from "@/lib/ui/status-labels";
import { getWholesaleRequestForAdmin } from "@/lib/wholesale/service";

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
  const ar = locale === "ar";

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
    "USD";

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

  const chip = getStatusChipProps(dict, "wholesale", request.status);
  const steps = buildDetailSteps("wholesale", request.status, dict);
  const meta = [
    request.trader.displayName,
    t.requestMode[request.requestMode] ?? request.requestMode,
    `${ar ? "آخر تحديث" : "Updated"} ${formatRelative(request.updatedAt, locale)}`,
  ].join(" · ");

  return (
    <section data-admin-wholesale-detail="" className="pb-8">
      <DetailBack href="/admin/wholesale">{a.wholesale}</DetailBack>

      <DetailHeader
        reference={request.reference}
        status={chip.label}
        statusTone={statusToneToPill(chip.tone)}
        meta={meta}
      />

      <DetailGrid
        main={
          <>
            <Card className="rad-rise" style={{ ["--rad-s" as string]: "1" }}>
              <DetailStepper steps={steps} aria-label={d.stepperLabel} />
            </Card>

            <Card
              padded={false}
              className="rad-rise"
              style={{ ["--rad-s" as string]: "2" }}
            >
              <CardHeader
                title={d.linesSnapshot}
                count={request.lines.length}
              />
              <div className="rad-cb2">
                {request.lines.map((l) => (
                  <LineItem
                    key={l.id}
                    thumb={
                      <span className="rad-pt">
                        <Package
                          width={20}
                          height={20}
                          strokeWidth={1.5}
                          aria-hidden
                        />
                      </span>
                    }
                    title={productName(l)}
                    subtitle={`${l.productSlugSnapshot} · ${d.qty} ${l.quantity}`}
                    price={
                      l.quotedUnitPrice != null ? (
                        <bdi dir="ltr">
                          {money(
                            l.quotedUnitPrice,
                            request.quoteCurrency || l.currency
                          )}
                        </bdi>
                      ) : l.proposedUnitPrice != null ? (
                        <bdi dir="ltr">
                          {money(l.proposedUnitPrice, l.currency)}
                        </bdi>
                      ) : (
                        <span className="rad-dim">{d.noProposedPrice}</span>
                      )
                    }
                  />
                ))}
              </div>
            </Card>

            <Card padded={false}>
              <CardHeader title={u.form.shippingTitle} />
              <div className="rad-cb2">
                <KeyValue
                  items={[
                    {
                      label: u.form.carrier,
                      value: request.carrier || "—",
                    },
                    {
                      label: u.form.trackingReference,
                      value: request.trackingReference ? (
                        <bdi dir="ltr">{request.trackingReference}</bdi>
                      ) : (
                        "—"
                      ),
                    },
                    {
                      label: u.form.shippingTitle,
                      value: request.shippedAt
                        ? formatDate(request.shippedAt, locale, {
                            dateStyle: "medium",
                            timeStyle: "short",
                          })
                        : "—",
                    },
                  ]}
                />
                <button type="button" className="rad-btn rad-gh rad-sm mt-3">
                  <Truck width={15} height={15} strokeWidth={1.5} aria-hidden />
                  {u.shippingTracker}
                </button>
              </div>
            </Card>

            <Card padded={false}>
              <CardHeader title={u.form.operations} />
              <div className="rad-cb2">
                <AdminWholesaleControls
                  bare
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
              </div>
            </Card>

            <Card padded={false}>
              <CardHeader title={d.auditEvents} />
              <div className="rad-cb2">
                {request.events.length === 0 ? (
                  <p style={{ color: "var(--rad-tx3)", fontSize: 13 }}>
                    {d.noEvents}
                  </p>
                ) : (
                  <Timeline
                    events={request.events.map((e) => ({
                      icon: (
                        <Package width={15} height={15} strokeWidth={1.5} />
                      ),
                      title: t.wholesaleEvent[e.eventType] ?? e.eventType,
                      meta: (
                        <>
                          {t.actorRole[e.actorRole] ?? e.actorRole}
                          {" · "}
                          {e.fromStatus
                            ? (u.status.wholesale[e.fromStatus] ?? e.fromStatus)
                            : "—"}{" "}
                          <ArrowRight
                            className="mx-1 inline size-3 rtl:-scale-x-100"
                            strokeWidth={1.5}
                            aria-hidden
                          />{" "}
                          {e.toStatus
                            ? (u.status.wholesale[e.toStatus] ?? e.toStatus)
                            : "—"}
                          {" · "}
                          {formatDate(e.createdAt, locale, {
                            dateStyle: "medium",
                            timeStyle: "short",
                          })}
                          {e.note ? ` — «${e.note}»` : ""}
                        </>
                      ),
                    }))}
                  />
                )}
              </div>
            </Card>
          </>
        }
        rail={
          <>
            <Card
              padded={false}
              className="rad-rise"
              style={{ ["--rad-s" as string]: "2" }}
            >
              <CardHeader title={u.colTrader} />
              <div className="rad-cb2">
                <div
                  style={{
                    display: "flex",
                    gap: 12,
                    alignItems: "center",
                  }}
                >
                  <Avatar gradient="g3">
                    {(request.trader.displayName.trim()[0] || "?").toUpperCase()}
                  </Avatar>
                  <div>
                    <b>{request.trader.displayName}</b>
                    <div style={{ color: "var(--rad-tx3)", fontSize: 12.5 }}>
                      <bdi dir="ltr">{request.trader.email}</bdi>
                    </div>
                  </div>
                </div>
                {request.trader.companyName ? (
                  <p style={{ marginTop: 10, fontSize: 13 }}>
                    {request.trader.companyName}
                  </p>
                ) : null}
                {request.trader.phone ? (
                  <div style={{ marginTop: 10 }}>
                    <RevealPhone
                      phone={request.trader.phone}
                      showLabel={u.showPhone}
                      hideLabel={u.hidePhone}
                    />
                  </div>
                ) : null}
                <Link
                  href={`/admin/traders/${request.traderId}`}
                  className="rad-btn rad-gh rad-sm"
                  style={{
                    marginTop: 14,
                    width: "100%",
                    justifyContent: "center",
                  }}
                >
                  <Store width={14} height={14} strokeWidth={1.5} aria-hidden />
                  {ar ? "ملف التاجر" : "Trader profile"}
                </Link>
              </div>
            </Card>

            <Card padded={false}>
              <CardHeader title={d.traderNotes} />
              <div className="rad-cb2">
                <p
                  style={{
                    whiteSpace: "pre-wrap",
                    fontSize: 13.5,
                    lineHeight: 1.7,
                    color: "var(--rad-tx2)",
                  }}
                >
                  {request.traderNotes || "—"}
                </p>
              </div>
            </Card>
          </>
        }
      />
    </section>
  );
}
