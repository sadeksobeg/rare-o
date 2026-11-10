import Link from "next/link";
import { StatusChip } from "@/components/ui/status-chip";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import type { BusinessContextView } from "@/lib/whatsapp/messaging/linking";
import type { Locale } from "@/lib/i18n/config";
import { getStatusChipProps, type StatusDomain } from "@/lib/ui/status-labels";

function formatWhen(iso: string, locale: Locale): string {
  try {
    return new Intl.DateTimeFormat(`${locale}-u-nu-latn`, {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

function typeLabel(dict: Dictionary, linkType: string): string {
  switch (linkType) {
    case "retail_request":
      return dict.inbox.typeRetail;
    case "deal_proposal":
      return dict.inbox.typeDeal;
    case "wholesale_request":
      return dict.inbox.typeWholesale;
    default:
      return linkType;
  }
}

function statusDomain(linkType: string): StatusDomain | null {
  switch (linkType) {
    case "retail_request":
      return "retail";
    case "deal_proposal":
      return "deal";
    case "wholesale_request":
      return "wholesale";
    default:
      return null;
  }
}

/**
 * Visual-only rad skin (3.1 carry into round 4). Fields/logic unchanged.
 */
export function BusinessContextPanel({
  context,
  dict,
  locale,
}: {
  context: BusinessContextView;
  dict: Dictionary;
  locale: Locale;
}) {
  if (!context.linked) {
    return (
      <aside className="rad-rec rad-rec-static" aria-label={dict.inbox.businessContext}>
        <div className="rad-tt">
          <b>{dict.inbox.businessContext}</b>
          <span>{dict.inbox.notLinked}</span>
        </div>
      </aside>
    );
  }

  const lineName = (l: { nameAr: string; nameEn: string }) =>
    locale === "ar" ? l.nameAr || l.nameEn : l.nameEn || l.nameAr;

  const domain = statusDomain(context.linkType);
  const t = dict.trader;
  const dealKind = context.dealKind
    ? (t.dealKind[context.dealKind] ?? context.dealKind)
    : null;
  const requestMode = context.requestMode
    ? (t.requestMode[context.requestMode] ?? context.requestMode)
    : null;

  return (
    <aside className="rad-rec rad-rec-static rad-biz-ctx" aria-label={dict.inbox.businessContext}>
      <div className="rad-tt">
        <b>{dict.inbox.businessContext}</b>
        <span>
          {dict.inbox.linkedAs}: {typeLabel(dict, context.linkType)}
        </span>
        <span>
          {dict.inbox.contextReference}:{" "}
          <bdi dir="ltr" className="rad-mono">
            {context.reference} · {context.recordId}
          </bdi>
        </span>
        <span className="rad-biz-status">
          {dict.inbox.contextStatus}:{" "}
          {domain ? (
            <StatusChip size="sm" {...getStatusChipProps(dict, domain, context.status)} />
          ) : (
            <em>{context.status}</em>
          )}
        </span>
        <span>
          {dict.inbox.contextUpdated}: {formatWhen(context.updatedAt, locale)}
        </span>
        <span>
          {dict.inbox.contextIdentity}: {context.identityLabel}
          {context.identityDetail ? ` · ${context.identityDetail}` : ""}
        </span>
        {context.title ? (
          <span>
            {dict.inbox.contextTitle}: {context.title}
          </span>
        ) : null}
        {dealKind ? (
          <span>
            {dict.inbox.contextDealKind}: {dealKind}
          </span>
        ) : null}
        {requestMode ? (
          <span>
            {dict.inbox.contextRequestMode}: {requestMode}
          </span>
        ) : null}
        {context.productLabel ? (
          <span>
            {dict.inbox.contextProduct}: {context.productLabel}
          </span>
        ) : null}
        {context.latestNegotiation ? (
          <span>
            {dict.inbox.contextLatestNegotiation}: {context.latestNegotiation}
          </span>
        ) : null}
        {context.lines.length > 0 ? (
          <span>
            {dict.inbox.contextLines}:{" "}
            {context.lines
              .map((l) => `${lineName(l)} × ${l.quantity}`)
              .join(" · ")}
          </span>
        ) : null}
        <Link href={context.adminHref} className="rad-btn rad-gh rad-sm">
          {dict.inbox.openLinkedRecord}
        </Link>
      </div>
    </aside>
  );
}
