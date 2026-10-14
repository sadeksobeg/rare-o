"use client";

import { traderCreateWholesaleRequestAction } from "@/app/wholesale-actions";
import type { ActionResult } from "@/app/actions";
import { BuilderSummaryBar } from "@/components/trader/builder-summary-bar";
import {
  ProductPicker,
  type PickerProduct,
} from "@/components/trader/product-picker";
import { Banner } from "@/components/ui/banner";
import { Dialog } from "@/components/ui/dialog";
import type { Locale } from "@/lib/i18n/config";
import { fmt, type TraderDict } from "@/lib/ui/trader-labels";
import { useActionState, useMemo, useState } from "react";

const initial: ActionResult | null = null;

const control =
  "min-h-11 w-full rounded-[var(--ro-r-sm)] border border-[var(--ro-border-control)] bg-ro-paper px-3 py-2 text-sm outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ro-focus)]";

export function WholesaleRequestForm({
  products,
  labels: t,
  locale,
}: {
  products: Array<
    PickerProduct & { currency: string; retailPrice?: number }
  >;
  labels: TraderDict;
  locale: Locale;
}) {
  const [mode, setMode] = useState<"request_quote" | "propose_price">(
    "request_quote"
  );
  const [qtyById, setQtyById] = useState<Record<string, number>>({});
  const [priceById, setPriceById] = useState<Record<string, string>>({});
  const [currencyById, setCurrencyById] = useState<Record<string, string>>({});
  const [notes, setNotes] = useState("");
  const [reviewOpen, setReviewOpen] = useState(false);
  const [state, action, pending] = useActionState(
    traderCreateWholesaleRequestAction,
    initial
  );

  const selected = useMemo(() => {
    return products
      .filter((p) => (qtyById[p.id] ?? 0) > 0)
      .map((p) => ({
        product: p,
        quantity: qtyById[p.id],
        name:
          locale === "ar" ? p.nameAr || p.nameEn : p.nameEn || p.nameAr,
      }));
  }, [products, qtyById, locale]);

  const selectedLines = useMemo(() => {
    return selected.map(({ product: p, quantity }) => ({
      productId: p.id,
      quantity,
      proposedUnitPrice:
        mode === "propose_price" && priceById[p.id]
          ? Number(priceById[p.id])
          : null,
      currency:
        mode === "propose_price"
          ? currencyById[p.id] || p.currency || null
          : null,
    }));
  }, [selected, mode, priceById, currencyById]);

  const linesJson = JSON.stringify(selectedLines);
  const countLabel = fmt(t.wsSelectedCount, { n: selected.length });

  return (
    <div className="space-y-6 pb-24">
      <label className="block max-w-md space-y-1.5 text-sm">
        <span className="font-medium">{t.wsModeLabel}</span>
        <select
          value={mode}
          onChange={(e) =>
            setMode(e.target.value as "request_quote" | "propose_price")
          }
          className={control}
        >
          <option value="request_quote">{t.requestMode.request_quote}</option>
          <option value="propose_price">{t.requestMode.propose_price}</option>
        </select>
      </label>

      <ProductPicker
        products={products}
        qtyById={qtyById}
        onQtyChange={(id, qty) =>
          setQtyById((prev) => {
            if (qty < 1) {
              const next = { ...prev };
              delete next[id];
              return next;
            }
            return { ...prev, [id]: qty };
          })
        }
        labels={t}
        locale={locale}
      />

      <BuilderSummaryBar
        countLabel={countLabel}
        reviewLabel={t.wsReviewSend}
        onReview={() => setReviewOpen(true)}
        disabled={selected.length === 0}
      />

      <Dialog
        open={reviewOpen}
        onClose={() => setReviewOpen(false)}
        title={t.wsReviewTitle}
        size="md"
      >
        <form action={action} className="space-y-4">
          <input type="hidden" name="linesJson" value={linesJson} />
          <input type="hidden" name="requestMode" value={mode} />
          <input type="hidden" name="traderNotes" value={notes} />

          <ul className="divide-y divide-ro-line border border-ro-line">
            {selected.map(({ product: p, quantity, name }) => (
              <li key={p.id} className="space-y-2 p-3 text-sm">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <span className="font-medium">{name}</span>
                  <span className="text-ro-muted">
                    {t.wsQty}: {quantity}
                  </span>
                </div>
                {mode === "propose_price" ? (
                  <div className="grid gap-2 sm:grid-cols-2">
                    <label className="block space-y-1">
                      <span className="text-xs text-ro-muted">
                        {t.wsColUnitPrice}
                      </span>
                      <input
                        type="number"
                        min={0}
                        step="0.01"
                        dir="ltr"
                        value={priceById[p.id] ?? ""}
                        onChange={(e) =>
                          setPriceById((prev) => ({
                            ...prev,
                            [p.id]: e.target.value,
                          }))
                        }
                        className={control}
                      />
                    </label>
                    <label className="block space-y-1">
                      <span className="text-xs text-ro-muted">
                        {t.wsColCurrency}
                      </span>
                      <input
                        dir="ltr"
                        value={currencyById[p.id] ?? p.currency}
                        onChange={(e) =>
                          setCurrencyById((prev) => ({
                            ...prev,
                            [p.id]: e.target.value.toUpperCase(),
                          }))
                        }
                        className={control}
                      />
                    </label>
                  </div>
                ) : null}
              </li>
            ))}
          </ul>

          <label className="block space-y-1.5 text-sm">
            <span className="font-medium">{t.wsNotes}</span>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className={control}
            />
          </label>

          {state && !state.ok ? (
            <Banner tone="danger" alert>
              {state.error}
            </Banner>
          ) : null}

          <button
            type="submit"
            disabled={pending || selected.length === 0}
            className="min-h-12 w-full bg-ro-purple px-5 text-sm text-ro-ivory disabled:opacity-60"
          >
            {pending ? t.submitting : t.wsSubmit}
          </button>
        </form>
      </Dialog>
    </div>
  );
}
