import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

/** Amazon-style feature bullets derived from free-text specs / short description lines. */
export function ProductFeatureBullets({
  title,
  items,
  className,
}: {
  title: string;
  items: string[];
  className?: string;
}) {
  if (items.length === 0) return null;
  return (
    <section className={cn("space-y-3", className)}>
      <h2 className="text-sm font-bold text-ro-ink">{title}</h2>
      <ul className="space-y-2.5">
        {items.slice(0, 8).map((item) => (
          <li key={item} className="flex gap-2.5 text-sm leading-snug text-ro-text-2">
            <Check
              className="mt-0.5 size-4 shrink-0 text-[var(--ro-plum-900)]"
              strokeWidth={1.5}
              aria-hidden
            />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function parseFeatureLines(text: string | null | undefined): string[] {
  if (!text?.trim()) return [];
  return text
    .split(/\r?\n|[•·|]|(?<=[.!?])\s+/)
    .map((line) => line.replace(/^[-–—*]\s*/, "").trim())
    .filter((line) => line.length >= 4 && line.length <= 140)
    .slice(0, 8);
}
