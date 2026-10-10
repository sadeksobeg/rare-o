"use client";

import { traderCreateDealAction } from "@/app/deal-actions";
import type { ActionResult } from "@/app/actions";
import { useActionState, useState } from "react";

const initial: ActionResult | null = null;

export function NewDealForm({
  products,
}: {
  products: Array<{ id: string; nameEn: string; nameAr: string; slug: string }>;
}) {
  const [state, action, pending] = useActionState(
    traderCreateDealAction,
    initial
  );
  const [kind, setKind] = useState<"catalog" | "non_catalog">("catalog");

  return (
    <form action={action} className="mx-auto max-w-xl space-y-4">
      <label className="block space-y-1 text-sm">
        <span>Deal type</span>
        <select
          name="dealKind"
          value={kind}
          onChange={(e) =>
            setKind(e.target.value as "catalog" | "non_catalog")
          }
          className="w-full border border-ro-line bg-transparent px-3 py-2"
        >
          <option value="catalog">Catalog deal</option>
          <option value="non_catalog">Non-catalog opportunity</option>
        </select>
      </label>
      <label className="block space-y-1 text-sm">
        <span>Subject / title</span>
        <input
          name="title"
          required
          maxLength={200}
          className="w-full border border-ro-line bg-transparent px-3 py-2"
        />
      </label>
      {kind === "catalog" ? (
        <label className="block space-y-1 text-sm">
          <span>Catalog product</span>
          <select
            name="productId"
            required
            className="w-full border border-ro-line bg-transparent px-3 py-2"
          >
            <option value="">Select product</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nameEn || p.nameAr} ({p.slug})
              </option>
            ))}
          </select>
        </label>
      ) : (
        <p className="text-sm text-ro-muted">
          Non-catalog proposals do not create or modify products/categories.
        </p>
      )}
      <div className="grid gap-3 sm:grid-cols-3">
        <label className="block space-y-1 text-sm">
          <span>Proposed price (optional)</span>
          <input
            name="proposedPrice"
            type="number"
            step="0.01"
            min="0"
            className="w-full border border-ro-line bg-transparent px-3 py-2"
          />
        </label>
        <label className="block space-y-1 text-sm">
          <span>Currency</span>
          <input
            name="currency"
            placeholder="USD"
            className="w-full border border-ro-line bg-transparent px-3 py-2"
          />
        </label>
        <label className="block space-y-1 text-sm">
          <span>Quantity</span>
          <input
            name="quantity"
            type="number"
            min="1"
            className="w-full border border-ro-line bg-transparent px-3 py-2"
          />
        </label>
      </div>
      <label className="block space-y-1 text-sm">
        <span>Conditions / notes</span>
        <textarea
          name="conditionsNotes"
          rows={3}
          className="w-full border border-ro-line bg-transparent px-3 py-2"
        />
      </label>
      <label className="block space-y-1 text-sm">
        <span>Initial message</span>
        <textarea
          name="message"
          rows={3}
          className="w-full border border-ro-line bg-transparent px-3 py-2"
        />
      </label>
      {state && !state.ok ? (
        <p className="text-sm text-red-800">{state.error}</p>
      ) : null}
      <button
        type="submit"
        disabled={pending}
        className="bg-ro-purple px-5 py-3 text-sm text-ro-ivory disabled:opacity-60"
      >
        Submit proposal
      </button>
    </form>
  );
}
