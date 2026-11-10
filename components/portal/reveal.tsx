"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

function isInView(el: HTMLElement) {
  const rect = el.getBoundingClientRect();
  const vh = window.innerHeight || document.documentElement.clientHeight;
  // Match the IO rootMargin bottom shrink (~8%) used below.
  return rect.top < vh * 0.92 && rect.bottom > 0;
}

/** Scroll/mount reveal for portal sections — staggered children via CSS. */
export function PortalReveal({
  children,
  className,
  stagger = false,
  /** Show immediately (above-the-fold / critical). Skips opacity:0 gate. */
  eager = false,
}: {
  children: ReactNode;
  className?: string;
  stagger?: boolean;
  eager?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(eager);

  useEffect(() => {
    if (eager) {
      setVisible(true);
      return;
    }
    const el = ref.current;
    if (!el) return;
    if (
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      setVisible(true);
      return;
    }
    // Sync check — IO alone can miss SSR→hydrate / tall first sections,
    // leaving opacity:0 content (trader home at 1440).
    if (isInView(el)) {
      setVisible(true);
      return;
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setVisible(true);
          io.disconnect();
        }
      },
      { threshold: 0.01, rootMargin: "0px 0px -4% 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [eager]);

  return (
    <div
      ref={ref}
      data-visible={visible ? "true" : "false"}
      className={cn(
        "ro-portal-reveal",
        stagger && "ro-portal-stagger",
        className
      )}
    >
      {children}
    </div>
  );
}
