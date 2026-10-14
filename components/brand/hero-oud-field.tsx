"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * Single hero oud — atelier-f (warm gold-rim cutout).
 * Mouse parallax + idle breathe.
 */
const SRC = "/brand/hero-oud-atelier-f.png?v=14";
/* Slight plum rim to sit in brand light — keep wood natural */
const FILTER =
  "brightness(1.1) contrast(1.06) saturate(1.05) drop-shadow(0 0 28px rgba(82,39,124,0.35))";

export function HeroOudField({
  className,
  trackTarget = "self",
}: {
  className?: string;
  /** "section" tracks [data-hero] so parallax works under pointer-events-none wrappers */
  trackTarget?: "self" | "section";
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const target = useRef({ x: 0, y: 0 });
  const current = useRef({ x: 0, y: 0 });
  const raf = useRef(0);
  const [pose, setPose] = useState({ x: 0, y: 0 });
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduced(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    if (reduced) return;
    const root = rootRef.current;
    if (!root) return;
    const el =
      trackTarget === "section"
        ? (root.closest("[data-hero]") as HTMLElement | null) ?? root
        : root;

    const onMove = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      target.current = {
        x: Math.max(-1, Math.min(1, ((e.clientX - r.left) / r.width) * 2 - 1)),
        y: Math.max(-1, Math.min(1, ((e.clientY - r.top) / r.height) * 2 - 1)),
      };
    };
    const onLeave = () => {
      target.current = { x: 0, y: 0 };
    };

    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerleave", onLeave);

    const tick = () => {
      current.current.x += (target.current.x - current.current.x) * 0.08;
      current.current.y += (target.current.y - current.current.y) * 0.08;
      setPose({ x: current.current.x, y: current.current.y });
      raf.current = window.requestAnimationFrame(tick);
    };
    raf.current = window.requestAnimationFrame(tick);

    return () => {
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerleave", onLeave);
      window.cancelAnimationFrame(raf.current);
    };
  }, [reduced, trackTarget]);

  const maxShift = 18;
  const tx = reduced ? 0 : pose.x * maxShift;
  const ty = reduced ? 0 : pose.y * (maxShift * 0.4);
  const tilt = reduced ? 0 : pose.x * 4;

  return (
    <div
      ref={rootRef}
      className={cn(
        "relative flex h-full min-h-[22rem] w-full touch-none items-end justify-center overflow-visible",
        className
      )}
      aria-hidden
    >
      <div
        className="absolute bottom-[4%] left-1/2 h-[88%] w-auto overflow-visible will-change-transform"
        style={{
          transform: `translate3d(calc(-50% + ${tx}px), ${ty}px, 0)`,
        }}
      >
        <div
          className={cn(
            "relative h-full overflow-visible",
            !reduced && "ro-oud-enter"
          )}
        >
          <div
            className={cn(
              "relative flex h-full items-end justify-center overflow-visible",
              !reduced && "ro-oud-idle-lead"
            )}
            style={{ transform: `rotate(${2 + tilt}deg)` }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={SRC}
              alt=""
              width={480}
              height={1020}
              decoding="async"
              fetchPriority="high"
              draggable={false}
              className="pointer-events-none h-full w-auto max-w-none select-none"
              style={{ filter: FILTER }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
