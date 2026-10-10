"use client";

import { traderCreateWholesaleRequestAction } from "@/app/wholesale-actions";
import type { ActionResult } from "@/app/actions";
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
}: {
  products: ProductOption[];
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
      <label className="block max-w-md space-y-1 text-sm">
        <span>Request mode</span>
        <select
          name="requestMode"
          value={mode}
          onChange={(e) =>
            setMode(e.target.value as "request_quote" | "propose_price")
          }
          className="w-full border border-ro-line bg-transparent px-3 py-2"
        >
          <option value="request_quote">Request quote</option>
          <option value="propose_price">Propose unit price</option>
        </select>
      </label>
      <p className="text-sm text-ro-muted">
        No wholesale list price is invented by the platform. Use{" "}
        <strong>Request quote</strong> unless you are proposing your own unit
        price. Catalog retail shown below is a reference only — not wholesale
        pricing. MOQ is not enforced. Quantity max {WHOLESALE_QTY_TECHNICAL_MAX}{" "}
        is a technical safety limit only.
      </p>

      <div className="overflow-x-auto border border-ro-line">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-ro-line bg-ro-surface">
            <tr>
              <th className="p-3">Product</th>
              <th className="p-3">Catalog retail (ref.)</th>
              <th className="p-3">Qty</th>
              {mode === "propose_price" ? (
                <>
                  <th className="p-3">Your unit price</th>
                  <th className="p-3">Currency</th>
                </>
              ) : null}
            </tr>
          </thead>
          <tbody>
            {products.length === 0 ? (
              <tr>
                <td className="p-4 text-ro-muted" colSpan={5}>
                  No wholesale-eligible published products.
                </td>
              </tr>
            ) : (
              products.map((p) => (
                <tr key={p.id} className="border-b border-ro-line">
                  <td className="p-3">
                    {p.nameEn || p.nameAr}
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
                      value={qtyById[p.id] ?? 0}
                      onChange={(e) =>
                        setQtyById((prev) => ({
                          ...prev,
                          [p.id]: Number(e.target.value) || 0,
                        }))
                      }
                      className="w-24 border border-ro-line bg-transparent px-2 py-1"
                    />
                  </td>
                  {mode === "propose_price" ? (
                    <>
                      <td className="p-3">
                        <input
                          type="number"
                          min={0}
                          step="0.01"
                          value={priceById[p.id] ?? ""}
                          onChange={(e) =>
                            setPriceById((prev) => ({
                              ...prev,
                              [p.id]: e.target.value,
                            }))
                          }
                          className="w-28 border border-ro-line bg-transparent px-2 py-1"
                          disabled={(qtyById[p.id] ?? 0) < 1}
                        />
                      </td>
                      <td className="p-3">
                        <input
                          value={currencyById[p.id] ?? p.currency}
                          onChange={(e) =>
                            setCurrencyById((prev) => ({
                              ...prev,
                              [p.id]: e.target.value.toUpperCase(),
                            }))
                          }
                          className="w-24 border border-ro-line bg-transparent px-2 py-1"
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

      <label className="block max-w-xl space-y-1 text-sm">
        <span>Notes</span>
        <textarea
          name="traderNotes"
          rows={3}
          className="w-full border border-ro-line bg-transparent px-3 py-2"
        />
      </label>

      {state && !state.ok ? (
        <p className="text-sm text-red-800">{state.error}</p>
      ) : null}

      <button
        type="submit"
        disabled={pending || selectedLines.length === 0}
        className="bg-ro-purple px-5 py-3 text-sm text-ro-ivory disabled:opacity-60"
      >
        Submit wholesale request
      </button>
    </form>
  );
}
