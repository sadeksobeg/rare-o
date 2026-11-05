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

const cardClass =
  "space-y-3 rounded-[14px] border border-[color:var(--ro-border-subtle)] bg-[color:var(--ro-panel)] p-3.5 text-sm text-[color:var(--ro-text)] shadow-[inset_0_1px_0_color-mix(in_srgb,var(--ro-text)_4%,transparent)]";

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
      <aside className={cardClass} aria-label={dict.inbox.businessContext}>
        <h2 className="text-[11px] font-semibold uppercase tracking-wide text-[color:var(--ro-text-muted)]">
          {dict.inbox.businessContext}
        </h2>
        <p className="text-[color:var(--ro-text-2)]">{dict.inbox.notLinked}</p>
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
    <aside className={cardClass} aria-label={dict.inbox.businessContext}>
      <h2 className="text-[11px] font-semibold uppercase tracking-wide text-[color:var(--ro-text-muted)]">
        {dict.inbox.businessContext}
      </h2>
      <p>
        <span className="text-[color:var(--ro-text-muted)]">
          {dict.inbox.linkedAs}:{" "}
        </span>
        {typeLabel(dict, context.linkType)}
      </p>
      <p>
        <span className="text-[color:var(--ro-text-muted)]">
          {dict.inbox.contextReference}:{" "}
        </span>
        <span className="font-mono text-xs" dir="ltr">
          {context.reference} · {context.recordId}
        </span>
      </p>
      <p className="flex flex-wrap items-center gap-2">
        <span className="text-[color:var(--ro-text-muted)]">
          {dict.inbox.contextStatus}:{" "}
        </span>
        {domain ? (
          <StatusChip
            size="sm"
            {...getStatusChipProps(dict, domain, context.status)}
          />
        ) : (
          <span className="font-medium">{context.status}</span>
        )}
      </p>
      <p>
        <span className="text-[color:var(--ro-text-muted)]">
          {dict.inbox.contextUpdated}:{" "}
        </span>
        {formatWhen(context.updatedAt, locale)}
      </p>
      <p>
        <span className="text-[color:var(--ro-text-muted)]">
          {dict.inbox.contextIdentity}:{" "}
        </span>
        {context.identityLabel}
        {context.identityDetail ? (
          <span className="text-[color:var(--ro-text-muted)]">
            {" "}
            · {context.identityDetail}
          </span>
        ) : null}
      </p>
      {context.title ? (
        <p>
          <span className="text-[color:var(--ro-text-muted)]">
            {dict.inbox.contextTitle}:{" "}
          </span>
          {context.title}
        </p>
      ) : null}
      {dealKind ? (
        <p>
          <span className="text-[color:var(--ro-text-muted)]">
            {dict.inbox.contextDealKind}:{" "}
          </span>
          {dealKind}
        </p>
      ) : null}
      {requestMode ? (
        <p>
          <span className="text-[color:var(--ro-text-muted)]">
            {dict.inbox.contextRequestMode}:{" "}
          </span>
          {requestMode}
        </p>
      ) : null}
      {context.productLabel ? (
        <p>
          <span className="text-[color:var(--ro-text-muted)]">
            {dict.inbox.contextProduct}:{" "}
          </span>
          {context.productLabel}
        </p>
      ) : null}
      {context.latestNegotiation ? (
        <p>
          <span className="text-[color:var(--ro-text-muted)]">
            {dict.inbox.contextLatestNegotiation}:{" "}
          </span>
          {context.latestNegotiation}
        </p>
      ) : null}
      {context.lines.length > 0 ? (
        <div>
          <p className="mb-1 text-[color:var(--ro-text-muted)]">
            {dict.inbox.contextLines}
          </p>
          <ul className="list-inside list-disc space-y-1 text-[color:var(--ro-text-2)]">
            {context.lines.map((l, i) => (
              <li key={`${lineName(l)}-${i}`}>
                {lineName(l)} × {l.quantity}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      <Link
        href={context.adminHref}
        className="inline-flex min-h-9 items-center text-sm font-semibold text-[color:var(--ro-accent-fg,var(--ro-plum-700))] underline-offset-2 hover:underline"
      >
        {dict.inbox.openLinkedRecord}
      </Link>
    </aside>
  );
}
