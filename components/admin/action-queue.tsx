import Link from "next/link";
import { ChevronLeft } from "lucide-react";
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
  /** Prefer the domain that owns most queued rows (merged retail/deal/wholesale). */
  const domainCounts = rows.reduce(
    (acc, row) => {
      acc[row.domain] += 1;
      return acc;
    },
    { retail: 0, deal: 0, wholesale: 0 }
  );
  const dominant =
    (Object.entries(domainCounts).sort((a, b) => b[1] - a[1])[0]?.[0] as
      | "retail"
      | "deal"
      | "wholesale"
      | undefined) ?? "retail";
  const viewAllHref =
    dominant === "wholesale"
      ? "/admin/wholesale"
      : dominant === "deal"
        ? "/admin/deals"
        : "/admin/requests";

  return (
    <section className={cn("space-y-3", className)}>
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-display text-xl font-semibold text-ro-ink">
          {a.actionQueue}
        </h2>
        <Link
          href={viewAllHref}
          className="text-sm font-medium text-ro-plum transition-colors hover:text-[var(--ro-plum-900)] hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ro-focus)]"
        >
          {a.viewAll}
        </Link>
      </div>
      <ul className="ro-portal-card divide-y divide-ro-border border overflow-hidden">
        {rows.length === 0 ? (
          <li className="p-4 text-sm text-[var(--ro-success-700)]">
            {a.actionEmpty}
          </li>
        ) : (
          rows.map((row) => (
            <li key={`${row.domain}-${row.id}`}>
              <Link
                href={row.href}
                className="ro-portal-interactive-row group flex flex-wrap items-center gap-2 px-4 py-3.5 text-sm transition-[background-color] duration-[var(--ro-dur-fast)] hover:bg-[color-mix(in_srgb,var(--ro-plum-50)_50%,transparent)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--ro-focus)] active:bg-[color-mix(in_srgb,var(--ro-plum-100)_45%,transparent)]"
              >
                <StatusChip
                  tone={typeTone(row.domain)}
                  label={typeLabel(dict, row.domain)}
                  size="sm"
                />
                <span className="min-w-0 flex-1 font-medium text-ro-ink transition-colors group-hover:text-[var(--ro-plum-900)]">
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
                <span className="ms-auto inline-flex items-center gap-1 text-sm font-semibold text-ro-plum">
                  {a.actionOpen}
                  <ChevronLeft
                    className="size-4 opacity-0 transition-[opacity,transform] duration-[var(--ro-dur-fast)] group-hover:translate-x-[-2px] group-hover:opacity-100 rtl:rotate-180 rtl:group-hover:translate-x-[2px]"
                    aria-hidden
                  />
                </span>
              </Link>
            </li>
          ))
        )}
      </ul>
    </section>
  );
}
