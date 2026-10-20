"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * Single hero oud — atelier-f (warm gold-rim cutout).
 * Mouse parallax + idle breathe.
 */
export const HERO_OUD_LCP_SRC = "/brand/hero-oud-atelier-f-e1.webp";
const SRC = HERO_OUD_LCP_SRC;
/* Slight plum rim to sit in brand light — keep wood natural */
/* Soft rim without drop-shadow (drop-shadow tanks Lighthouse paint). */

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

    let running = false;
    const tick = () => {
      current.current.x += (target.current.x - current.current.x) * 0.08;
      current.current.y += (target.current.y - current.current.y) * 0.08;
      setPose({ x: current.current.x, y: current.current.y });
      const idle =
        Math.abs(target.current.x - current.current.x) < 0.001 &&
        Math.abs(target.current.y - current.current.y) < 0.001;
      if (idle) {
        running = false;
        return;
      }
      raf.current = window.requestAnimationFrame(tick);
    };
    const ensureTick = () => {
      if (running) return;
      running = true;
      raf.current = window.requestAnimationFrame(tick);
    };

    const onMove = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      target.current = {
        x: Math.max(-1, Math.min(1, ((e.clientX - r.left) / r.width) * 2 - 1)),
        y: Math.max(-1, Math.min(1, ((e.clientY - r.top) / r.height) * 2 - 1)),
      };
      ensureTick();
    };
    const onLeave = () => {
      target.current = { x: 0, y: 0 };
      ensureTick();
    };

    el.addEventListener("pointermove", onMove, { passive: true });
    el.addEventListener("pointerleave", onLeave);

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
            <Image
              src={SRC}
              alt=""
              width={360}
              height={765}
              priority
              fetchPriority="high"
              sizes="(max-width: 390px) 55vw, (max-width: 768px) 45vw, 360px"
              quality={70}
              draggable={false}
              className="pointer-events-none h-full w-auto max-w-none select-none"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
