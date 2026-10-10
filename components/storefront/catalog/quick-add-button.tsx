"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Plus } from "lucide-react";
import { useCart } from "@/components/storefront/cart-provider";
import { useCartToast } from "@/components/storefront/use-cart-toast";
import { cn } from "@/lib/utils";

/** Desktop-only hover/focus quick add used by the catalog ProductCard. */
export function QuickAddButton({
  productId,
  slug,
  name,
  price,
  currency,
  imagePath,
  label,
  addedLabel,
  className,
}: {
  productId: string;
  slug: string;
  name: string;
  price: number;
  currency: string;
  imagePath?: string | null;
  label: string;
  addedLabel: string;
  className?: string;
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

  return (
    <>
      <button
        type="button"
        aria-label={label}
        title={label}
        onClick={() => {
          addItem({
            productId,
            slug,
            name,
            price,
            currency,
            quantity: 1,
            imagePath: imagePath ?? null,
          });
          notifyAdded(name, addedLabel);
          setAdded(true);
          if (timer.current) clearTimeout(timer.current);
          timer.current = setTimeout(() => setAdded(false), 1500);
        }}
        className={cn(
          "hidden size-11 items-center justify-center rounded-[var(--ro-r-full)] bg-ro-ink text-ro-canvas shadow-[var(--ro-e2)]",
          "transition-[opacity,background-color] duration-[var(--ro-dur-fast)] ease-[var(--ro-ease-standard)] hover:bg-ro-plum",
          "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ro-focus)]",
          "md:inline-flex md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100",
          className
        )}
      >
        {added ? (
          <Check className="size-5" aria-hidden />
        ) : (
          <Plus className="size-5" aria-hidden />
        )}
      </button>
    </>
  );
}
