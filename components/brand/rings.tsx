import { cn } from "@/lib/utils";

const RADII = [190, 150, 112, 78, 48, 22] as const;
const OPACITIES = [0.9, 0.7, 0.55, 0.42, 0.32, 0.22] as const;

export function Rings({
  className,
  amberRingIndex = -1,
  idle = false,
}: {
  className?: string;
  /** 0-based index that receives amber stroke; -1 = none */
  amberRingIndex?: number;
  idle?: boolean;
}) {
  return (
    <svg
      viewBox="0 0 400 400"
      className={cn("text-current", idle && "ro-rings-idle", className)}
      aria-hidden
      focusable="false"
    >
      {RADII.map((r, i) => (
        <circle
          key={r}
          cx="200"
          cy="200"
          r={r}
          fill="none"
          stroke={i === amberRingIndex ? "var(--ro-amber-500)" : "currentColor"}
          strokeWidth="1"
          vectorEffect="non-scaling-stroke"
          opacity={OPACITIES[i]}
          style={
            idle
              ? { animationDelay: `${i * 400}ms` }
              : undefined
          }
        />
      ))}
    </svg>
  );
}
