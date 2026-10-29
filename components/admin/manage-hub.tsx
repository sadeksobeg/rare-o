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
        className="mb-2.5 text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--ro-ink-200)]"
      >
        {title}
      </h2>
      <ul className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
        {items.map((item) => (
          <li key={item.href}>
            <Link
              href={item.href}
              className={cn(
                "ro-portal-card group flex items-start gap-3 border p-3",
                "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ro-focus)]"
              )}
            >
              <span
                className="inline-flex size-7 shrink-0 items-center justify-center rounded-[8px] bg-[var(--ro-plum-100)] text-[var(--ro-plum-900)] [&>svg]:size-4"
                aria-hidden
              >
                {item.icon}
              </span>
              <div className="min-w-0">
                <p className="text-[12px] font-medium leading-snug text-[var(--ro-ink-600)]">
                  {item.label}
                </p>
                <p className="mt-0.5 font-display text-[1.45rem] font-medium leading-none tabular-nums text-ro-ink">
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
