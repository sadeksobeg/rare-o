import { cn } from "@/lib/utils";

export type BrandWallpaperTone = "cream" | "ink";

/**
 * Cream-surface identity wallpaper (storefront + admin/trader portal shells).
 * Real brand mark stamps + filled notes/plectrum — never on hero/inverse.
 */
export function BrandWallpaper({
  tone = "cream",
  className,
  patternId = "ro-brand-wallpaper",
}: {
  tone?: BrandWallpaperTone;
  className?: string;
  patternId?: string;
}) {
  /** Ink/hero surfaces stay clean — wallpaper is cream-only by product decision. */
  if (tone === "ink") return null;

  const fill = "var(--ro-plum-900)";
  const amber = "var(--ro-amber-500)";

  return (
    <div
      className={cn(
        "pointer-events-none absolute inset-0 overflow-hidden",
        className
      )}
      aria-hidden
    >
      <svg
        className="absolute inset-0 h-full w-full"
        focusable="false"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          <symbol id={`${patternId}-note`} viewBox="0 0 32 48">
            <ellipse
              cx="10"
              cy="38"
              rx="9.5"
              ry="7"
              transform="rotate(-25 10 38)"
            />
            <rect x="17.5" y="6" width="3.8" height="33" rx="1.2" />
            <path d="M21.3 6c6.2 2.2 10.7 6.8 10.7 12.4 0 2.6-1.4 4.8-3.8 5.8 0-3.6-2.2-6.6-5.4-8.4-1.2-.7-1.5-1.1-1.5-1.8V6z" />
          </symbol>

          <symbol id={`${patternId}-beam`} viewBox="0 0 52 44">
            <ellipse
              cx="10"
              cy="34"
              rx="8.5"
              ry="6.2"
              transform="rotate(-22 10 34)"
            />
            <ellipse
              cx="36"
              cy="36"
              rx="8.5"
              ry="6.2"
              transform="rotate(-22 36 36)"
            />
            <rect x="16.2" y="4" width="3.4" height="30" rx="1" />
            <rect x="42.2" y="6" width="3.4" height="30" rx="1" />
            <path d="M16.2 4h29.4v5.2H16.2z" />
          </symbol>

          <symbol id={`${patternId}-plectrum`} viewBox="0 0 28 34">
            <path d="M14 1.8C7.6 9 3.2 15.8 3.2 22.2c0 6.2 4.8 10.8 10.8 10.8s10.8-4.6 10.8-10.8C24.8 15.8 20.4 9 14 1.8z" />
          </symbol>

          <pattern
            id={patternId}
            width="360"
            height="400"
            patternUnits="userSpaceOnUse"
          >
            <image
              href="/brand/mark-small.png"
              x="28"
              y="36"
              width="56"
              height="56"
              opacity="0.14"
              preserveAspectRatio="xMidYMid meet"
            />
            <g transform="rotate(18 254 204)">
              <image
                href="/brand/mark-small.png"
                x="230"
                y="180"
                width="48"
                height="48"
                opacity="0.1"
                preserveAspectRatio="xMidYMid meet"
              />
            </g>
            <g transform="rotate(-14 270 48)">
              <image
                href="/brand/mark-small.png"
                x="250"
                y="28"
                width="40"
                height="40"
                opacity="0.09"
                preserveAspectRatio="xMidYMid meet"
              />
            </g>
            <g transform="rotate(-8 82 302)">
              <image
                href="/brand/mark-small.png"
                x="60"
                y="280"
                width="44"
                height="44"
                opacity="0.11"
                preserveAspectRatio="xMidYMid meet"
              />
            </g>

            <g fill={fill}>
              <use
                href={`#${patternId}-note`}
                x="160"
                y="50"
                width="28"
                height="42"
                opacity="0.16"
              />
              <g transform="rotate(-16 312 268)">
                <use
                  href={`#${patternId}-note`}
                  x="300"
                  y="250"
                  width="24"
                  height="36"
                  opacity="0.12"
                />
              </g>
              <use
                href={`#${patternId}-beam`}
                x="120"
                y="300"
                width="50"
                height="42"
                opacity="0.13"
              />
              <g transform="rotate(12 51 167)">
                <use
                  href={`#${patternId}-note`}
                  x="40"
                  y="150"
                  width="22"
                  height="34"
                  opacity="0.11"
                />
              </g>
              <g transform="rotate(28 213 156)">
                <use
                  href={`#${patternId}-plectrum`}
                  x="200"
                  y="140"
                  width="26"
                  height="32"
                  opacity="0.12"
                />
              </g>
              <g transform="rotate(-36 291 334)">
                <use
                  href={`#${patternId}-plectrum`}
                  x="280"
                  y="320"
                  width="22"
                  height="28"
                  opacity="0.1"
                />
              </g>
            </g>

            <circle cx="190" cy="230" r="3" fill={amber} opacity="0.28" />
            <circle cx="320" cy="120" r="2.6" fill={amber} opacity="0.22" />
            <circle cx="100" cy="220" r="2.4" fill={amber} opacity="0.2" />
          </pattern>

          <radialGradient
            id={`${patternId}-wash`}
            cx="50%"
            cy="30%"
            r="70%"
          >
            <stop offset="0%" stopColor="rgba(251,246,238,0.55)" />
            <stop offset="60%" stopColor="rgba(244,231,216,0)" />
            <stop offset="100%" stopColor="rgba(233,221,243,0.16)" />
          </radialGradient>
        </defs>
        <rect width="100%" height="100%" fill={`url(#${patternId})`} />
        <rect width="100%" height="100%" fill={`url(#${patternId}-wash)`} />
      </svg>
    </div>
  );
}

/** @deprecated Prefer BrandWallpaper — kept for existing imports. */
export function CanvasMotif({
  className,
  patternId = "ro-canvas-motif",
}: {
  className?: string;
  patternId?: string;
}) {
  return (
    <BrandWallpaper
      tone="cream"
      className={className}
      patternId={patternId}
    />
  );
}
