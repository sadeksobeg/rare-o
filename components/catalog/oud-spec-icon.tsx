"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ComponentType,
  type SVGProps,
} from "react";
import { GrainIcon } from "@/components/brand/icons/grain";
import { HandcraftedIcon } from "@/components/brand/icons/handcrafted";
import { OudBridgeIcon } from "@/components/brand/icons/oud-bridge";
import { OudFaceIcon } from "@/components/brand/icons/oud-face";
import { OudFingerboardIcon } from "@/components/brand/icons/oud-fingerboard";
import {
  OudDepthIcon,
  OudNeckIcon,
  OudSpanLengthIcon,
  OudSpanWidthIcon,
} from "@/components/brand/icons/oud-span";
import { PegIcon } from "@/components/brand/icons/peg";
import { StringIcon } from "@/components/brand/icons/string";
import { WoodIcon } from "@/components/brand/icons/wood";
import type { OudSpecIconKey } from "@/lib/catalog/oud-specs";
import { cn } from "@/lib/utils";

const ICONS: Record<
  OudSpecIconKey,
  ComponentType<SVGProps<SVGSVGElement>>
> = {
  back: WoodIcon,
  face: OudFaceIcon,
  pegs: PegIcon,
  fingerboard: OudFingerboardIcon,
  bridge: OudBridgeIcon,
  faceWidth: OudSpanWidthIcon,
  faceDepth: OudDepthIcon,
  faceLength: OudSpanLengthIcon,
  neckLength: OudNeckIcon,
  stringLength: StringIcon,
  standardNeck: HandcraftedIcon,
  finish: GrainIcon,
};

export function oudSpecIcon(key: OudSpecIconKey) {
  return ICONS[key];
}

/**
 * Self-contained interactive brand glyph for oud specs.
 * Draw-in + hover pulse live here — does not import motion/provider,
 * so admin product forms stay off that webpack graph.
 */
export function OudSpecIconMark({
  iconKey,
  size = "md",
  className,
  tone = "plum",
}: {
  iconKey: OudSpecIconKey;
  size?: "sm" | "md" | "lg";
  className?: string;
  tone?: "plum" | "ink" | "on-dark";
}) {
  const host = useRef<HTMLSpanElement>(null);
  const cool = useRef(0);
  const [drawKey, setDrawKey] = useState(0);
  const Icon = ICONS[iconKey];
  const glyph =
    size === "lg" ? "size-7" : size === "sm" ? "size-[1.05rem]" : "size-[1.35rem]";

  const playDraw = useCallback(() => {
    const root = host.current;
    if (!root) return;
    const reduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const paths = root.querySelectorAll(
      "path, circle, ellipse, line, polyline, rect"
    );
    paths.forEach((node) => {
      const el = node as SVGGeometryElement & { getTotalLength?: () => number };
      if (typeof el.getTotalLength !== "function") return;
      const len = el.getTotalLength();
      el.style.strokeDasharray = `${len}`;
      if (reduced) {
        el.style.strokeDashoffset = "0";
        el.style.transition = "none";
        return;
      }
      el.style.strokeDashoffset = `${len}`;
      el.style.transition =
        "stroke-dashoffset 900ms var(--ro-ease-out-expo, var(--ro-ease-enter))";
      requestAnimationFrame(() => {
        el.style.strokeDashoffset = "0";
      });
    });
  }, []);

  useEffect(() => {
    playDraw();
  }, [playDraw, drawKey, iconKey]);

  const spark = () => {
    const now = Date.now();
    if (now - cool.current < 420) return;
    cool.current = now;
    setDrawKey((n) => n + 1);
    const root = host.current;
    if (!root) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    root.animate(
      [
        { transform: "scale(1)" },
        { transform: "scale(1.1)" },
        { transform: "scale(1)" },
      ],
      { duration: 220, easing: "ease-out" }
    );
  };

  return (
    <button
      type="button"
      tabIndex={-1}
      aria-hidden
      className={cn(
        "ro-oud-spec-icon group/icon",
        size === "lg" && "ro-oud-spec-icon--lg",
        size === "sm" && "ro-oud-spec-icon--sm",
        tone === "ink" && "ro-oud-spec-icon--ink",
        tone === "on-dark" && "ro-oud-spec-icon--on-dark",
        className
      )}
      onPointerEnter={spark}
      onFocus={spark}
    >
      <span className="ro-oud-spec-icon__ring" aria-hidden />
      <span
        ref={host}
        className="relative z-[1] inline-flex size-full items-center justify-center"
        data-ro-oud-spec-draw={drawKey}
      >
        <Icon
          className={cn(
            glyph,
            "transition-transform duration-500 ease-[var(--ro-ease-enter)] group-hover/icon:-rotate-6 group-hover/icon:scale-110"
          )}
        />
      </span>
    </button>
  );
}
