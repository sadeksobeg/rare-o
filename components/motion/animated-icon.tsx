"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { useMotion } from "./context";

/**
 * Draw-in on enter, pulse on `pulseKey` change. Lite shows the glyph complete.
 */
export function AnimatedIcon({
  children,
  pulseKey,
  className,
  durationMs = 700,
}: {
  children: ReactNode;
  pulseKey?: string | number;
  className?: string;
  durationMs?: number;
}) {
  const host = useRef<HTMLSpanElement>(null);
  const { lite } = useMotion();
  const firstPulse = useRef(true);

  useEffect(() => {
    const root = host.current;
    if (!root) return;
    const paths = root.querySelectorAll(
      "path, circle, ellipse, line, polyline, rect"
    );
    paths.forEach((node) => {
      const el = node as SVGGeometryElement & { getTotalLength?: () => number };
      if (typeof el.getTotalLength !== "function") return;
      const len = el.getTotalLength();
      el.style.strokeDasharray = `${len}`;
      if (lite) {
        el.style.strokeDashoffset = "0";
        el.style.transition = "none";
        return;
      }
      el.style.strokeDashoffset = `${len}`;
      el.style.transition = `stroke-dashoffset ${durationMs}ms var(--ro-ease-out-expo, var(--ro-ease-enter))`;
      requestAnimationFrame(() => {
        el.style.strokeDashoffset = "0";
      });
    });
  }, [lite, durationMs, children]);

  useEffect(() => {
    if (pulseKey == null) return;
    if (firstPulse.current) {
      firstPulse.current = false;
      return;
    }
    const root = host.current;
    if (!root || lite) return;
    const anim = root.animate(
      [
        { transform: "scale(1)" },
        { transform: "scale(1.08)" },
        { transform: "scale(1)" },
      ],
      { duration: 160, easing: "ease-out" }
    );
    return () => anim.cancel();
  }, [pulseKey, lite]);

  return (
    <span
      ref={host}
      className={cn("inline-flex items-center justify-center", className)}
      data-ro-animated-icon={lite ? "lite" : "on"}
    >
      {children}
    </span>
  );
}
