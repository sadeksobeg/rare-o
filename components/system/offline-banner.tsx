"use client";

import { useEffect, useRef, useState } from "react";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { defaultLocale, isLocale } from "@/lib/i18n/config";
import { useToast } from "@/components/ui/toast";

export function OfflineBanner() {
  const [offline, setOffline] = useState(false);
  const [label, setLabel] = useState("");
  const { toast } = useToast();
  // Latest toast fn without re-subscribing listeners; only reconnects (not first load) toast.
  const toastRef = useRef(toast);
  const wasOffline = useRef(false);
  const onlineLabel = useRef("");

  useEffect(() => {
    toastRef.current = toast;
  }, [toast]);

  useEffect(() => {
    const lang = document.documentElement.lang;
    const dict = getDictionary(isLocale(lang) ? lang : defaultLocale);
    setLabel(dict.common.errorOffline);
    onlineLabel.current = dict.common.backOnline;

    const sync = () => {
      const isOffline = !navigator.onLine;
      if (wasOffline.current && !isOffline) {
        toastRef.current({ message: onlineLabel.current, tone: "info" });
      }
      wasOffline.current = isOffline;
      setOffline(isOffline);
    };
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
