"use client";

import { Rings } from "@/components/brand";
import { useAmbientMotion } from "@/components/motion/use-ambient";

/** Full rings on admin/trader home only — live for 5s then still. */
export function HomeAmbient() {
  const { active } = useAmbientMotion();
  return (
    <div
      className="ro-home-ambient pointer-events-none absolute -end-10 -top-20 z-0 size-[min(70vw,22rem)] opacity-[0.12]"
      data-ambient={active ? "on" : "off"}
      aria-hidden
    >
      <Rings className="h-full w-full text-[var(--ro-plum-800)]" />
    </div>
  );
}
