"use client";

import Link from "next/link";
import { useCart } from "@/components/storefront/cart-provider";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { href } from "@/lib/href";
import type { Locale } from "@/lib/i18n/config";

export function CartView({
  title,
  empty,
  continueLabel,
  removeLabel,
  catalogLabel,
  locale,
}: {
  title: string;
  empty: string;
  continueLabel: string;
  removeLabel: string;
  catalogLabel: string;
  locale: Locale;
}) {
  const { items, removeItem, setQuantity } = useCart();

  if (items.length === 0) {
    return (
      <EmptyState
        title={title}
        body={empty}
        actionHref={href("/catalog", locale)}
        actionLabel={catalogLabel}
      />
    );
  }

  const currency = items[0]?.currency;

  return (
    <section className="space-y-6">
      <h1 className="ro-type-h1">{title}</h1>
      <p className="text-sm text-ro-muted">
        {items.reduce((n, i) => n + i.quantity, 0)} · <bdi>{currency}</bdi>
      </p>
      <ul className="space-y-4">
        {items.map((item) => (
          <li
            key={item.productId}
            className="flex flex-wrap items-center justify-between gap-3 border-b border-ro-border py-3"
          >
            <div>
              <p className="font-medium">
                <Link
                  href={href(`/product/${item.slug}`, locale)}
                  className="hover:text-ro-plum"
                >
                  {item.name}
                </Link>
              </p>
              <p className="text-sm text-ro-muted tabular-nums">
                <bdi>
                  {item.price} {item.currency}
                </bdi>
              </p>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="number"
                min={1}
                max={99}
                value={item.quantity}
                aria-label={item.name}
                onChange={(e) =>
                  setQuantity(item.productId, Number(e.target.value) || 1)
                }
                className="h-11 w-16 rounded-[var(--ro-r-sm)] border border-[var(--ro-border-control)] bg-ro-paper px-2 text-center tabular-nums"
              />
              <button
                type="button"
                className="text-sm text-ro-muted underline-offset-4 hover:underline"
                onClick={() => removeItem(item.productId)}
              >
                {removeLabel}
              </button>
            </div>
          </li>
        ))}
      </ul>
      <ButtonLink href={href("/request", locale)}>{continueLabel}</ButtonLink>
    </section>
  );
}
