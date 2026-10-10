"use client";

import { CartProvider } from "@/components/storefront/cart-provider";

export function StorefrontProviders({
  children,
}: {
  children: React.ReactNode;
}) {
  return <CartProvider>{children}</CartProvider>;
}
