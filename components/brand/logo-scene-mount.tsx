"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { LogoSceneErrorBoundary } from "@/components/brand/logo-scene-boundary";

const LogoScene = dynamic(
  () => import("@/components/brand/logo-scene").then((m) => m.LogoScene),
  { ssr: false, loading: () => null }
);

function StaticLogoMark() {
  return (
    <div
      aria-hidden
      className="h-full w-full"
      style={{ display: "grid", placeItems: "center" }}
    >
      <div className="relative grid size-full max-h-[min(52vh,26rem)] max-w-[min(70vw,26rem)] place-items-center">
        <span
          className="ro-login-orbit absolute inset-[8%] rounded-full border border-[color-mix(in_srgb,var(--ro-sand-100)_22%,transparent)]"
          style={{ animationDelay: "0ms" }}
        />
        <span
          className="ro-login-orbit absolute inset-[18%] rounded-full border border-[color-mix(in_srgb,var(--ro-plum-300)_35%,transparent)]"
          style={{ animationDelay: "400ms" }}
        />
        <span
          className="ro-login-orbit absolute inset-[28%] rounded-full border border-[color-mix(in_srgb,var(--ro-sand-100)_14%,transparent)]"
          style={{ animationDelay: "800ms" }}
        />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/brand/logo-mark.svg"
          alt=""
          className="relative z-10 h-[42%] w-auto opacity-90"
          style={{ filter: "invert(1)" }}
        />
      </div>
    </div>
  );
}

type NetworkInformationLike = { saveData?: boolean };

/**
 * Login brand mark. The real 3D scene (components/brand/logo-scene.tsx,
 * ported from design-lab) is loaded client-only via next/dynamic — it must
 * never be imported directly into a server-rendered tree: WebGL/R3F has no
 * server runtime, and rendering the Canvas during SSR is what was crashing
 * the login shell after hydration before this fix. On top of that:
 * - an error boundary falls back to the static mark on any runtime crash
 * - Save-Data / prefers-reduced-motion users get the static mark directly
 *   (prefers-reduced-motion is also handled inside LogoScene itself, this
 *   is the outer gate that skips loading the Three.js bundle at all)
 * - the scene only mounts once the mark scrolls into view, and unmounts
 *   (pausing its render loop) once it scrolls back out
 */
export function LogoSceneMount({ className }: { className?: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  // Optimistic default: assume in view so the scene isn't held hostage by an
  // observer callback that's slow (or, in some embedded/automated browser
  // contexts, never fires on first paint) — only pause once the observer
  // actively reports the element has scrolled out of view.
  const [inView, setInView] = useState(true);
  const [skip3d, setSkip3d] = useState(true);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const nav = navigator as Navigator & {
      connection?: NetworkInformationLike;
    };
    const saveData = nav.connection?.saveData === true;
    setSkip3d(mq.matches || saveData);
    const onChange = () => setSkip3d(mq.matches || saveData);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || typeof IntersectionObserver === "undefined") {
      setInView(true);
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => setInView(entry?.isIntersecting ?? true),
      { threshold: 0.1 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={containerRef} className={className}>
      {skip3d || !inView ? (
        <StaticLogoMark />
      ) : (
        <LogoSceneErrorBoundary fallback={<StaticLogoMark />}>
          <LogoScene className="h-full w-full" />
        </LogoSceneErrorBoundary>
      )}
    </div>
  );
}
