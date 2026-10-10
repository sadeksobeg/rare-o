"use client";

import { ToastProvider } from "@/components/ui/toast";

/** Toast host for admin/trader shells (storefront uses StorefrontProviders). */
export function AppToast({
  dismissLabel,
  children,
}: {
  dismissLabel: string;
  children: React.ReactNode;
}) {
  return <ToastProvider dismissLabel={dismissLabel}>{children}</ToastProvider>;
}
