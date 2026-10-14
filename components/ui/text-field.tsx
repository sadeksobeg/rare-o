"use client";

import { useId, useState } from "react";
import { cn } from "@/lib/utils";

type FieldShared = {
  label: string;
  name: string;
  required?: boolean;
  helper?: string;
  error?: string;
  dir?: "ltr" | "rtl" | "auto";
  className?: string;
  /** Admin dense: height 40. Default (storefront/trader): 48. */
  dense?: boolean;
  /** When set, shows a character counter (P02). */
  maxLength?: number;
};

type TextFieldProps = FieldShared &
  Omit<
    React.InputHTMLAttributes<HTMLInputElement>,
    "name" | "required" | "dir" | "className" | "maxLength"
  >;

type TextareaProps = FieldShared &
  Omit<
    React.TextareaHTMLAttributes<HTMLTextAreaElement>,
    "name" | "required" | "dir" | "className" | "maxLength"
  > & {
    /** Min rows (default 4); auto-grows toward maxRows. */
    rows?: number;
    maxRows?: number;
  };

function describedByIds(
  fieldId: string,
  error?: string,
  helper?: string,
  counterId?: string
) {
  const parts: string[] = [];
  if (error) parts.push(`${fieldId}-error`);
  else if (helper) parts.push(`${fieldId}-help`);
  if (counterId) parts.push(counterId);
  return parts.length ? parts.join(" ") : undefined;
}

const controlClass = (dense: boolean | undefined, error: string | undefined) =>
  cn(
    "w-full rounded-[var(--ro-r-sm)] border bg-ro-paper px-3 text-ro-ink outline-none transition-colors duration-[var(--ro-dur-fast)] ease-[var(--ro-ease-standard)] focus:border-[var(--ro-plum-900)] focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-[var(--ro-focus)] disabled:pointer-events-none disabled:opacity-45",
    dense ? "h-10" : "h-12",
    error
      ? "border-[var(--ro-danger-700)]"
      : "border-[var(--ro-border-control)]"
  );

/** P02 — TextField: heights 48/40, aria-describedby, optional char counter. */
export function TextField({
  label,
  name,
  type = "text",
  defaultValue,
  required,
  helper,
  error,
  dir,
  className,
  dense,
  maxLength,
  id,
  value,
  onChange,
  ...rest
}: TextFieldProps) {
  const autoId = useId();
  const fieldId = id ?? name ?? autoId;
  const counterId = maxLength != null ? `${fieldId}-count` : undefined;
  const initial =
    typeof value === "string"
      ? value.length
      : typeof defaultValue === "string"
        ? defaultValue.length
        : 0;
  const [count, setCount] = useState(initial);
  const describedBy = describedByIds(fieldId, error, helper, counterId);
  const autoDir =
    dir ??
    (type === "email" || type === "tel" || type === "url" ? "ltr" : undefined);

  return (
    <label className={cn("block space-y-1.5 text-sm", className)}>
      <span className="font-medium text-ro-ink">
        {label}
        {required ? " *" : ""}
      </span>
      <input
        id={fieldId}
        name={name}
        type={type}
        defaultValue={value === undefined ? defaultValue : undefined}
        value={value}
        required={required}
        dir={autoDir}
        maxLength={maxLength}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={controlClass(dense, error)}
        onChange={(e) => {
          if (maxLength != null) setCount(e.target.value.length);
          onChange?.(e);
        }}
        {...rest}
      />
      <span className="flex items-start justify-between gap-3">
        {error ? (
          <span
            id={`${fieldId}-error`}
            className="block text-xs text-[var(--ro-danger-700)]"
            role="alert"
          >
            {error}
          </span>
        ) : helper ? (
          <span id={`${fieldId}-help`} className="block text-xs text-ro-muted">
            {helper}
          </span>
        ) : (
          <span />
        )}
        {maxLength != null ? (
          <span
            id={counterId}
            className="shrink-0 text-xs tabular-nums text-ro-muted"
          >
            {count}/{maxLength}
          </span>
        ) : null}
      </span>
    </label>
  );
}

/** P02 — Textarea: 4 rows min, auto-grow to maxRows (default 10). */
export function Textarea({
  label,
  name,
  defaultValue,
  required,
  helper,
  error,
  dir,
  className,
  dense,
  maxLength,
  id,
  value,
  onChange,
  rows = 4,
  maxRows = 10,
  ...rest
}: TextareaProps) {
  const autoId = useId();
  const fieldId = id ?? name ?? autoId;
  const counterId = maxLength != null ? `${fieldId}-count` : undefined;
  const initial =
    typeof value === "string"
      ? value.length
      : typeof defaultValue === "string"
        ? defaultValue.length
        : 0;
  const [count, setCount] = useState(initial);
  const describedBy = describedByIds(fieldId, error, helper, counterId);

  function autoGrow(el: HTMLTextAreaElement) {
    el.style.height = "auto";
    const line = Number.parseFloat(getComputedStyle(el).lineHeight) || 24;
    const maxH = line * maxRows + 16;
    el.style.height = `${Math.min(el.scrollHeight, maxH)}px`;
  }

  return (
    <label className={cn("block space-y-1.5 text-sm", className)}>
      <span className="font-medium text-ro-ink">
        {label}
        {required ? " *" : ""}
      </span>
      <textarea
        id={fieldId}
        name={name}
        defaultValue={value === undefined ? defaultValue : undefined}
        value={value}
        required={required}
        dir={dir}
        maxLength={maxLength}
        rows={rows}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={cn(
          "w-full resize-none rounded-[var(--ro-r-sm)] border bg-ro-paper px-3 py-2.5 text-ro-ink outline-none transition-colors duration-[var(--ro-dur-fast)] ease-[var(--ro-ease-standard)] focus:border-[var(--ro-plum-900)] focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-[var(--ro-focus)] disabled:pointer-events-none disabled:opacity-45",
          "min-h-24",
          error
            ? "border-[var(--ro-danger-700)]"
            : "border-[var(--ro-border-control)]",
          dense && "text-sm"
        )}
        onChange={(e) => {
          if (maxLength != null) setCount(e.target.value.length);
          autoGrow(e.currentTarget);
          onChange?.(e);
        }}
        ref={(el) => {
          if (el) autoGrow(el);
        }}
        {...rest}
      />
      <span className="flex items-start justify-between gap-3">
        {error ? (
          <span
            id={`${fieldId}-error`}
            className="block text-xs text-[var(--ro-danger-700)]"
            role="alert"
          >
            {error}
          </span>
        ) : helper ? (
          <span id={`${fieldId}-help`} className="block text-xs text-ro-muted">
            {helper}
          </span>
        ) : (
          <span />
        )}
        {maxLength != null ? (
          <span
            id={counterId}
            className="shrink-0 text-xs tabular-nums text-ro-muted"
          >
            {count}/{maxLength}
          </span>
        ) : null}
      </span>
    </label>
  );
}
