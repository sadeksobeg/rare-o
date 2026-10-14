"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import {
  createRetailRequestAction,
  markRetailHandoffOpenedAction,
  type ActionResult,
} from "@/app/actions";
import { useCart } from "@/components/storefront/cart-provider";
import {
  HandoffSuccess,
  type HandoffSuccessLabels,
} from "@/components/storefront/handoff-success";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { TextField } from "@/components/ui/text-field";
import { href } from "@/lib/href";
import type { Locale } from "@/lib/i18n/config";

type SuccessData = {
  reference?: string;
  id?: string;
  status?: string;
  whatsAppDeepLink?: string | null;
  handoffMessageText?: string | null;
};

export function RequestForm({
  locale,
  labels,
  notesDefault = "",
}: {
  locale: Locale;
  labels: {
    title: string;
    name: string;
    phone: string;
    phonePlaceholder: string;
    phoneHelper: string;
    notes: string;
    country: string;
    shippingNote: string;
    submit: string;
    submitting: string;
    success: string;
    openWhatsApp: string;
    opening: string;
    handoffHint: string;
    messagePreview: string;
    listEmpty: string;
    privacyConsent: string;
    privacyLink: string;
    successTitle: string;
    referenceLabel: string;
    copyReference: string;
    copyMessage: string;
    copied: string;
    copyFailed: string;
    nextStep: string;
    emptyTitle: string;
    emptyBody: string;
    summaryTitle: string;
    backToCart: string;
    catalog: string;
    itemsCount: string;
  };
  notesDefault?: string;
}) {
  const { items, clear } = useCart();
  const [result, setResult] = useState<ActionResult | null>(null);
  const [pending, startTransition] = useTransition();
  const [opening, setOpening] = useState(false);
  const [openError, setOpenError] = useState<string | null>(null);

  const linesJson = useMemo(
    () =>
      JSON.stringify(
        items.map((i) => ({ productId: i.productId, quantity: i.quantity }))
      ),
    [items]
  );

  if (items.length === 0 && !(result && result.ok)) {
    return (
      <EmptyState
        title={labels.emptyTitle}
        body={labels.emptyBody}
        actionHref={href("/catalog", locale)}
        actionLabel={labels.catalog}
        className="py-24"
      />
    );
  }

  if (result?.ok && result.data && typeof result.data === "object") {
    const data = result.data as SuccessData;
    const successLabels: HandoffSuccessLabels = {
      title: labels.successTitle,
      referenceLabel: labels.referenceLabel,
      handoffHint: labels.handoffHint,
      nextStep: labels.nextStep,
      messagePreview: labels.messagePreview,
      openWhatsApp: labels.openWhatsApp,
      opening: labels.opening,
      copyReference: labels.copyReference,
      copyMessage: labels.copyMessage,
      copied: labels.copied,
      copyFailed: labels.copyFailed,
      shippingNote: labels.shippingNote,
      catalog: labels.catalog,
    };

    return (
      <HandoffSuccess
        locale={locale}
        labels={successLabels}
        reference={data.reference}
        messageText={data.handoffMessageText}
        hasDeepLink={Boolean(data.whatsAppDeepLink && data.id)}
        opening={opening}
        error={openError}
        onOpenWhatsApp={() => {
          if (!data.id) return;
          setOpenError(null);
          setOpening(true);
          startTransition(async () => {
            const fd = new FormData();
            fd.set("requestId", data.id!);
            const res = await markRetailHandoffOpenedAction(null, fd);
            setOpening(false);
            if (!res.ok) {
              setOpenError(res.error);
              return;
            }
            const link =
              (res.data as { whatsAppDeepLink?: string | null } | undefined)
                ?.whatsAppDeepLink || data.whatsAppDeepLink;
            if (link) {
              window.open(link, "_blank", "noopener,noreferrer");
            }
          });
        }}
      />
    );
  }

  // Privacy consent line: split on the {link} placeholder to inline a real link.
  const [consentBefore, consentAfter = ""] = labels.privacyConsent.split("{link}");
  const pieces = items.reduce((n, i) => n + i.quantity, 0);

  return (
    <section className="mx-auto max-w-xl space-y-6">
      <header className="space-y-2">
        <h1 className="ro-type-h1">{labels.title}</h1>
        <p className="text-sm text-ro-muted">{labels.shippingNote}</p>
      </header>

      <div className="flex items-center justify-between gap-4 rounded-[var(--ro-r-sm)] border border-ro-border bg-ro-surface/60 px-4 py-3 text-sm">
        <span className="text-ro-text-2">
          {labels.summaryTitle} ·{" "}
          {labels.itemsCount.replace("{n}", pieces.toLocaleString(locale))}
        </span>
        <Link
          href={href("/cart", locale)}
          className="shrink-0 text-ro-plum underline-offset-4 hover:underline"
        >
          {labels.backToCart}
        </Link>
      </div>

      <form
        className="space-y-5"
        action={(formData) => {
          startTransition(async () => {
            const res = await createRetailRequestAction(null, formData);
            setResult(res);
            if (res.ok) clear();
          });
        }}
      >
        <input type="hidden" name="locale" value={locale} />
        <input type="hidden" name="linesJson" value={linesJson} />

        <TextField
          label={labels.name}
          name="customerName"
          required
          autoComplete="name"
        />
        <TextField
          label={labels.phone}
          name="customerPhone"
          type="tel"
          required
          dir="ltr"
          inputMode="tel"
          autoComplete="tel"
          placeholder={labels.phonePlaceholder}
          helper={labels.phoneHelper}
        />
        <TextField
          label={labels.country}
          name="destinationCountry"
          required
          autoComplete="country-name"
        />
        <label className="block space-y-1.5 text-sm">
          <span className="font-medium text-ro-ink">{labels.notes}</span>
          <textarea
            name="customerNotes"
            rows={3}
            defaultValue={notesDefault}
            className="w-full rounded-[var(--ro-r-sm)] border border-[var(--ro-border-control)] bg-ro-paper px-3 py-2 text-ro-ink outline-none transition-colors focus:border-[var(--ro-plum-900)] focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-[var(--ro-focus)]"
          />
        </label>

        {result && !result.ok ? (
          <p className="text-sm text-[var(--ro-danger-700)]" role="alert">
            {result.error}
          </p>
        ) : null}

        <Button type="submit" size="lg" className="w-full" loading={pending}>
          {pending ? labels.submitting : labels.submit}
        </Button>

        <p className="text-xs leading-relaxed text-ro-muted">
          {consentBefore}
          <Link
            href={href("/privacy", locale)}
            className="text-ro-plum underline underline-offset-4"
          >
            {labels.privacyLink}
          </Link>
          {consentAfter}
        </p>
      </form>
    </section>
  );
}
