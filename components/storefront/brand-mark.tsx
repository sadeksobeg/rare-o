import { cn } from "@/lib/utils";

type MarkVariant = "small" | "master";
type MarkTone = "on-light" | "on-dark";
type MarkSize = "xs" | "sm" | "md" | "lg" | "xl" | "hero";

const sizeMap: Record<MarkSize, string> = {
  xs: "h-7 w-7",
  sm: "h-9 w-9",
  md: "h-12 w-12",
  lg: "h-20 w-20 md:h-24 md:w-24",
  xl: "h-32 w-32 md:h-40 md:w-40",
  hero: "h-48 w-48 md:h-64 md:w-64 lg:h-80 lg:w-80",
};

const srcMap: Record<MarkVariant, string> = {
  small: "/brand/mark-small.png",
  master: "/brand/mark-master.png",
};

export function BrandMark({
  variant = "small",
  tone = "on-light",
  size = "sm",
  className,
  priority = false,
}: {
  variant?: MarkVariant;
  tone?: MarkTone;
  size?: MarkSize;
  className?: string;
  priority?: boolean;
}) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- brand marks need CSS tone filters
    <img
      src={srcMap[variant]}
      alt="RARE OUD"
      decoding={priority ? "sync" : "async"}
      fetchPriority={priority ? "high" : "auto"}
      width={variant === "master" ? 72 : 36}
      height={variant === "master" ? 72 : 36}
      className={cn(
        "object-contain object-center select-none",
        sizeMap[size],
        tone === "on-dark" && "ro-mark-on-dark",
        className
      )}
    />
  );
}
