import { cn } from "@/lib/utils";

export function Axis({
  className,
  height = 48,
  withAmberDot = false,
}: {
  className?: string;
  height?: number;
  withAmberDot?: boolean;
}) {
  return (
    <span
      className={cn(
        "relative inline-flex w-px shrink-0 bg-current opacity-50",
        className
      )}
      style={{ height }}
      aria-hidden
    >
      {withAmberDot ? (
        <span className="absolute bottom-0 start-1/2 size-1.5 -translate-x-1/2 translate-y-1/2 rounded-full bg-[var(--ro-amber-500)] rtl:translate-x-1/2" />
      ) : null}
    </span>
  );
}
