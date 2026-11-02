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

type PaletteProps = { labels: CommandPaletteLabels };

/**
 * Loads the command palette only after mount.
 * A broken palette chunk must never make this export undefined.
 */
export function AdminCommandSearchSlot({ labels }: PaletteProps) {
  const [Comp, setComp] = useState<ComponentType<PaletteProps> | null>(null);

  useEffect(() => {
    let live = true;
    void import("./command-palette")
      .then((mod) => {
        const next = mod?.AdminCommandPalette;
        if (live && typeof next === "function") {
          setComp(() => next);
        }
      })
      .catch(() => {
        /* keep placeholder */
      });
    return () => {
      live = false;
    };
  }, []);

  if (!Comp) {
    return (
      <span
        className="ro-cmd-search-trigger flex h-11 w-full min-w-0 flex-1 items-center rounded-[var(--ro-r-sm)] border border-[color:var(--ro-border-subtle)] bg-[color:var(--ro-bg-raised)] px-3 text-xs text-[color:var(--ro-text-muted)]"
        aria-hidden
      >
        {labels.search}
      </span>
    );
  }

  return <Comp labels={labels} />;
}
