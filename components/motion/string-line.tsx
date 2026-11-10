"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { useMotion } from "./context";

export function StringLine({
  className,
  label,
}: {
  className?: string;
  label: string;
}) {
  const pathRef = useRef<SVGPathElement>(null);
  const amp = useRef(0);
  const raf = useRef(0);
  const { lite } = useMotion();
  const y = 12;

  function straight() {
    return `M8 ${y} L292 ${y}`;
  }

  function bent(t: number, a: number) {
    return `M8 ${y} Q150 ${y + a * Math.sin(t)} 292 ${y}`;
  }

  function pluck() {
    const path = pathRef.current;
    if (!path) return;
    if (lite) {
      path.setAttribute("stroke", "var(--ro-amber-500, #B8863F)");
      window.setTimeout(() => {
        path.setAttribute("stroke", "currentColor");
      }, 280);
      return;
    }
    amp.current = 14;
    let t = 0;
    cancelAnimationFrame(raf.current);
    const tick = () => {
      t += 0.9;
      amp.current *= 0.95;
      path.setAttribute("d", bent(t, amp.current));
      if (amp.current > 0.25) {
        raf.current = requestAnimationFrame(tick);
      } else {
        amp.current = 0;
        path.setAttribute("d", straight());
      }
    };
    raf.current = requestAnimationFrame(tick);
  }

  useEffect(() => () => cancelAnimationFrame(raf.current), []);

  return (
    <svg
      className={cn("ro-string-line h-6 w-full text-ro-ink", className)}
      viewBox="0 0 300 24"
      role="img"
      aria-label={label}
      onPointerEnter={pluck}
    >
      <path
        ref={pathRef}
        d={straight()}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        opacity="0.75"
      />
      <rect x="0" y="0" width="300" height="24" fill="transparent" />
    </svg>
  );
}
