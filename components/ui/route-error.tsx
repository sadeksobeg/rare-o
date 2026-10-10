"use client";

import { useMemo } from "react";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { defaultLocale, isLocale } from "@/lib/i18n/config";
import { Button } from "@/components/ui/button";

export function RouteError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const dict = useMemo(() => {
    const lang =
      typeof document !== "undefined" ? document.documentElement.lang : "ar";
    return getDictionary(isLocale(lang) ? lang : defaultLocale);
  }, []);

  return (
    <div className="mx-auto flex min-h-[50vh] max-w-lg flex-col items-center justify-center px-6 py-16 text-center">
      <h1 className="text-2xl font-semibold">{dict.common.errorTitle}</h1>
      <p className="mt-3 text-sm text-ro-muted">{dict.common.errorBody}</p>
      <Button type="button" variant="primary" className="mt-8" onClick={reset}>
        {dict.common.errorRetry}
      </Button>
    </div>
  );
}
