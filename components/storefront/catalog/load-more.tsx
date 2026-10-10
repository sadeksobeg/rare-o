import Link from "next/link";
import { cn } from "@/lib/utils";

/** "عرض المزيد" link + progress. Plain link keeps scroll position (no JS needed). */
export function LoadMore({
  href,
  shown,
  total,
  progressLabel,
  label,
}: {
  href: string;
  shown: number;
  total: number;
  progressLabel: string;
  label: string;
}) {
  if (shown >= total) {
    return (
      <p className="text-center text-sm text-ro-muted tabular-nums">
        {progressLabel}
      </p>
    );
  }
  return (
    <div className="flex flex-col items-center gap-3">
      <p className="text-sm text-ro-muted tabular-nums">{progressLabel}</p>
      <Link
        href={href}
        scroll={false}
        className={cn(
          "inline-flex h-11 items-center justify-center rounded-[var(--ro-r-sm)] border border-ro-ink px-6 text-sm font-semibold text-ro-ink",
          "transition-colors duration-[var(--ro-dur-fast)] hover:bg-ro-sunken",
          "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ro-focus)]"
        )}
      >
        {label}
      </Link>
    </div>
  );
}
