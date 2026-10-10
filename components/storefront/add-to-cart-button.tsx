"use client";

import { useCart } from "@/components/storefront/cart-provider";

export function AddToCartButton({
  productId,
  slug,
  name,
  price,
  currency,
  label,
}: {
  productId: string;
  slug: string;
  name: string;
  price: number;
  currency: string;
  label: string;
}) {
  const { addItem } = useCart();

  return (
    <button
      type="button"
      className="bg-ro-purple px-5 py-3 text-sm text-ro-ivory"
      onClick={() =>
        addItem({ productId, slug, name, price, currency, quantity: 1 })
      }
    >
      {label}
    </button>
  );
}
