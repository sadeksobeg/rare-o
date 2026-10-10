import { cn } from "@/lib/utils";

export type NeutralTone = "dark" | "cream" | "purple";

/**
 * Media / visual container.
 * - Real photography via `src` when available
 * - Missing photography → restrained neutral tonal plane (NOT brand SVGs)
 */
export function MaterialField({
  src,
  alt = "",
  className,
  tone = "dark",
  children,
}: {
  src?: string | null;
  alt?: string;
  className?: string;
  tone?: NeutralTone;
  children?: React.ReactNode;
}) {
  const toneClass =
    tone === "cream"
      ? "bg-ro-surface"
      : tone === "purple"
        ? "bg-ro-purple"
        : "bg-ro-surface-dark";

  return (
    <div className={cn("relative overflow-hidden", toneClass, className)}>
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={alt}
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-[1.1s] ease-out will-change-transform group-hover:scale-[1.035]"
        />
      ) : (
        <div
          className={cn(
            "absolute inset-0",
            tone === "cream" && "ro-material-plane opacity-20",
            tone === "purple" && "opacity-100",
            tone === "dark" && "ro-material-plane"
          )}
          aria-hidden
        />
      )}
      {children}
    </div>
  );
}

export type BrandGraphicVariant = "wood" | "resin" | "shadow";

const brandGraphicSrc: Record<BrandGraphicVariant, string> = {
  wood: "/brand/atmosphere-wood.svg",
  resin: "/brand/atmosphere-resin.svg",
  shadow: "/brand/atmosphere-shadow.svg",
};

/**
 * Selective RARE OUD identity graphic overlay — not product photography.
 */
export function BrandGraphicOverlay({
  variant = "wood",
  className,
  opacity = 0.22,
}: {
  variant?: BrandGraphicVariant;
  className?: string;
  opacity?: number;
}) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={brandGraphicSrc[variant]}
      alt=""
      aria-hidden
      className={cn("pointer-events-none absolute object-cover select-none", className)}
      style={{ opacity }}
    />
  );
}
