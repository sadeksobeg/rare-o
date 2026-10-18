import Link from "next/link";
import { AdminRequestControls } from "@/components/admin/request-controls";
import {
  DetailItem,
  DetailList,
  DetailSection,
} from "@/components/admin/detail-list";
import { StatusChip } from "@/components/ui/status-chip";
import { StatusStepper } from "@/components/ui/status-stepper";
import { prisma } from "@/lib/db/prisma";
import { formatCurrency, formatDate } from "@/lib/i18n/format";
import { getRequestDictionary } from "@/lib/i18n/server";
import {
  RETAIL_REQUEST_TRANSITIONS,
  isRetailRequestStatus,
  type RetailRequestStatus,
} from "@/lib/retail-request/constants";
import { getStatusChipProps } from "@/lib/ui/status-labels";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

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

  const request = await prisma.retailRequest.findUnique({
    where: { id },
    include: {
      lines: true,
      handoffEvents: { orderBy: { createdAt: "desc" } },
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
      unreadCount: true,
    },
  });

  let payload: unknown = null;
  try {
    payload = JSON.parse(request.handoffPayloadJson);
  } catch {
    payload = request.handoffPayloadJson;
  }

  const current = isRetailRequestStatus(request.status)
    ? request.status
    : null;
  const nextStatuses: RetailRequestStatus[] = current
    ? [...RETAIL_REQUEST_TRANSITIONS[current]]
    : [];

  const when = (value: Date | null) =>
    value
      ? formatDate(value, locale, { dateStyle: "medium", timeStyle: "short" })
      : "—";
  const money = (value: unknown, currency: string) =>
    formatCurrency(Number(value), currency, locale, dict.product.priceOnRequest);
  const localeLabel =
    request.locale === "ar"
      ? d.langAr
      : request.locale === "en"
        ? d.langEn
        : request.locale;
  const notes = request.customerNotes?.trim();

  return (
    <section className="space-y-8">
      <div className="space-y-3">
        <p className="text-sm text-ro-muted">{a.requests}</p>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-[28px]">
            {request.reference}
          </h1>
          <StatusChip {...getStatusChipProps(dict, "retail", request.status)} />
        </div>
        <StatusStepper domain="retail" current={request.status} dict={dict} />
      </div>

      <DetailList>
        <DetailItem label={u.colCustomer}>
          {request.customerName}
          <span className="text-ro-muted"> · </span>
          <span dir="ltr">{request.customerPhone}</span>
        </DetailItem>
        <DetailItem label={d.customerNotes}>
          {notes ? notes : "—"}
        </DetailItem>
        <DetailItem label={d.locale}>{localeLabel}</DetailItem>
        <DetailItem label={d.destination}>
          {request.destinationCountry}
        </DetailItem>
        <DetailItem label={d.shippingMethod}>
          {request.shippingMethodCode ?? d.shippingUnconfirmed}
        </DetailItem>
        <DetailItem label={d.subtotal}>
          {money(request.subtotal, request.currency)}
        </DetailItem>
        <DetailItem label={d.handoffPrepared}>
          {when(request.handoffPreparedAt)}
        </DetailItem>
        <DetailItem label={d.handoffOpened}>
          {when(request.handoffOpenedAt)}
        </DetailItem>
      </DetailList>

      <DetailSection title={d.linkedConversation}>
        {linkedConversation ? (
          <div className="flex flex-wrap items-center justify-between gap-3 border border-ro-line p-4 text-sm">
            <div className="space-y-1">
              <p className="font-medium">
                {linkedConversation.displayName ||
                  linkedConversation.participantE164 ||
                  linkedConversation.id}
              </p>
              {linkedConversation.participantE164 ? (
                <p className="text-ro-muted" dir="ltr">
                  {linkedConversation.participantE164}
                </p>
              ) : null}
              {linkedConversation.unreadCount > 0 ? (
                <p className="text-xs text-ro-plum">
                  {dict.inbox.unread}: {linkedConversation.unreadCount}
                </p>
              ) : null}
            </div>
            <Link
              href={`/admin/inbox/${linkedConversation.id}`}
              className="font-semibold text-ro-plum hover:underline"
            >
              {d.linkedConversationOpen}
            </Link>
          </div>
        ) : (
          <p className="text-sm text-ro-muted">{d.linkedConversationNone}</p>
        )}
      </DetailSection>

      <AdminRequestControls
        requestId={request.id}
        nextStatuses={nextStatuses}
        whatsAppDeepLink={request.whatsAppDeepLink}
        canRetrigger={
          request.status !== "draft" &&
          request.status !== "completed" &&
          request.status !== "cancelled"
        }
        labels={u}
      />

      <DetailSection title={d.lines}>
        <ul className="space-y-2 border border-ro-line p-4 text-sm">
          {request.lines.map((l) => (
            <li key={l.id}>
              {(locale === "ar"
                ? l.productNameAr || l.productNameEn
                : l.productNameEn || l.productNameAr) || "—"}
              <span className="text-ro-muted"> · {d.qty} </span>
              {l.quantity}
              <span className="text-ro-muted"> — </span>
              {money(l.lineTotal, l.currency)}
            </li>
          ))}
        </ul>
      </DetailSection>

      {request.handoffMessageText ? (
        <DetailSection title={d.storedMessage}>
          <pre
            dir="auto"
            className="overflow-x-auto whitespace-pre-wrap border border-ro-line bg-ro-surface p-4 text-xs"
          >
            {request.handoffMessageText}
          </pre>
        </DetailSection>
      ) : null}

      <DetailSection title={d.handoffPayload}>
        <pre
          dir="ltr"
          className="overflow-x-auto border border-ro-line bg-ro-surface p-4 text-start text-xs"
        >
          {JSON.stringify(payload, null, 2)}
        </pre>
      </DetailSection>

      <DetailSection title={d.auditEvents}>
        {request.handoffEvents.length === 0 ? (
          <p className="text-sm text-ro-muted">{d.noEvents}</p>
        ) : (
          <ul className="divide-y divide-ro-line border border-ro-line text-sm">
            {request.handoffEvents.map((e) => (
              <li key={e.id} className="space-y-1 p-3">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="font-medium">
                    {d.retailEvent[e.eventType] ?? e.eventType}
                  </span>
                  <span className="text-ro-muted">
                    {e.fromStatus
                      ? (u.status.retail[e.fromStatus] ?? e.fromStatus)
                      : "—"}{" "}
                    {locale === "ar" ? "←" : "→"}{" "}
                    {e.toStatus
                      ? (u.status.retail[e.toStatus] ?? e.toStatus)
                      : "—"}
                  </span>
                  <span className="text-ro-muted">
                    {d.actor[e.actor] ?? e.actor}
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
