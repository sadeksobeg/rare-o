import Link from "next/link";
import {
  ArrowRight,
  Info,
  MessageSquare,
  Package,
  ShoppingBag,
  UserRound,
  Wallet,
} from "lucide-react";
import { RevealPhone } from "@/components/admin/reveal-phone";
import { RequestStatusMenu } from "@/components/admin/rad/request-status-menu";
import { RetailConfirmationPanel } from "@/components/admin/rad/retail-confirmation-panel";
import { RetailFulfillmentPanel } from "@/components/admin/rad/retail-fulfillment-panel";
import { allowedNextStatuses } from "@/lib/shipping/shipments";
import { formatEta } from "@/lib/retail-request/shipment-text";
import { findRetailCustomerConversation } from "@/lib/retail-request/customer-channel";
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
import { prisma } from "@/lib/db/prisma";
import { formatAdminDate, formatAdminMoney } from "@/lib/i18n/admin-format";
import { getRequestDictionary } from "@/lib/i18n/server";
import {
  RETAIL_REQUEST_TRANSITIONS,
  isRetailRequestStatus,
  type RetailRequestStatus,
} from "@/lib/retail-request/constants";
import { buildDetailSteps } from "@/lib/ui/detail-stepper";
import { statusToneToPill } from "@/lib/ui/pill-tone";
import { getStatusChipProps } from "@/lib/ui/status-labels";
import { shippingDestinationParts } from "@/lib/shipping/countries";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

/** Notes written by older code in English — shown in the admin's language. */
const NOTE_AR: Record<string, string> = {
  "Initial handoff prepared from storefront": "جُهّز التحويل الأولي من المتجر",
  "Handoff deep link opened": "فُتح رابط التحويل",
  "Handoff deep link opened again (same request)": "فُتح رابط التحويل مجدداً (الطلب نفسه)",
};

const EXTRA_EVENT_TITLES: Record<string, [string, string]> = {
  customer_confirmed: ["العميل أكّد صحة البيانات", "Customer confirmed the details"],
  customer_changes_requested: ["العميل طلب تعديلاً", "Customer requested a change"],
  confirmation_sent: ["أُرسلت رسالة التأكيد للعميل", "Confirmation message sent"],
  confirmation_opened: ["فُتحت رسالة التأكيد في واتساب", "Confirmation opened in WhatsApp"],
  status_notified: ["أُرسل تحديث الحالة للعميل", "Status update sent to customer"],
  edited: ["عُدّلت بيانات العميل", "Customer data edited"],
  payment_set: ["حُدّدت طريقة الدفع", "Payment method set"],
  sent_to_shipping: ["أُرسل الطلب للشحن", "Sent to shipping"],
  shipment_update: ["تحديث الشحنة", "Shipment update"],
};

export default async function AdminRequestDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { locale, dict } = await getRequestDictionary();
  const a = dict.admin;
  const u = dict.adminUi;
  const d = u.detail;
  const ar = locale === "ar";

  const request = await prisma.retailRequest.findUnique({
    where: { id },
    include: {
      lines: true,
      handoffEvents: { orderBy: { createdAt: "desc" } },
      customer: {
        select: {
          id: true,
          name: true,
          _count: { select: { requests: true } },
        },
      },
    },
  });
  if (!request) notFound();

  const linkedConversation = await prisma.whatsAppConversation.findFirst({
    where: { linkType: "retail_request", linkId: request.id },
    select: {
      id: true,
      displayName: true,
      participantE164: true,
      lastMessageAt: true,
      lastMessagePreview: true,
      unreadCount: true,
    },
  });

  const canNotify = !!(await findRetailCustomerConversation(request));
  const shipmentRow = await prisma.shipment.findFirst({
    where: { retailRequestId: request.id, status: { not: "CANCELLED" } },
    orderBy: { createdAt: "desc" },
    include: { events: { orderBy: { at: "desc" }, take: 6 } },
  });

  const current = isRetailRequestStatus(request.status)
    ? request.status
    : null;
  const nextStatuses: RetailRequestStatus[] = current
    ? [...RETAIL_REQUEST_TRANSITIONS[current]]
    : [];

  const when = (value: Date | null) =>
    value ? (
      <span className="rad-nowrap">
        {formatAdminDate(value, locale, { forceAbsolute: true, withTime: true })}
      </span>
    ) : (
      "—"
    );
  const money = (value: unknown, currency: string) => {
    const n = Number(value);
    if (!Number.isFinite(n) || n <= 0) return dict.product.priceOnRequest;
    return formatAdminMoney(n, currency, locale);
  };

  const chip = getStatusChipProps(dict, "retail", request.status);
  const steps = buildDetailSteps("retail", request.status, dict);
  const notes = request.customerNotes?.trim();
  const localeLabel =
    request.locale === "ar"
      ? d.langAr
      : request.locale === "en"
        ? d.langEn
        : request.locale;

  const createdMeta = [
    ar ? "أُنشئ" : "Created",
    formatAdminDate(request.createdAt, locale),
    "·",
    ar ? "آخر تحديث" : "Updated",
    formatAdminDate(request.updatedAt, locale),
  ].join(" ");

  const initial = (request.customerName.trim()[0] || "?").toUpperCase();

  return (
    <section data-admin-request-detail="" className="pb-8">
      <DetailBack href="/admin/requests">{a.requests}</DetailBack>

      <DetailHeader
        reference={request.reference}
        status={chip.label}
        statusTone={statusToneToPill(chip.tone)}
        meta={createdMeta}
        actions={
          <RequestStatusMenu
            requestId={request.id}
            nextStatuses={nextStatuses}
            whatsAppDeepLink={request.whatsAppDeepLink}
            canRetrigger={
              request.status !== "draft" &&
              request.status !== "completed" &&
              request.status !== "cancelled"
            }
            conversationHref={
              linkedConversation
                ? `/admin/inbox/${linkedConversation.id}`
                : null
            }
            canNotify={canNotify}
            customerOptedIn={request.whatsappShippingOptIn}
            labels={u}
            openConversationLabel={d.linkedConversationOpen}
            changeStatusLabel={u.form.moveTo}
            confirmLabel={u.form.applyTransition}
            cancelLabel={dict.common.cancel}
            modalLead={u.form.operationsHint}
          />
        }
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
                title={d.lines}
                count={request.lines.length}
              />
              <div className="rad-cb2">
                {request.lines.map((l) => {
                  const name =
                    (locale === "ar"
                      ? l.productNameAr || l.productNameEn
                      : l.productNameEn || l.productNameAr) || "—";
                  return (
                    <LineItem
                      key={l.id}
                      thumb={
                        <span className="rad-pt">
                          <ShoppingBag
                            width={20}
                            height={20}
                            strokeWidth={1.5}
                            aria-hidden
                          />
                        </span>
                      }
                      title={name}
                      subtitle={`${d.qty} ${l.quantity}`}
                      price={
                        <bdi dir="ltr">{money(l.lineTotal, l.currency)}</bdi>
                      }
                    />
                  );
                })}
                <div className="rad-tot">
                  <span>{d.subtotal}</span>
                  <bdi dir="ltr">{money(request.subtotal, request.currency)}</bdi>
                </div>
                {request.shippingCostAmount != null && request.shippingCostCurrency ? (
                  <>
                    <div className="rad-tot">
                      <span>
                        {ar ? "الشحن (تقدير)" : "Shipping (estimate)"}
                        {request.shippingMethodLabel
                          ? ` — ${request.shippingMethodLabel}`
                          : ""}
                      </span>
                      <bdi dir="ltr">
                        {money(
                          request.shippingCostAmount,
                          request.shippingCostCurrency
                        )}
                      </bdi>
                    </div>
                    {request.shippingCostCurrency === request.currency ? (
                      <div className="rad-tot rad-tot-grand">
                        <span>{ar ? "الإجمالي التقديري" : "Estimated total"}</span>
                        <bdi dir="ltr">
                          {money(
                            Number(request.subtotal) +
                              Number(request.shippingCostAmount),
                            request.currency
                          )}
                        </bdi>
                      </div>
                    ) : null}
                  </>
                ) : null}
                <p className="rad-note-s">
                  <Info width={15} height={15} strokeWidth={1.5} aria-hidden />
                  {ar
                    ? "الأسعار تقديرية وتُؤكَّد مع العميل عبر واتساب. لا يوجد دفع إلكتروني على المنصة."
                    : "Prices are estimates and confirmed with the customer via WhatsApp. No in-app payments."}
                </p>
              </div>
            </Card>

            <Card
              padded={false}
              className="rad-rise"
              style={{ ["--rad-s" as string]: "3" }}
            >
              <CardHeader title={ar ? "بيانات العميل" : "Customer details"} />
              <div className="rad-cb2">
                <KeyValue
                  items={[
                    {
                      label: u.colCustomer,
                      value: request.customerId ? (
                        <Link
                          href={`/admin/customers/${request.customerId}`}
                          className="rad-lnk"
                        >
                          {request.customerName}
                        </Link>
                      ) : (
                        request.customerName
                      ),
                    },
                    {
                      label: u.colPhone,
                      value: (
                        <RevealPhone
                          phone={request.customerPhone}
                          showLabel={u.showPhone}
                          hideLabel={u.hidePhone}
                        />
                      ),
                    },
                    { label: d.locale, value: localeLabel },
                    {
                      label: d.destination,
                      value: (() => {
                        const dest = shippingDestinationParts(
                          request.destinationCountry,
                          request.destinationCode,
                          locale
                        );
                        return dest.code && dest.label !== dest.code ? (
                          <span>
                            {dest.label}{" "}
                            <bdi dir="ltr" className="tabular-nums opacity-70">
                              ({dest.code})
                            </bdi>
                          </span>
                        ) : (
                          dest.label
                        );
                      })(),
                    },
                    {
                      label: d.shippingMethod,
                      value:
                        request.shippingMethodLabel ||
                        request.shippingMethodCode ||
                        d.shippingUnconfirmed,
                    },
                    {
                      label: d.customerNotes,
                      value: notes || "—",
                      full: true,
                    },
                  ]}
                />
              </div>
            </Card>

            <Card
              padded={false}
              className="rad-rise"
              style={{ ["--rad-s" as string]: "3" }}
            >
              <CardHeader title={ar ? "تأكيد البيانات مع العميل" : "Confirm details with the customer"} />
              <div className="rad-cb2">
                <RetailConfirmationPanel
                  requestId={request.id}
                  closed={request.status === "completed" || request.status === "cancelled"}
                  customer={{
                    name: request.customerName,
                    phone: request.customerPhone,
                    destination: request.destinationCountry,
                    notes: request.customerNotes,
                  }}
                  response={
                    request.customerResponse === "confirmed" ||
                    request.customerResponse === "changes_requested"
                      ? request.customerResponse
                      : null
                  }
                  responseNote={request.customerResponseNote ?? ""}
                  respondedAtLabel={
                    request.customerRespondedAt
                      ? formatAdminDate(request.customerRespondedAt, locale, {
                          forceAbsolute: true,
                          withTime: true,
                        })
                      : null
                  }
                />
              </div>
            </Card>

            <Card
              padded={false}
              className="rad-rise"
              style={{ ["--rad-s" as string]: "3" }}
            >
              <CardHeader title={ar ? "الدفع والشحن" : "Payment & shipping"} />
              <div className="rad-cb2">
                <RetailFulfillmentPanel
                  requestId={request.id}
                  closed={request.status === "completed" || request.status === "cancelled"}
                  paymentMode={request.paymentMode === "prepaid" || request.paymentMode === "cod" ? request.paymentMode : null}
                  paymentConfirmed={Boolean(request.paymentConfirmedAt)}
                  etaLabel={formatEta(request.etaMinDays, request.etaMaxDays, ar)}
                  methodLabel={request.shippingMethodLabel ?? ""}
                  canNotify={canNotify}
                  optedIn={request.whatsappShippingOptIn}
                  defaultPrice={request.shippingCostAmount != null ? String(Number(request.shippingCostAmount)) : ""}
                  shipment={
                    shipmentRow
                      ? {
                          id: shipmentRow.id,
                          status: shipmentRow.status,
                          carrierLabel: shipmentRow.carrierLabel,
                          trackingNumber: shipmentRow.trackingNumber,
                          next: allowedNextStatuses(shipmentRow.status),
                          recent: shipmentRow.events.map((e) => ({
                            status: e.status,
                            note: e.note,
                            at: formatAdminDate(e.at, locale, { forceAbsolute: true, withTime: true }) as string,
                          })),
                        }
                      : null
                  }
                />
              </div>
            </Card>

            <Card
              padded={false}
              className="rad-rise"
              style={{ ["--rad-s" as string]: "4" }}
            >
              <CardHeader title={d.auditEvents} />
              <div className="rad-cb2">
                {request.handoffEvents.length === 0 ? (
                  <p style={{ color: "var(--rad-tx3)", fontSize: 13 }}>
                    {d.noEvents}
                  </p>
                ) : (
                  <Timeline
                    events={request.handoffEvents.map((e) => ({
                      icon: (
                        <Package width={15} height={15} strokeWidth={1.5} />
                      ),
                      title:
                        d.retailEvent[e.eventType] ??
                        EXTRA_EVENT_TITLES[e.eventType]?.[ar ? 0 : 1] ??
                        e.eventType,
                      meta: (
                        <>
                          {e.fromStatus || e.toStatus ? (
                            <>
                              {e.fromStatus
                                ? (u.status.retail[e.fromStatus] ?? e.fromStatus)
                                : "—"}{" "}
                              <ArrowRight
                                className="mx-1 inline size-3 rtl:-scale-x-100"
                                strokeWidth={1.5}
                                aria-hidden
                              />{" "}
                              {e.toStatus
                                ? (u.status.retail[e.toStatus] ?? e.toStatus)
                                : "—"}
                              {" · "}
                            </>
                          ) : null}
                          {d.actor[e.actor] ?? e.actor}
                          {" · "}
                          <span className="rad-nowrap">
                            {formatAdminDate(e.createdAt, locale, {
                              forceAbsolute: true,
                              withTime: true,
                            })}
                          </span>
                          {e.note
                            ? ` — «${ar ? (NOTE_AR[e.note] ?? e.note) : e.note}»`
                            : ""}
                        </>
                      ),
                    }))}
                  />
                )}
              </div>
            </Card>

            {request.handoffMessageText ? (
              <Card padded={false}>
                <CardHeader title={d.storedMessage} />
                <div className="rad-cb2">
                  <pre
                    dir="auto"
                    className="overflow-x-auto whitespace-pre-wrap text-xs"
                    style={{
                      padding: 14,
                      borderRadius: 12,
                      background: "var(--rad-surface2)",
                      border: "1px solid var(--rad-bd)",
                      fontFamily: "inherit",
                      fontSize: 13,
                      lineHeight: 1.9,
                      overflowWrap: "anywhere",
                      unicodeBidi: "plaintext",
                    }}
                  >
                    {request.handoffMessageText}
                  </pre>
                </div>
              </Card>
            ) : null}
          </>
        }
        rail={
          <>
            <Card
              padded={false}
              className="rad-rise"
              style={{ ["--rad-s" as string]: "2" }}
            >
              <CardHeader title={u.colCustomer} />
              <div className="rad-cb2">
                <div
                  style={{
                    display: "flex",
                    gap: 12,
                    alignItems: "center",
                  }}
                >
                  <Avatar gradient="">{initial}</Avatar>
                  <div>
                    <b>{request.customerName}</b>
                    <div style={{ color: "var(--rad-tx3)", fontSize: 12.5 }}>
                      {request.customer
                        ? `${request.customer._count.requests} ${u.colRequests}`
                        : "—"}
                    </div>
                  </div>
                </div>
                {request.customerId ? (
                  <Link
                    href={`/admin/customers/${request.customerId}`}
                    className="rad-btn rad-gh rad-sm"
                    style={{
                      marginTop: 14,
                      width: "100%",
                      justifyContent: "center",
                    }}
                  >
                    <UserRound
                      width={14}
                      height={14}
                      strokeWidth={1.5}
                      aria-hidden
                    />
                    {ar ? "ملف العميل" : "Customer profile"}
                  </Link>
                ) : null}
              </div>
            </Card>

            <Card
              padded={false}
              className="rad-rise"
              style={{ ["--rad-s" as string]: "3" }}
            >
              <CardHeader title={d.linkedConversation} />
              <div className="rad-cb2">
                {linkedConversation ? (
                  <>
                    <div className="rad-rec" style={{ margin: "0 0 12px" }}>
                      <span className="rad-chip rad-c-ok">
                        <MessageSquare
                          width={16}
                          height={16}
                          strokeWidth={1.5}
                          aria-hidden
                        />
                      </span>
                      <div className="rad-tt">
                        <b>
                          {linkedConversation.displayName ||
                            linkedConversation.participantE164 ||
                            linkedConversation.id}
                        </b>
                        <span>
                          {linkedConversation.lastMessageAt
                            ? formatAdminDate(
                                linkedConversation.lastMessageAt,
                                locale
                              )
                            : "—"}
                          {linkedConversation.unreadCount > 0
                            ? ` · ${dict.inbox.unread}: ${linkedConversation.unreadCount}`
                            : ""}
                        </span>
                      </div>
                    </div>
                    {linkedConversation.lastMessagePreview ? (
                      <p
                        dir="auto"
                        style={{
                          color: "var(--rad-tx2)",
                          fontSize: 13,
                          lineHeight: 1.7,
                          overflowWrap: "anywhere",
                          wordBreak: "break-word",
                          display: "-webkit-box",
                          WebkitLineClamp: 3,
                          WebkitBoxOrient: "vertical",
                          overflow: "hidden",
                        }}
                      >
                        «{linkedConversation.lastMessagePreview}»
                      </p>
                    ) : null}
                    <Link
                      href={`/admin/inbox/${linkedConversation.id}`}
                      className="rad-btn rad-gh rad-sm"
                      style={{
                        marginTop: 12,
                        width: "100%",
                        justifyContent: "center",
                      }}
                    >
                      {d.linkedConversationOpen}
                    </Link>
                  </>
                ) : (
                  <p style={{ color: "var(--rad-tx3)", fontSize: 13 }}>
                    {d.linkedConversationNone}
                  </p>
                )}
              </div>
            </Card>

            <Card
              padded={false}
              className="rad-rise"
              style={{ ["--rad-s" as string]: "4" }}
            >
              <CardHeader title={ar ? "الدفع / التحويل" : "Payment / handoff"} />
              <div className="rad-cb2">
                <p className="rad-note-s" style={{ margin: 0 }}>
                  <Wallet width={16} height={16} strokeWidth={1.5} aria-hidden />
                  {ar
                    ? "الدفع يتم خارج المنصة بالتحويل ويُنسَّق عبر واتساب."
                    : "Payment happens off-platform by transfer and is coordinated on WhatsApp."}
                </p>
                <KeyValue
                  items={[
                    {
                      label: d.handoffPrepared,
                      value: when(request.handoffPreparedAt),
                      nowrap: true,
                    },
                    {
                      label: d.handoffOpened,
                      value: when(request.handoffOpenedAt),
                      nowrap: true,
                    },
                  ]}
                />
              </div>
            </Card>
          </>
        }
      />
    </section>
  );
}
