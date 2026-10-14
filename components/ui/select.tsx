import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  label: string;
  name: string;
  options: readonly { value: string; label: string; disabled?: boolean }[];
  defaultValue?: string;
  value?: string;
  required?: boolean;
  helper?: string;
  error?: string;
  dense?: boolean;
  className?: string;
  placeholder?: string;
} & Omit<
  React.SelectHTMLAttributes<HTMLSelectElement>,
  "name" | "defaultValue" | "required" | "className" | "children"
>;

/** P03 — native `<select>` styled to match TextField; chevron mirrors with direction. */
export function Select({
  label,
  name,
  options,
  defaultValue,
  value,
  required,
  helper,
  error,
  dense,
  className,
  placeholder,
  id,
  disabled,
  ...rest
}: Props) {
  const fieldId = id ?? name;
  const describedBy = error
    ? `${fieldId}-error`
    : helper
      ? `${fieldId}-help`
      : undefined;

  return (
    <label className={cn("block space-y-1.5 text-sm", className)}>
      <span className="font-medium text-ro-ink">
        {label}
        {required ? " *" : ""}
      </span>
      <span className="relative block">
        <select
          id={fieldId}
          name={name}
          defaultValue={value === undefined ? defaultValue : undefined}
          value={value}
          required={required}
          disabled={disabled}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          aria-disabled={disabled || undefined}
          className={cn(
            "ro-select w-full appearance-none rounded-[var(--ro-r-sm)] border bg-ro-paper pe-10 ps-3 text-ro-ink outline-none transition-colors duration-[var(--ro-dur-fast)] ease-[var(--ro-ease-standard)] focus:border-[var(--ro-plum-900)] focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-[var(--ro-focus)] disabled:pointer-events-none disabled:opacity-45",
            dense ? "h-10" : "h-12",
            error
              ? "border-[var(--ro-danger-700)]"
              : "border-[var(--ro-border-control)]"
          )}
          {...rest}
        >
          {placeholder ? (
            <option value="" disabled>
              {placeholder}
            </option>
          ) : null}
          {options.map((opt) => (
            <option
              key={opt.value}
              value={opt.value}
              disabled={opt.disabled}
            >
              {opt.label}
            </option>
          ))}
        </select>
        <ChevronDown
          aria-hidden
          className="pointer-events-none absolute end-3 top-1/2 size-4 -translate-y-1/2 text-ro-muted"
          strokeWidth={1.75}
        />
      </span>
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
      ) : null}
    </label>
  );
}
