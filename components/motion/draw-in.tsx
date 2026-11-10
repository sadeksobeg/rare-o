"use client";

import { useEffect, useRef, type ReactNode, type SVGProps } from "react";
import { cn } from "@/lib/utils";
import { useAmbientMotion } from "./use-ambient";
import { useMotion } from "./context";

/** Draws SVG path stroke on enter (S3/S4). Lite shows the path complete. */
export function DrawIn({
  children,
  className,
  durationMs = 1100,
}: {
  children: ReactNode;
  className?: string;
  durationMs?: number;
}) {
  const host = useRef<HTMLDivElement>(null);
  const { lite } = useMotion();
  const { active } = useAmbientMotion();

  useEffect(() => {
    const root = host.current;
    if (!root) return;
    const paths = root.querySelectorAll("path, circle, ellipse, line, polyline");
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

  return (
    <div
      ref={host}
      className={cn("ro-draw-in", !active && "ro-draw-in-paused", className)}
      data-ro-ambient={active ? "on" : "off"}
    >
      {children}
    </div>
  );
}

export function RosetteMark(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 400 400"
      width={160}
      height={160}
      aria-hidden
      {...props}
    >
      <circle cx="200" cy="200" r="190" fill="var(--ro-plum-900)" />
      <g fill="none" stroke="var(--ro-sand-100)" strokeWidth="2">
        <circle cx="200" cy="200" r="150" opacity="0.7" />
        <circle cx="200" cy="200" r="112" opacity="0.55" />
        <circle cx="200" cy="200" r="78" opacity="0.42" />
        <circle cx="200" cy="200" r="48" opacity="0.32" />
      </g>
      <circle cx="200" cy="200" r="22" fill="var(--ro-ink-950)" />
    </svg>
  );
}
