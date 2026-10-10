"use client";

import { traderCreateWholesaleRequestAction } from "@/app/wholesale-actions";
import type { ActionResult } from "@/app/actions";
import { Banner } from "@/components/ui/banner";
import type { Locale } from "@/lib/i18n/config";
import { fmt, type TraderDict } from "@/lib/ui/trader-labels";
import { WHOLESALE_QTY_TECHNICAL_MAX } from "@/lib/wholesale/constants";
import { useActionState, useMemo, useState } from "react";

type ProductOption = {
  id: string;
  slug: string;
  nameEn: string;
  nameAr: string;
  currency: string;
  retailPrice: number;
};

const initial: ActionResult | null = null;

export function WholesaleRequestForm({
  products,
  labels: t,
  locale,
}: {
  products: ProductOption[];
  labels: TraderDict;
  locale: Locale;
}) {
  const [mode, setMode] = useState<"request_quote" | "propose_price">(
    "request_quote"
  );
  const [qtyById, setQtyById] = useState<Record<string, number>>({});
  const [priceById, setPriceById] = useState<Record<string, string>>({});
  const [currencyById, setCurrencyById] = useState<Record<string, string>>({});
  const [state, action, pending] = useActionState(
    traderCreateWholesaleRequestAction,
    initial
  );

  const selectedLines = useMemo(() => {
    return products
      .filter((p) => (qtyById[p.id] ?? 0) > 0)
      .map((p) => ({
        productId: p.id,
        quantity: qtyById[p.id],
        proposedUnitPrice:
          mode === "propose_price" && priceById[p.id]
            ? Number(priceById[p.id])
            : null,
        currency:
          mode === "propose_price"
            ? currencyById[p.id] || p.currency || null
            : null,
      }));
  }, [products, qtyById, priceById, currencyById, mode]);

  const linesJson = JSON.stringify(selectedLines);

  return (
    <form action={action} className="space-y-6">
      <input type="hidden" name="linesJson" value={linesJson} />
      <label className="block max-w-md space-y-1.5 text-sm">
        <span className="font-medium">{t.wsModeLabel}</span>
        <select
          name="requestMode"
          value={mode}
          onChange={(e) =>
            setMode(e.target.value as "request_quote" | "propose_price")
          }
          className="min-h-11 w-full border border-ro-line bg-transparent px-3 py-2"
        >
          <option value="request_quote">{t.requestMode.request_quote}</option>
          <option value="propose_price">{t.requestMode.propose_price}</option>
        </select>
      </label>
      <p className="text-sm text-ro-muted">
        {fmt(t.wsFormHint, { max: WHOLESALE_QTY_TECHNICAL_MAX })}
      </p>

      <div className="overflow-x-auto border border-ro-line">
        <table className="min-w-full text-start text-sm">
          <thead className="border-b border-ro-line bg-ro-surface">
            <tr>
              <th className="p-3 text-start font-medium">{t.wsColProduct}</th>
              <th className="p-3 text-start font-medium">{t.wsColRetail}</th>
              <th className="p-3 text-start font-medium">{t.wsColQty}</th>
              {mode === "propose_price" ? (
                <>
                  <th className="p-3 text-start font-medium">
                    {t.wsColUnitPrice}
                  </th>
                  <th className="p-3 text-start font-medium">
                    {t.wsColCurrency}
                  </th>
                </>
              ) : null}
            </tr>
          </thead>
          <tbody>
            {products.length === 0 ? (
              <tr>
                <td className="p-4 text-ro-muted" colSpan={5}>
                  {t.wsNoProducts}
                </td>
              </tr>
            ) : (
              products.map((p) => (
                <tr key={p.id} className="border-b border-ro-line">
                  <td className="p-3">
                    {locale === "ar"
                      ? p.nameAr || p.nameEn
                      : p.nameEn || p.nameAr}
                    <div className="text-ro-muted">{p.slug}</div>
                  </td>
                  <td className="p-3 text-ro-muted">
                    {p.retailPrice} {p.currency}
                  </td>
                  <td className="p-3">
                    <input
                      type="number"
                      min={0}
                      max={WHOLESALE_QTY_TECHNICAL_MAX}
                      step={1}
                      dir="ltr"
                      value={qtyById[p.id] ?? 0}
                      onChange={(e) =>
                        setQtyById((prev) => ({
                          ...prev,
                          [p.id]: Number(e.target.value) || 0,
                        }))
                      }
                      className="min-h-10 w-24 border border-ro-line bg-transparent px-2 py-1"
                    />
                  </td>
                  {mode === "propose_price" ? (
                    <>
                      <td className="p-3">
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
                          className="min-h-10 w-28 border border-ro-line bg-transparent px-2 py-1"
                          disabled={(qtyById[p.id] ?? 0) < 1}
                        />
                      </td>
                      <td className="p-3">
                        <input
                          dir="ltr"
                          value={currencyById[p.id] ?? p.currency}
                          onChange={(e) =>
                            setCurrencyById((prev) => ({
                              ...prev,
                              [p.id]: e.target.value.toUpperCase(),
                            }))
                          }
                          className="min-h-10 w-24 border border-ro-line bg-transparent px-2 py-1"
                          disabled={(qtyById[p.id] ?? 0) < 1}
                        />
                      </td>
                    </>
                  ) : null}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <label className="block max-w-xl space-y-1.5 text-sm">
        <span className="font-medium">{t.wsNotes}</span>
        <textarea
          name="traderNotes"
          rows={3}
          className="w-full border border-ro-line bg-transparent px-3 py-2"
        />
      </label>

      {state && !state.ok ? (
        <Banner tone="danger" alert>
          {state.error}
        </Banner>
      ) : null}

      <button
        type="submit"
        disabled={pending || selectedLines.length === 0}
        className="min-h-12 bg-ro-purple px-5 text-sm text-ro-ivory disabled:opacity-60"
      >
        {t.wsSubmit}
      </button>
    </form>
  );
}
