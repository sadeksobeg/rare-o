import { cn } from "@/lib/utils";

export type KeyValueItem = {
  label: string;
  value: React.ReactNode;
};

/** P20 — `<dl>`, two columns ≥ 640 px, stacked below; muted labels. */
export function KeyValueList({
  items,
  className,
}: {
  items: readonly KeyValueItem[];
  className?: string;
}) {
  return (
    <dl
      className={cn(
        "grid grid-cols-1 gap-x-6 gap-y-4 text-sm sm:grid-cols-2",
        className
      )}
    >
      {items.map((item, i) => (
        <div key={`${item.label}-${i}`} className="min-w-0">
          <dt className="text-xs text-ro-muted">{item.label}</dt>
          <dd className="mt-0.5 text-ro-ink">{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}
