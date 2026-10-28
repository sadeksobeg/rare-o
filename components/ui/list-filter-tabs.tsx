"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { CountUp } from "@/components/motion/count-up";
import { cn } from "@/lib/utils";

export type ListFilterTab = {
  id: string;
  label: string;
  count?: number;
};

/** Interactive segmented tabs — pending feedback + selected pill. */
export function ListFilterTabs({
  tabs,
  param = "tab",
  label,
}: {
  tabs: readonly ListFilterTab[];
  param?: string;
  label: string;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();
  const active = searchParams.get(param) || tabs[0]?.id || "all";

  return (
    <div
      role="tablist"
      aria-label={label}
      aria-busy={pending || undefined}
      className={cn(
        "ro-portal-tablist flex gap-1 overflow-x-auto overscroll-x-contain [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
        pending && "opacity-75"
      )}
    >
      {tabs.map((tab) => {
        const selected = tab.id === active;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={selected}
            className={cn(
              "inline-flex h-10 shrink-0 items-center gap-1.5 px-3 text-sm transition-[color,background-color,box-shadow,transform] duration-[var(--ro-dur-fast)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ro-focus)] active:scale-[0.98]",
              selected
                ? "font-semibold text-[var(--ro-plum-900)]"
                : "text-ro-text-2 hover:text-[var(--ro-plum-800)]"
            )}
            onClick={() => {
              if (selected) return;
              const next = new URLSearchParams(searchParams.toString());
              if (tab.id === "all" || tab.id === tabs[0]?.id) next.delete(param);
              else next.set(param, tab.id);
              next.delete("page");
              const qs = next.toString();
              const href = qs ? `${pathname}?${qs}` : pathname;
              startTransition(() => {
                router.replace(href, { scroll: false });
              });
            }}
          >
            {tab.label}
            {tab.count != null ? (
              <span
                className={cn(
                  "rounded-full px-1.5 py-0.5 text-[0.65rem] tabular-nums",
                  selected
                    ? "bg-[var(--ro-plum-100)] text-[var(--ro-plum-900)]"
                    : "bg-ro-sunken text-ro-muted"
                )}
              >
                <CountUp value={tab.count} durationMs={200} />
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
