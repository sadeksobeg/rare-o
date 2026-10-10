"use client";

import { useCallback } from "react";
import { useToast } from "@/components/ui/toast";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { defaultLocale, isLocale } from "@/lib/i18n/config";
import { href } from "@/lib/href";

/**
 * Fires the "added to request list" toast with a link to the cart.
 * Strings resolve from the document locale (same approach as OfflineBanner),
 * so callers needn't thread the dictionary through.
 */
export function useCartToast() {
  const { toast } = useToast();

  return useCallback(
    (name?: string, message?: string) => {
      const lang = document.documentElement.lang;
      const locale = isLocale(lang) ? lang : defaultLocale;
      const { product } = getDictionary(locale);
      toast({
        message:
          message ??
          (name
            ? product.addedToast.replace("{name}", name)
            : product.added),
        actionLabel: product.viewCart,
        actionHref: href("/cart", locale),
      });
    },
    [toast]
  );
}
