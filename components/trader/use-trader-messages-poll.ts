"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

const BASE_MS = 8000;
const MAX_MS = 60000;

/**
 * Lightweight poll for /trader/messages — pauses when tab hidden,
 * exponential backoff on errors, router.refresh only when cursor changes.
 */
export function useTraderMessagesPoll(enabled: boolean) {
  const router = useRouter();
  const lastRef = useRef<string | null>(null);
  const delayRef = useRef(BASE_MS);

  useEffect(() => {
    if (!enabled || typeof window === "undefined") return;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;

    async function tick() {
      if (cancelled) return;
      if (document.visibilityState === "hidden") {
        timer = setTimeout(tick, BASE_MS);
        return;
      }
      try {
        const res = await fetch("/api/trader/messages/cursor", {
          credentials: "same-origin",
          cache: "no-store",
        });
        if (!res.ok) throw new Error(`cursor_${res.status}`);
        const data = (await res.json()) as {
          lastMessageId?: string | null;
          updatedAt?: string | null;
          unreadCount?: number;
        };
        const key = `${data.lastMessageId ?? ""}|${data.updatedAt ?? ""}|${data.unreadCount ?? 0}`;
        if (lastRef.current === null) {
          lastRef.current = key;
        } else if (lastRef.current !== key) {
          lastRef.current = key;
          router.refresh();
        }
        delayRef.current = BASE_MS;
      } catch {
        delayRef.current = Math.min(MAX_MS, Math.round(delayRef.current * 1.6));
      }
      if (!cancelled) {
        timer = setTimeout(tick, delayRef.current);
      }
    }

    timer = setTimeout(tick, BASE_MS);
    const onVis = () => {
      if (document.visibilityState === "visible") {
        delayRef.current = BASE_MS;
        if (timer) clearTimeout(timer);
        timer = setTimeout(tick, 400);
      }
    };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [enabled, router]);
}
