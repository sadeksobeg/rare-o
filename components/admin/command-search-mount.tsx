"use client";

import { useEffect, useState, type ComponentType } from "react";

export type CommandPaletteLabels = {
  search: string;
  placeholder: string;
  empty: string;
  searching: string;
  close: string;
  quickActions: string;
  navigate: string;
  pages: Record<string, string>;
};

export type CommandPaletteAction = { href: string; title: string };

type SlotProps = {
  labels: CommandPaletteLabels;
  actions?: CommandPaletteAction[];
};

/**
 * Isolates command-search from AdminShell so a poisoned webpack chunk
 * cannot make the whole admin shell crash with `undefined.call`.
 * Types live here — do not import the slot module at top level.
 */
export function AdminCommandSearchMount({ labels, actions }: SlotProps) {
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
        className="ro-cmd-search-trigger flex h-11 w-full min-w-0 flex-1 items-center rounded-[var(--ro-r-sm)] border border-[color:var(--ro-border-subtle)] bg-[color:var(--ro-bg-raised)] px-3 text-xs text-[color:var(--ro-text-muted)]"
        aria-hidden
      >
        {labels.search}
      </span>
    );
  }

  return <Slot labels={labels} actions={actions} />;
}
