import { MaterialField, type NeutralTone } from "@/components/storefront/material-field";
import { cn } from "@/lib/utils";

/**
 * Editorial media surface. Real image when available;
 * otherwise a restrained neutral plane (brand graphics are overlays elsewhere).
 */
export function MediaPlane({
  src,
  alt = "",
  className,
  aspect = "portrait",
  tone = "dark",
  // retained for call-site compatibility; brand graphics are overlays elsewhere
  showMark: _showMark,
}: {
  src?: string | null;
  alt?: string;
  className?: string;
  priority?: boolean;
  aspect?: "portrait" | "landscape" | "square" | "hero" | "wide" | "cinema";
  tone?: NeutralTone | "default" | "alt" | "purple";
  showMark?: boolean;
}) {
  void _showMark;
  const aspectClass =
    aspect === "hero"
      ? "aspect-[4/5] md:aspect-[5/6] lg:aspect-[4/5]"
      : aspect === "landscape"
        ? "aspect-[16/10]"
        : aspect === "wide"
          ? "aspect-[5/3]"
          : aspect === "cinema"
            ? "aspect-[21/9] md:aspect-[2.4/1]"
            : aspect === "square"
              ? "aspect-square"
              : "aspect-[4/5]";

  const resolvedTone: NeutralTone =
    tone === "alt" || tone === "cream"
      ? "cream"
      : tone === "purple"
        ? "purple"
        : "dark";

  return (
    <MaterialField
      src={src}
      alt={alt}
      tone={resolvedTone}
      className={cn(aspectClass, className)}
    />
  );
}
