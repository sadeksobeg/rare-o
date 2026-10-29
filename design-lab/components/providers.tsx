"use client";

import { LocaleProvider, useLocale } from "@/lib/i18n";
import { DirectionProvider } from "@/components/ui/direction";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";

function DirectionAndToast({ children }: { children: React.ReactNode }) {
  const { locale } = useLocale();
  const dir = locale === "ar" ? "rtl" : "ltr";
  return (
    <DirectionProvider direction={dir}>
      <TooltipProvider>{children}</TooltipProvider>
      <Toaster position="top-center" dir={dir} />
    </DirectionProvider>
  );
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <LocaleProvider>
      <DirectionAndToast>{children}</DirectionAndToast>
    </LocaleProvider>
  );
}
