"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  adminLinkWhatsAppConversationAction,
  adminSetWhatsAppCrmPartyAction,
  adminUnlinkWhatsAppConversationAction,
  type LinkableRecordHit,
} from "@/app/whatsapp-actions";
import { BusinessContextPanel } from "@/components/admin/business-context-panel";
import { RecordPicker } from "@/components/admin/record-picker";
import { Dialog } from "@/components/ui/dialog";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import type { Locale } from "@/lib/i18n/config";
import type {
  InboxCrmParty,
  InboxLinkSummary,
} from "@/lib/whatsapp/messaging/inbox";
import { formatDate } from "@/lib/i18n/format";
import type {
  BusinessContextView,
  CrmPartySuggestion,
  LinkAuditEntry,
} from "@/lib/whatsapp/messaging/linking";

function adminHref(link: InboxLinkSummary): string | null {
  if (!link.linked || !link.linkId) return null;
  switch (link.linkType) {
    case "retail_request":
      return `/admin/requests/${link.linkId}`;
    case "deal_proposal":
      return `/admin/deals/${link.linkId}`;
    case "wholesale_request":
      return `/admin/wholesale/${link.linkId}`;
    case "brokerage_request":
      return `/admin/brokerage/${link.linkId}`;
    default:
      return null;
  }
}

/**
 * A16 — LinkedRecordPanel + confirm link/unlink via A17 picker.
 * Round 3.1: visual skin only (rad-rec / rad-btn) — linking logic unchanged.
 */
export function LinkedRecordPanel({
  conversationId,
  link,
  context,
  crm,
  suggestions = [],
  audits = [],
  dict,
  locale,
}: {
  conversationId: string;
  link: InboxLinkSummary;
  context: BusinessContextView;
  crm: InboxCrmParty;
  suggestions?: CrmPartySuggestion[];
  /** Recent link/unlink audit entries (newest first). */
  audits?: LinkAuditEntry[];
  dict: Dictionary;
  locale: Locale;
}) {
  const i = dict.inbox;
  const [pickerOpen, setPickerOpen] = useState(false);
  const [unlinkOpen, setUnlinkOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const href = adminHref(link);

  function linkTypeLabel(type: string): string {
    switch (type) {
      case "retail_request":
        return i.typeRetail;
      case "deal_proposal":
        return i.typeDeal;
      case "wholesale_request":
        return i.typeWholesale;
      case "brokerage_request":
        return i.typeBrokerage;
      default:
        return type;
    }
  }

  function setCrm(kind: "customer" | "trader" | "clear", id?: string) {
    const fd = new FormData();
    fd.set("conversationId", conversationId);
    if (kind === "clear") fd.set("clear", "1");
    else if (kind === "customer" && id) fd.set("customerId", id);
    else if (kind === "trader" && id) fd.set("traderId", id);
    startTransition(async () => {
      setError(null);
      const res = await adminSetWhatsAppCrmPartyAction(fd);
      if (!res.ok) setError(i.linkErrorNotFound);
      else router.refresh();
    });
  }

  function onConfirmLink(hit: LinkableRecordHit) {
    const fd = new FormData();
    fd.set("conversationId", conversationId);
    fd.set("linkType", hit.linkType);
    fd.set("linkId", hit.id);
    startTransition(async () => {
      setError(null);
      const res = await adminLinkWhatsAppConversationAction(fd);
      if (!res.ok) {
        setError(res.error || i.linkErrorNotFound);
        return;
      }
      router.refresh();
    });
  }

  function onConfirmUnlink() {
    const fd = new FormData();
    fd.set("conversationId", conversationId);
    startTransition(async () => {
      setError(null);
      const res = await adminUnlinkWhatsAppConversationAction(fd);
      setUnlinkOpen(false);
      if (!res.ok) {
        setError(res.error || i.linkErrorNotFound);
        return;
      }
      router.refresh();
    });
  }

  return (
    <div data-inbox-pane="context" className="rad-link-panel">
      <section aria-label={i.crmParty} className="rad-rec rad-rec-static">
        <div className="rad-tt">
          <b>{i.crmParty}</b>
          {crm.customer ? (
            <span>
              <Link href="/admin/customers">{crm.customer.name}</Link>
              {" · "}
              <bdi dir="ltr">+{crm.customer.phone.replace(/^\+/, "")}</bdi>
            </span>
          ) : null}
          {crm.trader ? (
            <span>
              <Link href="/admin/traders">{crm.trader.displayName}</Link>
              {" · "}
              <bdi dir="ltr">{crm.trader.phone || crm.trader.companyName}</bdi>
            </span>
          ) : null}
          {!crm.customer && !crm.trader ? <span>{i.crmNone}</span> : null}
        </div>
        {crm.customer || crm.trader ? (
          <button
            type="button"
            className="rad-btn rad-gh rad-sm"
            disabled={pending}
            onClick={() => setCrm("clear")}
          >
            {i.crmClear}
          </button>
        ) : null}
        {suggestions.length > 0 ? (
          <div className="rad-link-suggest">
            <p>{i.crmSuggest}</p>
            <ul>
              {suggestions.map((s) => (
                <li key={`${s.kind}-${s.id}`}>
                  <span className="rad-tt">
                    <b>{s.label}</b>
                    <span>
                      <bdi dir="ltr">{s.phone}</bdi>
                    </span>
                  </span>
                  <button
                    type="button"
                    className="rad-btn rad-gh rad-sm"
                    disabled={pending}
                    onClick={() =>
                      setCrm(s.kind === "customer" ? "customer" : "trader", s.id)
                    }
                  >
                    {s.kind === "customer" ? i.crmLinkCustomer : i.crmLinkTrader}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </section>

      <div className="rad-link-context">
        <BusinessContextPanel context={context} dict={dict} locale={locale} />
      </div>

      <div className="rad-rec rad-rec-static rad-link-actions">
        {link.linked ? (
          <>
            {href ? (
              <Link href={href} className="rad-btn rad-gh rad-sm">
                {i.openLinkedRecord}
              </Link>
            ) : null}
            <button
              type="button"
              className="rad-btn rad-gh rad-sm"
              disabled={pending}
              onClick={() => setUnlinkOpen(true)}
            >
              {i.linkClear}
            </button>
            <button
              type="button"
              className="rad-btn rad-gh rad-sm"
              disabled={pending}
              onClick={() => setPickerOpen(true)}
            >
              {i.linkChange}
            </button>
          </>
        ) : (
          <button
            type="button"
            className="rad-btn rad-gh rad-sm"
            disabled={pending}
            onClick={() => setPickerOpen(true)}
          >
            {i.linkRecord}
          </button>
        )}
        <p className="rad-link-hint">{i.linkConfirmHint}</p>
        {error ? (
          <p className="rad-link-err" role="alert">
            {error}
          </p>
        ) : null}
      </div>

      {audits.length > 0 ? (
        <section aria-label={i.linkHistory} className="rad-rec rad-rec-static">
          <div className="rad-tt">
            <b>{i.linkHistory}</b>
          </div>
          <ul className="rad-link-audit">
            {audits.map((a) => (
              <li key={a.id}>
                <span>
                  {a.action === "clear"
                    ? i.linkAuditClear
                    : a.action === "change"
                      ? i.linkAuditChange
                      : i.linkAuditSet}
                  {a.action !== "clear" ? ` · ${linkTypeLabel(a.newLinkType)}` : ""}
                </span>
                <time dateTime={a.createdAt}>
                  {formatDate(a.createdAt, locale, {
                    dateStyle: "short",
                    timeStyle: "short",
                  })}
                </time>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <RecordPicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onConfirm={onConfirmLink}
        dict={dict}
      />

      <Dialog
        open={unlinkOpen}
        onClose={() => setUnlinkOpen(false)}
        title={i.unlinkConfirm}
        size="sm"
      >
        <div className="rad-link-dialog-actions">
          <button
            type="button"
            className="rad-btn rad-gh rad-sm"
            onClick={() => setUnlinkOpen(false)}
          >
            {dict.common.cancel}
          </button>
          <button
            type="button"
            className="rad-btn rad-pri rad-sm"
            disabled={pending}
            onClick={onConfirmUnlink}
          >
            {i.confirmUnlink}
          </button>
        </div>
      </Dialog>
    </div>
  );
}
