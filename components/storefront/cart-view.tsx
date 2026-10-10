"use client";

import Link from "next/link";
import { useCart } from "@/components/storefront/cart-provider";

export function CartView({
  title,
  empty,
  continueLabel,
  removeLabel,
}: {
  title: string;
  empty: string;
  continueLabel: string;
  removeLabel: string;
}) {
  const { items, removeItem, setQuantity } = useCart();

  if (items.length === 0) {
    return (
      <section className="space-y-4">
        <h1 className="text-3xl">{title}</h1>
        <p className="text-ro-muted">{empty}</p>
        <Link href="/catalog" className="text-ro-purple">
          ←
        </Link>
      </section>
    );
  }

  const currency = items[0]?.currency;

  return (
    <section className="space-y-6">
      <h1 className="text-3xl">{title}</h1>
      <ul className="space-y-4">
        {items.map((item) => (
          <li
            key={item.productId}
            className="flex flex-wrap items-center justify-between gap-3 border-b border-ro-line py-3"
          >
            <div>
              <p className="font-medium">{item.name}</p>
              <p className="text-sm text-ro-muted">
                {item.price} {item.currency}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="number"
                min={1}
                max={99}
                value={item.quantity}
                onChange={(e) =>
                  setQuantity(item.productId, Number(e.target.value) || 1)
                }
                className="w-16 border border-ro-line bg-transparent px-2 py-1"
              />
              <button
                type="button"
                className="text-sm text-ro-muted"
                onClick={() => removeItem(item.productId)}
              >
                {removeLabel}
              </button>
            </div>
          </li>
        ))}
      </ul>
      <p className="text-sm text-ro-muted">Currency: {currency}</p>
      <Link href="/request" className="inline-flex bg-ro-purple px-5 py-3 text-sm text-ro-ivory">
        {continueLabel}
      </Link>
    </section>
  );
}
