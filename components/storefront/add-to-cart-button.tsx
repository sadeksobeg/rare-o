"use client";

import { useEffect, useRef, useState } from "react";
import { Check } from "lucide-react";
import { useCart } from "@/components/storefront/cart-provider";
import { Button } from "@/components/ui/button";
import { useCartToast } from "@/components/storefront/use-cart-toast";

export function AddToCartButton({
  productId,
  slug,
  name,
  price,
  currency,
  imagePath,
  label,
  addedLabel,
  variant = "plain",
}: {
  productId: string;
  slug: string;
  name: string;
  price: number;
  currency: string | null;
  imagePath?: string | null;
  label: string;
  /** `pdp`: full-width primary button that confirms with `addedLabel` for 1.5 s. */
  addedLabel?: string;
  variant?: "plain" | "pdp";
}) {
  const { addItem } = useCart();
  const notifyAdded = useCartToast();
  const [added, setAdded] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    []
  );

  const add = () => {
    addItem({
      productId,
      slug,
      name,
      price,
      currency: currency ?? "",
      quantity: 1,
      imagePath: imagePath ?? null,
    });
    notifyAdded(name);
  };

  if (variant === "pdp") {
    return (
      <Button
        size="lg"
        className="w-full"
        onClick={() => {
          add();
          if (!addedLabel) return;
          setAdded(true);
          if (timer.current) clearTimeout(timer.current);
          timer.current = setTimeout(() => setAdded(false), 1500);
        }}
      >
        {added && addedLabel ? (
          <>
            <Check className="size-4" aria-hidden />
            <span>{addedLabel}</span>
          </>
        ) : (
          label
        )}
      </Button>
    );
  }

  return (
    <button
      type="button"
      className="bg-ro-purple px-5 py-3 text-sm text-ro-ivory"
      onClick={add}
    >
      {label}
    </button>
  );
}
