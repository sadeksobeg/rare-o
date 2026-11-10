"use client";

import { useRef, type ReactNode, type PointerEvent } from "react";
import { cn } from "@/lib/utils";
import { useMotion } from "./context";
import { RIPPLE_MS } from "./resolve-tier";

export function spawnPressRipple(
  host: HTMLElement,
  clientX: number,
  clientY: number
) {
  if (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  ) {
    return;
  }
  const rect = host.getBoundingClientRect();
  const ring = document.createElement("span");
  ring.className = "ro-press-ripple-ring";
  ring.style.left = `${clientX - rect.left}px`;
  ring.style.top = `${clientY - rect.top}px`;
  host.appendChild(ring);
  window.setTimeout(() => ring.remove(), RIPPLE_MS + 50);
}

export function PressRipple({
  children,
  className,
  disabled,
}: {
  children: ReactNode;
  className?: string;
  disabled?: boolean;
}) {
  const host = useRef<HTMLDivElement>(null);
  const { lite } = useMotion();

  function onPointerDown(e: PointerEvent<HTMLDivElement>) {
    if (disabled || lite) return;
    const node = host.current;
    if (!node) return;
    spawnPressRipple(node, e.clientX, e.clientY);
  }

  return (
    <div
      ref={host}
      className={cn("ro-press-ripple", className)}
      onPointerDown={onPointerDown}
    >
      {children}
    </div>
  );
}
