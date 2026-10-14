"use client";

import { useId, useState } from "react";
import { cn } from "@/lib/utils";

type Props = {
  label: string;
  /** Visible state text when on — e.g. مفعّل / On */
  onLabel: string;
  /** Visible state text when off — e.g. متوقف / Off */
  offLabel: string;
  name?: string;
  defaultChecked?: boolean;
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
  id?: string;
};

/** P05 — 44 × 24 switch with role="switch", label + state text. */
export function Switch({
  label,
  onLabel,
  offLabel,
  name,
  defaultChecked = false,
  checked: checkedProp,
  onCheckedChange,
  disabled,
  className,
  id,
}: Props) {
  const autoId = useId();
  const fieldId = id ?? autoId;
  const [uncontrolled, setUncontrolled] = useState(defaultChecked);
  const checked = checkedProp ?? uncontrolled;

  function setChecked(next: boolean) {
    if (checkedProp === undefined) setUncontrolled(next);
    onCheckedChange?.(next);
  }

  return (
    <div
      className={cn(
        "inline-flex items-center gap-3 text-sm text-ro-ink",
        disabled && "pointer-events-none opacity-45",
        className
      )}
    >
      {name ? (
        <input type="hidden" name={name} value={checked ? "on" : "off"} />
      ) : null}
      <button
        id={fieldId}
        type="button"
        role="switch"
        aria-checked={checked}
        aria-disabled={disabled || undefined}
        disabled={disabled}
        onClick={() => setChecked(!checked)}
        className={cn(
          "relative h-6 w-11 shrink-0 rounded-[var(--ro-r-full)] border transition-colors duration-[var(--ro-dur-fast)] ease-[var(--ro-ease-standard)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ro-focus)]",
          checked
            ? "border-[var(--ro-plum-900)] bg-[var(--ro-plum-900)]"
            : "border-[var(--ro-border-control)] bg-ro-sunken"
        )}
      >
        <span
          aria-hidden
          className={cn(
            "absolute top-0.5 size-5 rounded-[var(--ro-r-full)] bg-[var(--ro-sand-100)] transition-transform duration-[var(--ro-dur-fast)] ease-[var(--ro-ease-standard)]",
            "inset-inline-start-0.5",
            checked && "translate-x-5 rtl:-translate-x-5"
          )}
        />
      </button>
      <label htmlFor={fieldId} className="min-w-0 cursor-pointer leading-snug">
        <span className="font-medium">{label}</span>
        <span className="ms-2 text-ro-muted" aria-live="polite">
          {checked ? onLabel : offLabel}
        </span>
      </label>
    </div>
  );
}
