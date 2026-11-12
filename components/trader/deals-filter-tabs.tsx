"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { SegControl } from "@/components/ui-kit/seg-control";
import { cn } from "@/lib/utils";

export type DealsFilterTab = {
  id: string;
  label: string;
  count?: number;
};

/**
 * Status partition (SegControl) + optional action chip for «بانتظارك».
 * Status tab counts must sum to «الكل»; waiting is a separate action filter.
 */
export function DealsFilterTabs({
  tabs,
  waiting,
  param = "tab",
  waitingParam = "waiting",
  label,
}: {
  tabs: readonly DealsFilterTab[];
  waiting?: { label: string; count: number };
  param?: string;
  waitingParam?: string;
  label: string;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();
  const active = searchParams.get(param) || tabs[0]?.id || "all";
  const waitingOn = searchParams.get(waitingParam) === "1";

  function replace(next: URLSearchParams) {
    const qs = next.toString();
    const href = qs ? `${pathname}?${qs}` : pathname;
    startTransition(() => {
      router.replace(href, { scroll: false });
    });
  }

  return (
    <div
      aria-busy={pending || undefined}
      className={cn(
        "flex flex-wrap items-center gap-3",
        pending && "opacity-75"
      )}
    >
      <SegControl
        aria-label={label}
        value={active}
        items={tabs.map((t) => ({
          value: t.id,
          label: t.label,
          count: t.count,
        }))}
        onChange={(id) => {
          if (id === active) return;
          const next = new URLSearchParams(searchParams.toString());
          if (id === "all" || id === tabs[0]?.id) next.delete(param);
          else next.set(param, id);
          next.delete("page");
          replace(next);
        }}
      />
      {waiting ? (
        <button
          type="button"
          aria-pressed={waitingOn}
          className={cn(
            "inline-flex h-9 items-center gap-2 rounded-full border px-3 text-[12.5px] font-semibold transition-[background-color,border-color,color,transform] duration-[var(--ro-dur-fast)] active:scale-[0.97]",
            waitingOn
              ? "border-[color:color-mix(in_srgb,var(--rad-warn)_55%,var(--rad-bd))] bg-[color:var(--rad-warns)] text-[color:var(--rad-warn)]"
              : "border-[color:var(--rad-bd2)] bg-[color:var(--rad-surface)] text-[color:var(--rad-tx2)] hover:bg-[color:var(--rad-surface3)]"
          )}
          onClick={() => {
            const next = new URLSearchParams(searchParams.toString());
            if (waitingOn) next.delete(waitingParam);
            else next.set(waitingParam, "1");
            next.delete("page");
            replace(next);
          }}
        >
          {waiting.label}
          <em className="rad-num not-italic tabular-nums opacity-80">
            {waiting.count}
          </em>
        </button>
      ) : null}
    </div>
  );
}
