"use client";

import {
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { cn } from "@/lib/utils";

type RevealVariant = "up" | "mask" | "scale";

const variantClass: Record<RevealVariant, string> = {
  up: "ro-anim-reveal-up",
  mask: "ro-anim-reveal-mask",
  scale: "ro-anim-scale-reveal",
};

/**
 * Storefront-local Reveal — does not import the shared motion barrel,
 * so a poisoned webpack chunk there cannot take down the homepage.
 */
export function Reveal({
  children,
  variant = "up",
  delayMs = 0,
  className,
  once = true,
}: {
  children: ReactNode;
  variant?: RevealVariant;
  delayMs?: number;
  className?: string;
  once?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [lite, setLite] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => {
      const next = mq.matches;
      setLite(next);
      if (next) setVisible(true);
    };
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    if (lite) {
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
  }, [once, lite]);

  return (
    <div
      ref={ref}
      className={cn(
        "ro-reveal-base",
        variantClass[variant],
        visible && "is-visible",
        lite && "is-reduced",
        className
      )}
      style={{ transitionDelay: lite ? "0ms" : `${delayMs}ms` }}
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
  children: ReactNode;
  delayMs?: number;
  className?: string;
}) {
  return (
    <Reveal variant="mask" delayMs={delayMs} className={className}>
      {children}
    </Reveal>
  );
}
