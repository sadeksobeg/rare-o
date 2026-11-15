"use client";

import { cloneElement, isValidElement, useId, useState, type ReactElement, type ReactNode } from "react";
import { CircleHelp } from "lucide-react";

/**
 * A form field with a «?» button that explains it in plain words (opens a small callout under the label).
 */
export function HelpField({
  label,
  help,
  optional,
  optionalLabel,
  children,
}: {
  label: ReactNode;
  help: ReactNode;
  optional?: boolean;
  optionalLabel?: string;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const id = useId();
  const helpId = `${id}-help`;
  const control = isValidElement(children)
    ? cloneElement(children as ReactElement<{ id?: string; "aria-describedby"?: string }>, {
        id,
        "aria-describedby": open ? helpId : undefined,
      })
    : children;
  return (
    <div className="rad-fx min-w-0">
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <label className="rad-lb !mb-0" htmlFor={id}>
          {label}
          {optional ? (
            <span className="ms-2 rounded-full bg-[color:var(--rad-surface3)] px-2 py-px text-[10.5px] font-semibold text-[color:var(--rad-tx3)]">
              {optionalLabel ?? "اختياري"}
            </span>
          ) : null}
        </label>
        <button
          type="button"
          aria-expanded={open}
          aria-controls={helpId}
          aria-label="شرح هذا الحقل"
          onClick={() => setOpen((v) => !v)}
          className="inline-flex size-7 shrink-0 items-center justify-center rounded-full border border-[color:var(--rad-bd)] text-[color:var(--rad-ac)] transition-colors hover:bg-[color:var(--rad-surface3)]"
        >
          <CircleHelp className="size-4" strokeWidth={1.75} aria-hidden />
        </button>
      </div>
      {open ? (
        <div
          id={helpId}
          role="note"
          className="mb-2 rounded-xl border border-[color:color-mix(in_srgb,var(--rad-ac)_35%,var(--rad-bd))] bg-[color:color-mix(in_srgb,var(--rad-ac)_8%,transparent)] p-3 text-[13px] leading-relaxed text-[color:var(--rad-tx2)]"
        >
          {help}
        </div>
      ) : null}
      {control}
    </div>
  );
}
