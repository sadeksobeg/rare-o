"use client";

import Link from "next/link";
import { useMemo } from "react";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { defaultLocale, isLocale } from "@/lib/i18n/config";
import { Button } from "@/components/ui/button";

export function RouteError({
  reset,
  homeHref,
}: {
  error: Error & { digest?: string };
  reset: () => void;
  homeHref?: string;
}) {
  const dict = useMemo(() => {
    const lang =
      typeof document !== "undefined" ? document.documentElement.lang : "ar";
    return getDictionary(isLocale(lang) ? lang : defaultLocale);
  }, []);

  const href = homeHref ?? "/contact";
  const homeLabel =
    href === "/admin" || href === "/trader"
      ? dict.common.goToPortal
      : dict.nav.contact;

  return (
    <div className="mx-auto flex min-h-[50vh] max-w-lg flex-col items-center justify-center px-6 py-16 text-center">
      <h1 className="text-2xl font-semibold">{dict.common.errorTitle}</h1>
      <p className="mt-3 text-sm text-ro-muted">{dict.common.errorBody}</p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Button type="button" variant="primary" onClick={reset}>
          {dict.common.errorRetry}
        </Button>
        <Link
          href={href}
          className="inline-flex min-h-11 items-center border border-ro-line px-4 text-sm font-medium text-ro-plum hover:bg-ro-sunken"
        >
          {homeLabel}
        </Link>
      </div>
    </div>
  );
}
