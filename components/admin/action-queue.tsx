import Link from "next/link";
import { StatusChip } from "@/components/ui/status-chip";
import type { ActionQueueRow } from "@/lib/admin/dashboard";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import { formatRelative } from "@/lib/i18n/format";
import type { Locale } from "@/lib/i18n/config";
import { cn } from "@/lib/utils";

function typeLabel(dict: Dictionary, domain: ActionQueueRow["domain"]) {
  if (domain === "retail") return dict.inbox.typeRetail;
  if (domain === "deal") return dict.inbox.typeDeal;
  return dict.inbox.typeWholesale;
}

function typeTone(
  domain: ActionQueueRow["domain"]
): "info" | "progress" | "attention" {
  if (domain === "retail") return "info";
  if (domain === "deal") return "progress";
  return "attention";
}

/** A06 / D31b — merged nextActor=admin rows, oldest first, max 8 + view all. */
export function ActionQueue({
  rows,
  dict,
  locale,
  className,
}: {
  rows: readonly ActionQueueRow[];
  dict: Dictionary;
  locale: Locale;
  className?: string;
}) {
  const a = dict.admin;

  return (
    <section className={cn("space-y-3", className)}>
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-ro-ink">{a.actionQueue}</h2>
        <Link
          href="/admin/requests"
          className="text-sm text-ro-plum hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ro-focus)]"
        >
          {a.viewAll}
        </Link>
      </div>
      <ul className="divide-y divide-ro-border border border-ro-border bg-ro-paper">
        {rows.length === 0 ? (
          <li className="p-4 text-sm text-[var(--ro-success-700)]">
            {a.actionEmpty}
          </li>
        ) : (
          rows.map((row) => (
            <li
              key={`${row.domain}-${row.id}`}
              className="flex flex-wrap items-center gap-2 px-4 py-3 text-sm"
            >
              <StatusChip
                tone={typeTone(row.domain)}
                label={typeLabel(dict, row.domain)}
                size="sm"
              />
              <span className="min-w-0 flex-1 font-medium text-ro-ink">
                {row.title}
              </span>
              <time
                className="text-xs text-ro-muted"
                dateTime={row.ageAt.toISOString()}
                title={row.ageAt.toISOString()}
              >
                {formatRelative(row.ageAt, locale)}
              </time>
              <StatusChip
                tone="attention"
                label={a.nextActorAdmin}
                size="sm"
                variant="dot"
              />
              <Link
                href={row.href}
                className="ms-auto text-sm font-semibold text-ro-plum hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ro-focus)]"
              >
                {a.actionOpen}
              </Link>
            </li>
          ))
        )}
      </ul>
    </section>
  );
}
