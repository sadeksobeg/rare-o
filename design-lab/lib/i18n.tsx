"use client";

import { createContext, useContext, useEffect, useState } from "react";

export type Locale = "ar" | "en";

type LocaleContextValue = {
  locale: Locale;
  toggleLocale: () => void;
};

const LocaleContext = createContext<LocaleContextValue | null>(null);

function readSavedLocale(): Locale {
  try {
    const saved = localStorage.getItem("ro-locale");
    if (saved === "ar" || saved === "en") return saved;
  } catch {
    // ignore — falls back to the default locale
  }
  return "ar";
}

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  // Always starts at "ar" — matching the server-rendered <html lang="ar">
  // exactly — so the client's first (hydration) render never diverges from
  // the server output. Reading localStorage straight into the initial state
  // broke this: the lazy-initializer ran during hydration too, so a saved
  // "en" preference made the client's first paint request English strings
  // while the server had sent Arabic ones, and React discarded/regenerated
  // the mismatched subtree (a real "Hydration failed" error caught live).
  const [locale, setLocale] = useState<Locale>("ar");
  const [hydrated, setHydrated] = useState(false);

  // Runs once, after hydration commits — corrects from the saved
  // preference if it differs, safely as a client-only second render.
  useEffect(() => {
    const saved = readSavedLocale();
    if (saved !== "ar") setLocale(saved);
    setHydrated(true);
  }, []);

  // Applies the locale to the document and persists it, but only once
  // hydration's one-time correction above has happened — otherwise this
  // fires on the initial "ar" render too and immediately overwrites a
  // just-read "en" preference back to "ar" before the correction lands.
  useEffect(() => {
    if (!hydrated) return;
    document.documentElement.lang = locale;
    document.documentElement.dir = locale === "ar" ? "rtl" : "ltr";
    try {
      localStorage.setItem("ro-locale", locale);
    } catch {
      // per-viewer convenience only; safe to skip if storage is blocked
    }
  }, [locale, hydrated]);

  function toggleLocale() {
    setLocale((l) => (l === "ar" ? "en" : "ar"));
  }

  return <LocaleContext.Provider value={{ locale, toggleLocale }}>{children}</LocaleContext.Provider>;
}

export function useLocale() {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error("useLocale must be used within a LocaleProvider");
  return ctx;
}

/** Builds a `t(key)` function from a {ar, en} dictionary for the current locale. */
export function useDict<D extends Record<string, { ar: string; en: string }>>(dict: D) {
  const { locale } = useLocale();
  return function t(key: keyof D): string {
    return dict[key][locale];
  };
}
