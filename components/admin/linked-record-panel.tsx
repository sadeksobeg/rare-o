"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  adminLinkWhatsAppConversationAction,
  adminUnlinkWhatsAppConversationAction,
  type LinkableRecordHit,
} from "@/app/whatsapp-actions";
import { BusinessContextPanel } from "@/components/admin/business-context-panel";
import { RecordPicker } from "@/components/admin/record-picker";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import type { Locale } from "@/lib/i18n/config";
import type { InboxLinkSummary } from "@/lib/whatsapp/messaging/inbox";
import type { BusinessContextView } from "@/lib/whatsapp/messaging/linking";

function adminHref(link: InboxLinkSummary): string | null {
  if (!link.linked || !link.linkId) return null;
  switch (link.linkType) {
    case "retail_request":
      return `/admin/requests/${link.linkId}`;
    case "deal_proposal":
      return `/admin/deals/${link.linkId}`;
    case "wholesale_request":
      return `/admin/wholesale/${link.linkId}`;
    default:
      return null;
  }
}

/**
 * A16 — LinkedRecordPanel + confirm link/unlink via A17 picker.
 * Linking never changes the business record status.
 */
export function LinkedRecordPanel({
  conversationId,
  link,
  context,
  dict,
  locale,
}: {
  conversationId: string;
  link: InboxLinkSummary;
  context: BusinessContextView;
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
    <div data-inbox-pane="context" className="space-y-3">
      <BusinessContextPanel context={context} dict={dict} locale={locale} />

      <div className="space-y-2 border border-ro-border bg-ro-paper p-4 text-sm">
        {link.linked ? (
          <>
            {href ? (
              <ButtonLinkish href={href} label={i.openLinkedRecord} />
            ) : null}
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={pending}
              onClick={() => setUnlinkOpen(true)}
            >
              {i.linkClear}
            </Button>
            <Button
              type="button"
              variant="text"
              size="sm"
              disabled={pending}
              onClick={() => setPickerOpen(true)}
            >
              {i.linkChange}
            </Button>
          </>
        ) : (
          <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled={pending}
            onClick={() => setPickerOpen(true)}
          >
            {i.linkRecord}
          </Button>
        )}
        {error ? (
          <p className="text-[var(--ro-danger-700)]" role="alert">
            {error}
          </p>
        ) : null}
      </div>

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
        <div className="flex justify-end gap-2 p-4">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => setUnlinkOpen(false)}
          >
            {dict.common.cancel}
          </Button>
          <Button
            type="button"
            variant="danger"
            size="sm"
            disabled={pending}
            onClick={onConfirmUnlink}
          >
            {i.confirmUnlink}
          </Button>
        </div>
      </Dialog>
    </div>
  );
}

function ButtonLinkish({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="inline-flex h-9 items-center justify-center border border-ro-ink px-5 text-xs font-semibold !text-ro-ink hover:bg-ro-sunken"
    >
      {label}
    </Link>
  );
}
