"use client";

import {
  useCallback,
  useId,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { cn } from "@/lib/utils";

export type TabItem = {
  id: string;
  label: string;
  panel: ReactNode;
  disabled?: boolean;
};

type Props = {
  items: readonly TabItem[];
  defaultValue?: string;
  value?: string;
  onValueChange?: (id: string) => void;
  className?: string;
  /** Accessible name for the tab list. */
  label: string;
};

/** P10 — underline tabs, roving tabindex, horizontal scroll + edge fade on mobile. */
export function Tabs({
  items,
  defaultValue,
  value: valueProp,
  onValueChange,
  className,
  label,
}: Props) {
  const baseId = useId();
  const listRef = useRef<HTMLDivElement>(null);
  const firstEnabled =
    items.find((t) => !t.disabled)?.id ?? items[0]?.id ?? "";
  const [uncontrolled, setUncontrolled] = useState(
    defaultValue ?? firstEnabled
  );
  const selected = valueProp ?? uncontrolled;

  const setSelected = useCallback(
    (id: string) => {
      if (valueProp === undefined) setUncontrolled(id);
      onValueChange?.(id);
    },
    [onValueChange, valueProp]
  );

  const enabledIndexes = items
    .map((t, i) => (!t.disabled ? i : -1))
    .filter((i) => i >= 0);

  function onKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    if (!enabledIndexes.length) return;
    const currentEnabled = enabledIndexes.findIndex(
      (i) => items[i]?.id === selected
    );
    const pos = currentEnabled < 0 ? 0 : currentEnabled;
    const rtl =
      typeof document !== "undefined" &&
      (document.documentElement.dir === "rtl" ||
        getComputedStyle(document.documentElement).direction === "rtl");

    let nextPos = pos;
    switch (e.key) {
      case "ArrowRight":
        nextPos = rtl
          ? (pos - 1 + enabledIndexes.length) % enabledIndexes.length
          : (pos + 1) % enabledIndexes.length;
        break;
      case "ArrowLeft":
        nextPos = rtl
          ? (pos + 1) % enabledIndexes.length
          : (pos - 1 + enabledIndexes.length) % enabledIndexes.length;
        break;
      case "Home":
        nextPos = 0;
        break;
      case "End":
        nextPos = enabledIndexes.length - 1;
        break;
      default:
        return;
    }
    e.preventDefault();
    const nextIndex = enabledIndexes[nextPos]!;
    const nextId = items[nextIndex]!.id;
    setSelected(nextId);
    requestAnimationFrame(() => {
      document.getElementById(`${baseId}-tab-${nextId}`)?.focus();
    });
  }

  const active = items.find((t) => t.id === selected) ?? items[0];

  return (
    <div className={cn("space-y-4", className)}>
      <div className="ro-tabs-scroll relative">
        <div
          ref={listRef}
          role="tablist"
          aria-label={label}
          onKeyDown={onKeyDown}
          className="flex gap-1 overflow-x-auto overscroll-x-contain border-b border-ro-border pb-px [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {items.map((tab) => {
            const isSelected = tab.id === selected;
            return (
              <button
                key={tab.id}
                id={`${baseId}-tab-${tab.id}`}
                type="button"
                role="tab"
                aria-selected={isSelected}
                aria-controls={`${baseId}-panel-${tab.id}`}
                tabIndex={isSelected ? 0 : -1}
                disabled={tab.disabled}
                onClick={() => setSelected(tab.id)}
                className={cn(
                  "shrink-0 border-b-2 px-3 py-2.5 text-sm font-medium transition-colors duration-[var(--ro-dur-fast)] ease-[var(--ro-ease-standard)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ro-focus)] disabled:pointer-events-none disabled:opacity-45",
                  isSelected
                    ? "border-[var(--ro-plum-900)] text-ro-ink"
                    : "border-transparent text-ro-muted hover:text-ro-ink"
                )}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>
      {active ? (
        <div
          id={`${baseId}-panel-${active.id}`}
          role="tabpanel"
          aria-labelledby={`${baseId}-tab-${active.id}`}
          tabIndex={0}
          className="text-sm text-ro-text-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ro-focus)]"
        >
          {active.panel}
        </div>
      ) : null}
    </div>
  );
}
