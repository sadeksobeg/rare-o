"use client";

import { useEffect, useState } from "react";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { defaultLocale, isLocale } from "@/lib/i18n/config";

export function OfflineBanner() {
  const [offline, setOffline] = useState(false);
  const [label, setLabel] = useState("");

  useEffect(() => {
    const lang = document.documentElement.lang;
    const dict = getDictionary(isLocale(lang) ? lang : defaultLocale);
    setLabel(dict.common.errorOffline);

    const sync = () => setOffline(!navigator.onLine);
    sync();
    window.addEventListener("online", sync);
    window.addEventListener("offline", sync);
    return () => {
      window.removeEventListener("online", sync);
      window.removeEventListener("offline", sync);
    };
  }, []);

  if (!offline) return null;

  return (
    <div
      role="status"
      className="sticky top-0 z-[60] bg-[var(--ro-amber-100)] px-4 py-2 text-center text-sm text-[var(--ro-amber-800)]"
    >
      {label}
    </div>
  );
}
