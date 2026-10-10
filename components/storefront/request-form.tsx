"use client";

import { useMemo, useState, useTransition } from "react";
import {
  createRetailRequestAction,
  markRetailHandoffOpenedAction,
  type ActionResult,
} from "@/app/actions";
import { useCart } from "@/components/storefront/cart-provider";
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
}: {
  locale: Locale;
  labels: {
    title: string;
    name: string;
    phone: string;
    notes: string;
    country: string;
    shippingNote: string;
    submit: string;
    success: string;
    openWhatsApp: string;
    handoffHint: string;
    messagePreview: string;
  };
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
    return <p className="text-ro-muted">Cart is empty.</p>;
  }

  if (result?.ok && result.data && typeof result.data === "object") {
    const data = result.data as SuccessData;
    return (
      <section className="space-y-4">
        <h1 className="text-3xl">{labels.title}</h1>
        <p>
          {labels.success} <strong>{data.reference}</strong>
        </p>
        <p className="text-sm text-ro-muted">{labels.handoffHint}</p>
        {data.handoffMessageText ? (
          <div>
            <p className="mb-1 text-sm text-ro-muted">{labels.messagePreview}</p>
            <pre className="overflow-x-auto whitespace-pre-wrap border border-ro-line bg-ro-surface p-3 text-xs">
              {data.handoffMessageText}
            </pre>
          </div>
        ) : null}
        {data.whatsAppDeepLink && data.id ? (
          <button
            type="button"
            disabled={opening}
            className="bg-ro-purple px-5 py-3 text-sm text-ro-ivory disabled:opacity-60"
            onClick={() => {
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
          >
            {labels.openWhatsApp}
          </button>
        ) : null}
        {openError ? <p className="text-sm text-red-800">{openError}</p> : null}
        <p className="text-sm text-ro-muted">{labels.shippingNote}</p>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-xl space-y-6">
      <h1 className="text-3xl">{labels.title}</h1>
      <p className="text-sm text-ro-muted">{labels.shippingNote}</p>
      <form
        className="space-y-4"
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
        <label className="block space-y-1 text-sm">
          <span>{labels.name}</span>
          <input
            name="customerName"
            required
            className="w-full border border-ro-line bg-transparent px-3 py-2"
          />
        </label>
        <label className="block space-y-1 text-sm">
          <span>{labels.phone}</span>
          <input
            name="customerPhone"
            required
            className="w-full border border-ro-line bg-transparent px-3 py-2"
          />
        </label>
        <label className="block space-y-1 text-sm">
          <span>{labels.country}</span>
          <input
            name="destinationCountry"
            required
            placeholder="Syria / other country"
            className="w-full border border-ro-line bg-transparent px-3 py-2"
          />
        </label>
        <label className="block space-y-1 text-sm">
          <span>{labels.notes}</span>
          <textarea
            name="customerNotes"
            rows={3}
            className="w-full border border-ro-line bg-transparent px-3 py-2"
          />
        </label>
        {result && !result.ok ? (
          <p className="text-sm text-red-800">{result.error}</p>
        ) : null}
        <button
          type="submit"
          disabled={pending}
          className="bg-ro-purple px-5 py-3 text-sm text-ro-ivory disabled:opacity-60"
        >
          {labels.submit}
        </button>
      </form>
    </section>
  );
}
