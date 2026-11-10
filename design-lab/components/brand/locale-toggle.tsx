"use client";

import { Languages } from "lucide-react";
import { useLocale } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function LocaleToggle({ className }: { className?: string }) {
  const { locale, toggleLocale } = useLocale();
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={toggleLocale}
      className={cn("gap-1.5", className)}
      aria-label={locale === "ar" ? "Switch to English" : "التبديل إلى العربية"}
    >
      <Languages className="size-4" strokeWidth={1.5} />
      {locale === "ar" ? "EN" : "عربي"}
    </Button>
  );
}
