import { FileText } from "lucide-react";
import { formatMoney } from "@/lib/ui/trader-labels";

export type QuoteCardLine = {
  id: string;
  name: string;
  quantity: number;
  quotedUnitPrice: number | null;
  currency: string | null;
};

/**
 * Presents admin quotation fields that already exist in the schema.
 * Never computes totals — unit prices only, as entered by admin.
 */
export function QuoteCard({
  title,
  quotedAtLabel,
  quotedAt,
  currencyLabel,
  currency,
  messageLabel,
  message,
  linesLabel,
  qtyLabel,
  lines,
}: {
  title: string;
  quotedAtLabel: string;
  quotedAt: string | null;
  currencyLabel: string;
  currency: string | null;
  messageLabel: string;
  message: string | null;
  linesLabel: string;
  qtyLabel: string;
  lines: QuoteCardLine[];
}) {
  const priced = lines.filter((l) => l.quotedUnitPrice != null);
  return (
    <div className="rad-card space-y-4 border-[color-mix(in_srgb,var(--ro-amber-600)_28%,var(--rad-bd))] p-5 text-sm">
      <h2
        className="flex items-center gap-2 text-[15px] font-semibold text-[color:var(--rad-tx)]"
        style={{ fontFamily: "var(--rad-font, inherit)" }}
      >
        <span className="rad-chip rad-c-warn [&>svg]:size-4" aria-hidden>
          <FileText className="size-4" strokeWidth={1.5} />
        </span>
        {title}
      </h2>
      <dl className="grid gap-3 sm:grid-cols-2">
        {quotedAt ? (
          <div>
            <dt className="text-[color:var(--rad-tx3)]">{quotedAtLabel}</dt>
            <dd className="text-[color:var(--rad-tx)]">{quotedAt}</dd>
          </div>
        ) : null}
        {currency ? (
          <div>
            <dt className="text-[color:var(--rad-tx3)]">{currencyLabel}</dt>
            <dd className="text-[color:var(--rad-tx)]">{currency}</dd>
          </div>
        ) : null}
        {message ? (
          <div className="sm:col-span-2">
            <dt className="text-[color:var(--rad-tx3)]">{messageLabel}</dt>
            <dd className="whitespace-pre-wrap text-[color:var(--rad-tx)]">
              {message}
            </dd>
          </div>
        ) : null}
      </dl>
      {priced.length > 0 ? (
        <div className="space-y-2">
          <p className="text-[color:var(--rad-tx3)]">{linesLabel}</p>
          <ul className="divide-y divide-[color:var(--rad-bd)] border border-[color:var(--rad-bd)] rounded-[var(--rad-r-sm)]">
            {priced.map((l) => (
              <li
                key={l.id}
                className="flex flex-wrap items-baseline justify-between gap-2 px-3 py-2"
              >
                <span className="text-[color:var(--rad-tx)]">
                  {l.name}{" "}
                  <span className="text-[color:var(--rad-tx3)]">
                    · {qtyLabel} {l.quantity}
                  </span>
                </span>
                <span className="font-semibold text-[color:var(--rad-tx)]">
                  <bdi dir="ltr">
                    {formatMoney(l.quotedUnitPrice as number, currency || l.currency)}
                  </bdi>
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
