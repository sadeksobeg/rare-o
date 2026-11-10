"use client";

import { RIPPLE_MS } from "./resolve-tier";

const EASE = "cubic-bezier(0.16, 1, 0.3, 1)";

export type FlyToTargetOptions = {
  lite?: boolean;
  durationMs?: number;
  color?: string;
  onArrive?: () => void;
};

/** S6 — clone a 18px amber disc and animate it to a target with WAAPI. */
export function flyToTarget(
  source: Element,
  target: Element,
  options: FlyToTargetOptions = {}
): Promise<void> {
  const { lite = false, durationMs = 650, color = "#B8863F", onArrive } =
    options;

  return new Promise((resolve) => {
    const finish = () => {
      onArrive?.();
      resolve();
    };
    if (lite || typeof document === "undefined") {
      finish();
      return;
    }

    const s = source.getBoundingClientRect();
    const t = target.getBoundingClientRect();
    const disc = document.createElement("div");
    disc.setAttribute("aria-hidden", "true");
    disc.className = "ro-fly-disc";
    disc.style.background = color;
    disc.style.left = `${s.left + s.width / 2 - 9}px`;
    disc.style.top = `${s.top + s.height / 2 - 9}px`;
    document.body.appendChild(disc);

    const dx = t.left + t.width / 2 - (s.left + s.width / 2);
    const dy = t.top + t.height / 2 - (s.top + s.height / 2);
    const anim = disc.animate(
      [
        { transform: "translate(0,0) scale(1)", opacity: 1 },
        { transform: `translate(${dx}px, ${dy}px) scale(0.3)`, opacity: 0.3 },
      ],
      { duration: durationMs, easing: EASE, fill: "forwards" }
    );
    anim.onfinish = () => {
      disc.remove();
      const bump = target.animate(
        [
          { transform: "scale(1)" },
          { transform: "scale(1.12)" },
          { transform: "scale(1)" },
        ],
        { duration: Math.min(260, RIPPLE_MS), easing: "ease-out" }
      );
      bump.onfinish = finish;
    };
  });
}
