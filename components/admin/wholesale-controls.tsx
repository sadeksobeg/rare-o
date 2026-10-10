"use client";

import {
  adminProvideWholesaleQuoteAction,
  adminTransitionWholesaleAction,
} from "@/app/wholesale-actions";
import { WHOLESALE_TRANSITIONS, type WholesaleStatus } from "@/lib/wholesale/constants";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";

export function AdminWholesaleControls({
  requestId,
  status,
  requestMode,
  lines,
  quoteCurrencyDefault,
}: {
  requestId: string;
  status: string;
  requestMode: string;
  lines: Array<{ id: string; productNameEn: string; quantity: number }>;
  quoteCurrencyDefault: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [prices, setPrices] = useState<Record<string, string>>({});

  const nextStatuses = useMemo(() => {
    const current = status as WholesaleStatus;
    return WHOLESALE_TRANSITIONS[current] ?? [];
  }, [status]);

  const lineQuotesJson = JSON.stringify(
    lines.map((l) => ({
      lineId: l.id,
      quotedUnitPrice: Number(prices[l.id] || 0),
    }))
  );

  const canQuote =
    status === "submitted" ||
    status === "under_review" ||
    status === "quote_provided";

  return (
    <div className="space-y-6 border border-ro-line p-4">
      <h2 className="text-lg">Admin operations</h2>

      {nextStatuses.length > 0 ? (
        <form
          className="flex flex-wrap items-end gap-3"
          action={(fd) => {
            startTransition(async () => {
              setError(null);
              setMessage(null);
              const res = await adminTransitionWholesaleAction(fd);
              if (!res.ok) setError(res.error);
              else {
                setMessage("Status updated.");
                router.refresh();
              }
            });
          }}
        >
          <input type="hidden" name="requestId" value={requestId} />
          <label className="space-y-1 text-sm">
            <span className="block text-ro-muted">Move to</span>
            <select
              name="toStatus"
              required
              className="border border-ro-line bg-transparent px-3 py-2"
            >
              {nextStatuses.map((s) => (
                <option key={s} value={s}>
                  {s}
                  {s === "confirmed" &&
                  status === "under_review" &&
                  requestMode === "request_quote"
                    ? " (blocked until quote — use quotation form)"
                    : ""}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-1 text-sm">
            <span className="block text-ro-muted">Note</span>
            <input
              name="note"
              className="border border-ro-line bg-transparent px-3 py-2"
            />
          </label>
          <button
            type="submit"
            disabled={pending}
            className="bg-ro-purple px-4 py-2 text-sm text-ro-ivory disabled:opacity-60"
          >
            Apply
          </button>
        </form>
      ) : (
        <p className="text-sm text-ro-muted">Terminal status.</p>
      )}

      {canQuote ? (
        <form
          className="space-y-3 border-t border-ro-line pt-4"
          action={(fd) => {
            startTransition(async () => {
              setError(null);
              setMessage(null);
              const res = await adminProvideWholesaleQuoteAction(null, fd);
              if (!res.ok) setError(res.error);
              else {
                setMessage("Quotation saved.");
                router.refresh();
              }
            });
          }}
        >
          <h3 className="text-base">Provide quotation</h3>
          <p className="text-sm text-ro-muted">
            Simple quote workflow only — no payment, shipping rates, or ERP.
          </p>
          <input type="hidden" name="requestId" value={requestId} />
          <input type="hidden" name="lineQuotesJson" value={lineQuotesJson} />
          <label className="block max-w-xs space-y-1 text-sm">
            <span>Quote currency</span>
            <input
              name="quoteCurrency"
              required
              defaultValue={quoteCurrencyDefault}
              className="w-full border border-ro-line bg-transparent px-3 py-2"
            />
          </label>
          <div className="space-y-2">
            {lines.map((l) => (
              <label key={l.id} className="flex flex-wrap items-center gap-3 text-sm">
                <span className="min-w-[12rem]">
                  {l.productNameEn} × {l.quantity}
                </span>
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  required
                  placeholder="Quoted unit price"
                  value={prices[l.id] ?? ""}
                  onChange={(e) =>
                    setPrices((prev) => ({ ...prev, [l.id]: e.target.value }))
                  }
                  className="w-40 border border-ro-line bg-transparent px-2 py-1"
                />
              </label>
            ))}
          </div>
          <label className="block space-y-1 text-sm">
            <span>Quote message</span>
            <textarea
              name="quoteMessage"
              rows={3}
              className="w-full border border-ro-line bg-transparent px-3 py-2"
            />
          </label>
          <button
            type="submit"
            disabled={pending}
            className="border border-ro-line px-4 py-2 text-sm disabled:opacity-60"
          >
            Save quotation → quote_provided
          </button>
        </form>
      ) : null}

      {message ? <p className="text-sm text-ro-muted">{message}</p> : null}
      {error ? <p className="text-sm text-red-800">{error}</p> : null}
    </div>
  );
}
