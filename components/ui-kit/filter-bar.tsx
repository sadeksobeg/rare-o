"use client";

import { Search } from "lucide-react";
import {
  useEffect,
  useRef,
  type ChangeEvent,
  type ReactNode,
} from "react";
import { cn } from "@/lib/utils";

export type FilterChip = {
  id: string;
  label: ReactNode;
  active?: boolean;
  onClick?: () => void;
  /** Hide at ≤900px (reference `.mh`). */
  hideOnMobile?: boolean;
  className?: string;
};

/**
 * Search + filter chips tool bar.
 * Optional `/` shortcut focuses the search when not typing in another field.
 */
export function FilterBar({
  searchValue,
  onSearchChange,
  searchPlaceholder,
  searchLabel,
  showSlashHint = true,
  chips,
  endSlot,
  className,
}: {
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
  searchLabel?: string;
  showSlashHint?: boolean;
  chips?: FilterChip[];
  endSlot?: ReactNode;
  className?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!showSlashHint) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "/" || e.metaKey || e.ctrlKey || e.altKey) return;
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || (e.target as HTMLElement)?.isContentEditable) {
        return;
      }
      e.preventDefault();
      inputRef.current?.focus();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [showSlashHint]);

  const onChange = (e: ChangeEvent<HTMLInputElement>) => {
    onSearchChange?.(e.target.value);
  };

  return (
    <div className={cn("rad-tbar", className)}>
      {onSearchChange != null || searchValue != null ? (
        <label className="rad-sin">
          <Search width={16} height={16} strokeWidth={1.5} aria-hidden className="rad-ic" />
          <input
            ref={inputRef}
            value={searchValue ?? ""}
            onChange={onChange}
            placeholder={searchPlaceholder}
            aria-label={searchLabel ?? searchPlaceholder}
          />
          {showSlashHint ? <kbd>/</kbd> : null}
        </label>
      ) : null}
      {chips?.map((chip) => (
        <button
          key={chip.id}
          type="button"
          className={cn(
            "rad-fch",
            chip.active && "rad-on",
            chip.hideOnMobile && "rad-mh",
            chip.className
          )}
          aria-pressed={chip.active}
          onClick={chip.onClick}
        >
          {chip.label}
        </button>
      ))}
      {endSlot ? (
        <>
          <span className="rad-tsp" aria-hidden />
          {endSlot}
        </>
      ) : null}
    </div>
  );
}
