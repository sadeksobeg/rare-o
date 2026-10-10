import { Rings } from "@/components/brand";
import { cn } from "@/lib/utils";

export function MaterialPlate({
  caption,
  compact = false,
  className,
}: {
  caption?: string;
  compact?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "relative flex aspect-[4/5] flex-col items-center justify-center overflow-hidden rounded-[var(--ro-r-xs)] bg-[var(--ro-ink-800)] text-ro-canvas",
        compact && "aspect-square",
        className
      )}
      role="img"
      aria-label={caption || undefined}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.14]"
        style={{
          backgroundImage: `url("data:image/svg+xml,${encodeURIComponent(
            `<svg xmlns='http://www.w3.org/2000/svg' width='240' height='96'><g fill='none' stroke='%23F4E7D8' stroke-width='1'><path d='M0 12 C40 4,80 20,120 12 S200 4,240 12'/><path d='M0 30 C40 22,90 38,130 30 S210 22,240 30'/><path d='M0 48 C30 40,70 56,120 48 S200 40,240 48'/><path d='M0 66 C50 58,90 74,130 66 S210 58,240 66'/><path d='M0 84 C40 76,80 92,120 84 S200 76,240 84'/></g></svg>`
          )}")`,
        }}
      />
      <Rings className="relative h-[42%] w-[42%] opacity-30" />
      {!compact && caption ? (
        <p className="ro-type-overline relative mt-4 px-4 text-center text-[var(--ro-ink-200)]">
          {caption}
        </p>
      ) : null}
    </div>
  );
}
