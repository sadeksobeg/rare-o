"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
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
import {
  ShippingCostSelector,
  type ShippingSelection,
} from "@/components/storefront/shipping-cost-selector";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { TextField } from "@/components/ui/text-field";
import { href } from "@/lib/href";
import { shippingEstimateDisplay } from "@/lib/shipping/quote-ui";
import type { Locale } from "@/lib/i18n/config";

type SuccessData = {
  reference?: string;
  id?: string;
  status?: string;
  whatsAppDeepLink?: string | null;
  handoffMessageText?: string | null;
  publicToken?: string | null;
};

const SUCCESS_STORAGE_KEY = "ro-request-success";

function clearStoredSuccess() {
  try {
    sessionStorage.removeItem(SUCCESS_STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

function readStoredSuccess(): ActionResult | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(SUCCESS_STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as SuccessData & { savedAt?: number };
    // Stale after 6 hours — a returning customer should see a fresh form.
    if (!data.savedAt || Date.now() - data.savedAt > 6 * 3600 * 1000) {
      sessionStorage.removeItem(SUCCESS_STORAGE_KEY);
      return null;
    }
    return { ok: true, data };
  } catch {
    return null;
  }
}

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
  const { items, clear, removeItem, hydrated } = useCart();
  const [result, setResult] = useState<ActionResult | null>(null);
  const [restoring, setRestoring] = useState(true);
  const [pending, startTransition] = useTransition();
  const [opening, setOpening] = useState(false);
  const [openError, setOpenError] = useState<string | null>(null);
  const [shipping, setShipping] = useState<ShippingSelection | null>(null);
  const [cartNotice, setCartNotice] = useState<string | null>(null);
  const validatedRef = useRef(false);
  const showMobileSticky =
    Boolean(shipping && !shipping.inquiry && shipping.amount > 0);

  useEffect(() => {
    const stored = readStoredSuccess();
    // New items in the cart = a NEW request: never show the old success screen.
    let cartHasItems = false;
    try {
      const rawCart = localStorage.getItem("ro_cart_v1");
      cartHasItems = Boolean(rawCart && rawCart !== "[]" && rawCart !== "{}");
    } catch {
      /* ignore */
    }
    if (stored && !cartHasItems) setResult(stored);
    else if (stored) clearStoredSuccess();
    setRestoring(false);
  }, []);

  /** Drop draft / missing / unpublished cart lines with a clear Arabic notice. */
  useEffect(() => {
    if (!hydrated || restoring || validatedRef.current) return;
    if (items.length === 0) {
      validatedRef.current = true;
      return;
    }
    const ids = items.map((i) => i.productId);
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/cart/validate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ productIds: ids }),
        });
        if (!res.ok || cancelled) return;
        const data = (await res.json()) as { removed?: string[] };
        const removed = Array.isArray(data.removed) ? data.removed : [];
        validatedRef.current = true;
        if (removed.length === 0) return;
        for (const id of removed) removeItem(id);
        setCartNotice(
          locale === "ar"
            ? "أزلنا من السلة منتجات لم تعد متاحة للطلب. يمكنك المتابعة بما تبقّى."
            : "We removed unavailable products from your cart. You can continue with what remains."
        );
      } catch {
        validatedRef.current = true;
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [hydrated, restoring, items, removeItem, locale]);

  /** One idempotency key per mount — double-submit / retry reuses it. */
  const idempotencyKeyRef = useRef<string | null>(null);

  const linesJson = useMemo(
    () =>
      JSON.stringify(
        items.map((i) => ({ productId: i.productId, quantity: i.quantity }))
      ),
    [items]
  );

  if (restoring) {
    return null;
  }

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

    const ar = locale === "ar";
    return (
      <>
      <HandoffSuccess
        locale={locale}
        labels={successLabels}
        reference={data.reference}
        messageText={data.handoffMessageText}
        orderToken={data.publicToken}
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
      <div className="mx-auto mt-4 flex max-w-xl flex-wrap items-center justify-center gap-3 text-sm">
        <button
          type="button"
          className="rounded-full border border-ro-border px-4 py-2 text-ro-ink hover:bg-ro-surface"
          onClick={() => {
            clearStoredSuccess();
            idempotencyKeyRef.current = null;
            setResult(null);
          }}
        >
          {ar ? "ابدأ طلباً جديداً" : "Start a new request"}
        </button>
        {data.publicToken ? (
          <a
            className="rounded-full border border-ro-border px-4 py-2 text-ro-ink hover:bg-ro-surface"
            href={`/order/${data.publicToken}`}
          >
            {ar ? "تعديل بياناتي أو متابعة طلبي" : "Edit my details / track"}
          </a>
        ) : null}
      </div>
      </>
    );
  }

  // Privacy consent line: split on the {link} placeholder to inline a real link.
  const [consentBefore, consentAfter = ""] = labels.privacyConsent.split("{link}");
  const pieces = items.reduce((n, i) => n + i.quantity, 0);

  return (
    <section className="mx-auto max-w-xl space-y-6 pb-20 md:pb-0">
      <header className="space-y-2">
        <h1 className="ro-type-h1">{labels.title}</h1>
        <p className="text-sm text-ro-muted">{labels.shippingNote}</p>
      </header>

      {cartNotice ? (
        <p
          role="status"
          className="rounded-[var(--ro-r-sm)] border border-[color-mix(in_srgb,var(--ro-warn)_40%,var(--ro-border))] bg-[color-mix(in_srgb,var(--ro-warn)_8%,var(--ro-paper))] px-4 py-3 text-sm text-ro-ink"
        >
          {cartNotice}
        </p>
      ) : null}

      <div className="space-y-2 rounded-[var(--ro-r-sm)] border border-ro-border bg-ro-surface/60 px-4 py-3 text-sm">
        <div className="flex items-center justify-between gap-4">
          <span className="text-ro-text-2">
            {labels.summaryTitle} ·{" "}
            {labels.itemsCount.replace("{n}", String(pieces))}
          </span>
          <Link
            href={href("/cart", locale)}
            className="shrink-0 text-ro-plum underline-offset-4 hover:underline"
          >
            {labels.backToCart}
          </Link>
        </div>
        {shipping ? (
          <div
            className={`flex items-center justify-between gap-4 border-t border-ro-border pt-2 text-ro-text-2 ${
              showMobileSticky ? "max-md:hidden" : ""
            }`}
          >
            <span>{locale === "ar" ? "تقدير الشحن" : "Shipping estimate"}</span>
            {shipping.inquiry || shipping.amount <= 0 ? (
              <span className="font-medium text-ro-ink">
                {shippingEstimateDisplay(shipping, locale)}
              </span>
            ) : (
              <bdi dir="ltr" className="font-medium text-ro-ink">
                {shipping.amount} {shipping.currency}
              </bdi>
            )}
          </div>
        ) : null}
      </div>

      <form
        className="space-y-5"
        // onSubmit (not the `action` prop): React 19 resets every field after a
        // form action finishes — even a failed one — so a validation error used
        // to wipe the customer's name, phone, destination and notes.
        onSubmit={(e) => {
          e.preventDefault();
          const formData = new FormData(e.currentTarget);
          if (!idempotencyKeyRef.current) {
            idempotencyKeyRef.current = crypto.randomUUID();
          }
          formData.set("idempotencyKey", idempotencyKeyRef.current);
          startTransition(async () => {
            const res = await createRetailRequestAction(null, formData);
            setResult(res);
            if (res.ok) {
              clear();
              try {
                sessionStorage.setItem(
                  SUCCESS_STORAGE_KEY,
                  JSON.stringify({ ...(res.data as object), savedAt: Date.now() })
                );
              } catch {
                /* ignore */
              }
            }
          });
        }}
      >
        <input type="hidden" name="locale" value={locale} />
        <input type="hidden" name="linesJson" value={linesJson} />
        <input
          type="text"
          name="companyWebsite"
          tabIndex={-1}
          autoComplete="off"
          aria-hidden="true"
          className="sr-only"
        />

        <TextField
          label={labels.name}
          name="customerName"
          required
          autoComplete="name"
          minLength={8}
          helper={locale === "ar" ? "الاسم الثلاثي: الاسم واسم الأب والكنية" : "Full name: first, father's and family name"}
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
        <ShippingCostSelector
          locale={locale}
          oudUnitCount={pieces}
          onChange={setShipping}
          showStickyHint
        />
        <label className="flex items-start gap-2.5 text-sm text-ro-ink">
          <input
            type="checkbox"
            name="whatsappShippingOptIn"
            className="mt-1 size-4 rounded border-[var(--ro-border-control)]"
            defaultChecked={false}
          />
          <span className="leading-relaxed text-ro-muted">
            {locale === "ar"
              ? "أرغب بتلقّي تحديثات الشحن عبر واتساب (اختياري)."
              : "I want shipping updates on WhatsApp (optional)."}
          </span>
        </label>
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
