"use client";

import { CartProvider } from "@/components/storefront/cart-provider";
import { ToastProvider } from "@/components/ui/toast";

export function StorefrontProviders({
  children,
  toastDismissLabel,
}: {
  children: React.ReactNode;
  toastDismissLabel: string;
}) {
  return (
    <CartProvider>
      <ToastProvider dismissLabel={toastDismissLabel}>{children}</ToastProvider>
    </CartProvider>
  );
}
