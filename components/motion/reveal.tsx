"use client";

import {
  Children,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { cn } from "@/lib/utils";
import { useMotion } from "./context";
import { STAGGER_MS } from "./resolve-tier";

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
  children: ReactNode;
  variant?: RevealVariant;
  delayMs?: number;
  className?: string;
  once?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const { lite } = useMotion();
  const [visible, setVisible] = useState(false);

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

export function Stagger({
  children,
  className,
  stepMs = STAGGER_MS,
}: {
  children: ReactNode;
  className?: string;
  stepMs?: number;
}) {
  const { lite } = useMotion();
  const items = Children.toArray(children);
  return (
    <div className={className}>
      {items.map((child, i) => (
        <Reveal key={i} delayMs={lite ? 0 : i * stepMs}>
          {child}
        </Reveal>
      ))}
    </div>
  );
}
