"use client";

import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import type { Locale } from "@/lib/i18n/config";

const COPY = {
  ar: {
    success: "تم بنجاح",
    error: "حدث خطأ",
    info: "تنبيه",
    successLabel: "نجاح",
    errorLabel: "خطأ",
    infoLabel: "معلومة",
  },
  en: {
    success: "Saved successfully",
    error: "Something went wrong",
    info: "Heads up",
    successLabel: "Success",
    errorLabel: "Error",
    infoLabel: "Info",
  },
} as const;

export function DevToastDemo({ locale }: { locale: Locale }) {
  const c = COPY[locale];
  return (
    <div className="flex flex-wrap gap-3">
      <Button onClick={() => toast.success(c.success)}>{c.successLabel}</Button>
      <Button variant="danger" onClick={() => toast.error(c.error)}>
        {c.errorLabel}
      </Button>
      <Button variant="secondary" onClick={() => toast(c.info)}>
        {c.infoLabel}
      </Button>
    </div>
  );
}
