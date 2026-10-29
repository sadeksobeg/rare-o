"use client";

import { useEffect, useState, type ComponentType } from "react";

export type CommandPaletteLabels = {
  search: string;
  placeholder: string;
  empty: string;
  searching: string;
  close: string;
  pages: Record<string, string>;
};

type SlotProps = { labels: CommandPaletteLabels };

/**
 * Isolates command-search from AdminShell so a poisoned webpack chunk
 * cannot make the whole admin shell crash with `undefined.call`.
 * Types live here — do not import the slot module at top level.
 */
export function AdminCommandSearchMount({ labels }: SlotProps) {
  const [Slot, setSlot] = useState<ComponentType<SlotProps> | null>(null);

  useEffect(() => {
    let live = true;
    void import("./command-search-slot")
      .then((mod) => {
        const next = mod?.AdminCommandSearchSlot;
        if (live && typeof next === "function") {
          setSlot(() => next);
        }
      })
      .catch(() => {
        /* keep placeholder */
      });
    return () => {
      live = false;
    };
  }, []);

  if (!Slot) {
    return (
      <span
        className="hidden h-9 min-w-[9rem] items-center rounded-full border border-[color-mix(in_srgb,var(--ro-ink-950)_16%,transparent)] bg-[var(--ro-sand-50)] px-3 text-xs text-[var(--ro-ink-600)] md:inline-flex"
        aria-hidden
      >
        {labels.search}
      </span>
    );
  }

  return <Slot labels={labels} />;
}
