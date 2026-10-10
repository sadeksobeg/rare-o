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
    <div className="space-y-4 border border-[var(--ro-amber-100)] bg-ro-surface p-5 text-sm">
      <h2 className="font-display text-lg font-semibold">{title}</h2>
      <dl className="grid gap-3 sm:grid-cols-2">
        {quotedAt ? (
          <div>
            <dt className="text-ro-muted">{quotedAtLabel}</dt>
            <dd>{quotedAt}</dd>
          </div>
        ) : null}
        {currency ? (
          <div>
            <dt className="text-ro-muted">{currencyLabel}</dt>
            <dd>{currency}</dd>
          </div>
        ) : null}
        {message ? (
          <div className="sm:col-span-2">
            <dt className="text-ro-muted">{messageLabel}</dt>
            <dd className="whitespace-pre-wrap">{message}</dd>
          </div>
        ) : null}
      </dl>
      {priced.length > 0 ? (
        <div className="space-y-2">
          <p className="text-ro-muted">{linesLabel}</p>
          <ul className="divide-y divide-ro-line border border-ro-line">
            {priced.map((l) => (
              <li
                key={l.id}
                className="flex flex-wrap items-baseline justify-between gap-2 px-3 py-2"
              >
                <span>
                  {l.name}{" "}
                  <span className="text-ro-muted">
                    · {qtyLabel} {l.quantity}
                  </span>
                </span>
                <span className="font-semibold">
                  {formatMoney(l.quotedUnitPrice as number, currency || l.currency)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
