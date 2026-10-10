import { parseSpecs } from "@/lib/catalog/specs";
import { cn } from "@/lib/utils";

/**
 * S12 — renders free-text specs (D34). `label: value` lines become a
 * two-column definition list (≥ 768 px); other lines stay as a prose block.
 */
export function SpecTable({
  text,
  heading,
  className,
}: {
  text: string | null | undefined;
  heading?: string;
  className?: string;
}) {
  const { rows, prose } = parseSpecs(text);
  if (rows.length === 0 && !prose) return null;

  return (
    <section className={cn("space-y-4", className)}>
      {heading ? <h2 className="ro-type-h2">{heading}</h2> : null}
      {rows.length > 0 ? (
        <dl className="grid border-t border-ro-border md:grid-cols-2 md:gap-x-10">
          {rows.map((row, i) => (
            <div
              key={`${row.label}-${i}`}
              className="flex items-baseline justify-between gap-6 border-b border-ro-border py-3"
            >
              <dt className="text-sm text-ro-muted">{row.label}</dt>
              <dd className="text-sm font-medium text-ro-ink text-end">
                {row.value}
              </dd>
            </div>
          ))}
        </dl>
      ) : null}
      {prose ? (
        <p className="max-w-[680px] whitespace-pre-line text-sm leading-relaxed text-ro-text-2">
          {prose}
        </p>
      ) : null}
    </section>
  );
}
