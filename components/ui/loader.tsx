import { Rings } from "@/components/brand";
import { cn } from "@/lib/utils";

export function Loader({
  size = 40,
  className,
  label,
}: {
  size?: 24 | 40;
  className?: string;
  label?: string;
}) {
  return (
    <span
      className={cn("inline-flex items-center justify-center", className)}
      role="status"
      aria-label={label || "Loading"}
    >
      <Rings
        className={cn(
          "text-ro-plum opacity-70",
          size === 24 ? "h-6 w-6" : "h-10 w-10"
        )}
        idle
      />
    </span>
  );
}
