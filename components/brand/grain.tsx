import { cn } from "@/lib/utils";

export function Grain({
  className,
  opacity = 0.08,
  patternId = "ro-grain-pattern",
}: {
  className?: string;
  opacity?: number;
  /** Unique when multiple Grain instances share a page. */
  patternId?: string;
}) {
  const id = patternId;
  return (
    <svg
      className={cn("pointer-events-none h-full w-full text-current", className)}
      aria-hidden
      focusable="false"
      preserveAspectRatio="none"
      width="100%"
      height="100%"
    >
      <defs>
        <pattern
          id={id}
          width="240"
          height="96"
          patternUnits="userSpaceOnUse"
        >
          <g
            fill="none"
            stroke="currentColor"
            strokeWidth="1"
            vectorEffect="non-scaling-stroke"
            opacity={opacity}
          >
            <path d="M0 12 C40 4,80 20,120 12 S200 4,240 12" />
            <path d="M0 30 C40 22,90 38,130 30 S210 22,240 30" />
            <path d="M0 48 C30 40,70 56,120 48 S200 40,240 48" />
            <path d="M0 66 C50 58,90 74,130 66 S210 58,240 66" />
            <path d="M0 84 C40 76,80 92,120 84 S200 76,240 84" />
          </g>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${id})`} />
    </svg>
  );
}
