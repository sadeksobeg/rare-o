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
        className="hidden h-9 min-w-[9rem] items-center rounded-full border border-[color-mix(in_srgb,var(--ro-ink-950)_16%,transparent)] bg-[var(--ro-sand-50)] px-3 text-xs text-[var(--ro-ink-600)] md:inline-flex"
        aria-hidden
      >
        {labels.search}
      </span>
    );
  }

  return <Comp labels={labels} />;
}
