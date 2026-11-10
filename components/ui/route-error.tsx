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
  const isPortal = href === "/admin" || href === "/trader";

  return (
    <div
      data-portal={href === "/trader" ? "trader" : "admin"}
      data-theme="dark"
      className="ro-portal relative flex min-h-[100dvh] w-full flex-col items-center justify-center bg-[color:var(--rad-c0,#0B080D)] px-6 py-16 text-center"
      style={{ color: "var(--rad-tx, #F4E7D8)" }}
    >
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at top, color-mix(in srgb, var(--rad-ac, #C4A0EA) 14%, transparent), transparent 55%)",
        }}
        aria-hidden
      />
      <div className="relative z-10 mx-auto flex w-full max-w-lg flex-col items-center">
        <h1
          className="text-2xl font-semibold sm:text-3xl"
          style={{ fontFamily: "var(--rad-font, inherit)" }}
        >
          {dict.common.errorTitle}
        </h1>
        <p className="mt-3 text-sm" style={{ color: "var(--rad-tx2)" }}>
          {dict.common.errorBody}
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Button type="button" variant="primary" onClick={reset}>
            {dict.common.errorRetry}
          </Button>
          <Link
            href={href}
            className="inline-flex min-h-11 items-center rounded-[11px] border px-4 text-sm font-medium"
            style={{
              borderColor: "var(--rad-bd2)",
              color: "var(--rad-tx)",
              background: "var(--rad-surface3)",
            }}
          >
            {homeLabel}
          </Link>
          {!isPortal ? (
            <Link
              href="/"
              className="inline-flex min-h-11 items-center rounded-[11px] px-4 text-sm font-medium"
              style={{ color: "var(--rad-ac)" }}
            >
              {dict.nav.home}
            </Link>
          ) : null}
        </div>
      </div>
    </div>
  );
}
