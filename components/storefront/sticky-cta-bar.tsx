"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * Mobile-only bottom bar (price + primary action). Hides itself while the
 * in-page CTA identified by `watchId` is on screen, so the action never shows twice.
 */
export function StickyCtaBar({
  watchId,
  children,
}: {
  watchId: string;
  children: React.ReactNode;
}) {
  const [inlineVisible, setInlineVisible] = useState(false);

  useEffect(() => {
    const target = document.getElementById(watchId);
    if (!target) return;
    const observer = new IntersectionObserver(
      ([entry]) => setInlineVisible(entry.isIntersecting),
      { threshold: 0.1 }
    );
    observer.observe(target);
    return () => observer.disconnect();
  }, [watchId]);

  return (
    <div
      className={cn(
        "fixed inset-x-0 bottom-0 z-40 border-t border-ro-border bg-ro-canvas/95 px-4 pt-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] backdrop-blur transition-transform duration-[var(--ro-dur-fast)] md:hidden",
        inlineVisible && "translate-y-full"
      )}
      inert={inlineVisible || undefined}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
        {children}
      </div>
    </div>
  );
}
