"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { useReducedMotion } from "./use-reduced-motion";

type RevealVariant = "up" | "mask" | "scale";

const variantClass: Record<RevealVariant, string> = {
  up: "ro-anim-reveal-up",
  mask: "ro-anim-reveal-mask",
  scale: "ro-anim-scale-reveal",
};

export function Reveal({
  children,
  variant = "up",
  delayMs = 0,
  className,
  once = true,
}: {
  children: React.ReactNode;
  variant?: RevealVariant;
  delayMs?: number;
  className?: string;
  once?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (reduced) {
      setVisible(true);
      return;
    }
    const node = ref.current;
    if (!node) return;

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setVisible(true);
          if (once) io.disconnect();
        } else if (!once) {
          setVisible(false);
        }
      },
      { threshold: 0.18, rootMargin: "0px 0px -8% 0px" }
    );

    io.observe(node);
    return () => io.disconnect();
  }, [once, reduced]);

  return (
    <div
      ref={ref}
      className={cn(
        "ro-reveal-base",
        variantClass[variant],
        visible && "is-visible",
        reduced && "is-reduced",
        className
      )}
      style={{ transitionDelay: reduced ? "0ms" : `${delayMs}ms` }}
    >
      {children}
    </div>
  );
}

export function MaskReveal({
  children,
  delayMs = 0,
  className,
}: {
  children: React.ReactNode;
  delayMs?: number;
  className?: string;
}) {
  return (
    <Reveal variant="mask" delayMs={delayMs} className={className}>
      {children}
    </Reveal>
  );
}
