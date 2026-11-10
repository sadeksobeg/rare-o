"use client";

import { useRef, type ReactNode, type PointerEvent } from "react";
import { cn } from "@/lib/utils";
import { useMotion } from "./context";

const MAX_DEG = 4;

function finePointer(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(hover: hover)").matches &&
    window.matchMedia("(pointer: fine)").matches
  );
}

export function TiltSurface({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const { lite, tier } = useMotion();
  const enabled = !lite && tier === "A";

  function reset() {
    const node = ref.current;
    if (!node) return;
    node.style.transform = "perspective(800px) rotateX(0deg) rotateY(0deg)";
    node.style.willChange = "auto";
  }

  function onMove(e: PointerEvent<HTMLDivElement>) {
    if (!enabled || !finePointer()) return;
    const node = ref.current;
    if (!node) return;
    const r = node.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    node.style.willChange = "transform";
    node.style.transform = `perspective(800px) rotateX(${(-py * MAX_DEG).toFixed(2)}deg) rotateY(${(px * MAX_DEG).toFixed(2)}deg)`;
  }

  return (
    <div
      ref={ref}
      className={cn("ro-tilt-surface", className)}
      onPointerMove={onMove}
      onPointerLeave={reset}
    >
      {children}
    </div>
  );
}
