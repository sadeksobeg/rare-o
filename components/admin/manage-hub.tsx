import type { ReactNode } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export type ManageHubItem = {
  href: string;
  label: string;
  value: number;
  icon: ReactNode;
};

/** Dashboard strip: real counts into products, traders, customers, inbox. */
export function ManageHub({
  title,
  items,
}: {
  title: string;
  items: ManageHubItem[];
}) {
  return (
    <section aria-labelledby="admin-manage-hub">
      <h2
        id="admin-manage-hub"
        className="mb-2 text-[11px] font-bold uppercase tracking-wide text-[color:var(--ro-text-muted)]"
      >
        {title}
      </h2>
      <ul className="divide-y divide-[color:var(--ro-border-subtle)] rounded-[var(--ro-r-lg)] border border-[color:var(--ro-border-subtle)] bg-[color:var(--ro-bg-raised)] lg:grid lg:grid-cols-4 lg:divide-x lg:divide-y-0">
        {items.map((item) => (
          <li key={item.href}>
            <Link
              href={item.href}
              className={cn(
                "group flex min-h-11 items-start gap-3 px-3.5 py-3",
                "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ro-focus)]"
              )}
            >
              <span
                className="inline-flex size-7 shrink-0 items-center justify-center rounded-[8px] bg-[color-mix(in_srgb,var(--ro-plum-700)_18%,transparent)] text-[var(--ro-plum-300)] [&>svg]:size-4"
                aria-hidden
              >
                {item.icon}
              </span>
              <div className="min-w-0">
                <p className="text-[12px] font-medium leading-snug text-[color:var(--ro-text-muted)]">
                  {item.label}
                </p>
                <p className="mt-0.5 font-display text-[1.45rem] font-medium leading-none tabular-nums text-[color:var(--ro-text)]">
                  {item.value}
                </p>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
