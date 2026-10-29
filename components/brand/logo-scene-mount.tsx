"use client";

/**
 * Stable login brand mark — no Three.js.
 * Dynamic R3F was crashing after hydration and flashing the old login shell.
 */
export function LogoSceneMount({ className }: { className?: string }) {
  return (
    <div
      className={className}
      aria-hidden
      style={{
        display: "grid",
        placeItems: "center",
      }}
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
