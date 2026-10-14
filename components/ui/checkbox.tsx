import { cn } from "@/lib/utils";

type Shared = {
  label: string;
  name: string;
  value?: string;
  helper?: string;
  error?: string;
  className?: string;
  disabled?: boolean;
  defaultChecked?: boolean;
  checked?: boolean;
  onChange?: React.ChangeEventHandler<HTMLInputElement>;
  id?: string;
};

const hit =
  "relative inline-flex size-11 shrink-0 cursor-pointer items-center justify-center";

/** P04 — checkbox: 20 px control inside 44 px hit area; plum-900 when checked. */
export function Checkbox({
  label,
  name,
  value = "on",
  helper,
  error,
  className,
  disabled,
  defaultChecked,
  checked,
  onChange,
  id,
}: Shared) {
  const fieldId = id ?? `${name}-${value}`;
  const describedBy = error
    ? `${fieldId}-error`
    : helper
      ? `${fieldId}-help`
      : undefined;

  return (
    <div className={cn("space-y-1", className)}>
      <label
        htmlFor={fieldId}
        className={cn(
          "inline-flex max-w-full items-center gap-1 text-sm text-ro-ink",
          disabled && "pointer-events-none opacity-45"
        )}
      >
        <span className={hit}>
          <input
            id={fieldId}
            type="checkbox"
            name={name}
            value={value}
            disabled={disabled}
            defaultChecked={checked === undefined ? defaultChecked : undefined}
            checked={checked}
            onChange={onChange}
            aria-invalid={error ? true : undefined}
            aria-describedby={describedBy}
            aria-disabled={disabled || undefined}
            className="peer absolute inset-0 z-10 m-0 cursor-pointer opacity-0 disabled:cursor-not-allowed"
          />
          <span
            aria-hidden
            className={cn(
              "pointer-events-none flex size-5 items-center justify-center rounded-[var(--ro-r-xs)] border border-[var(--ro-border-control)] bg-ro-paper transition-colors duration-[var(--ro-dur-fast)] ease-[var(--ro-ease-standard)]",
              "peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-[var(--ro-focus)]",
              "peer-aria-invalid:border-[var(--ro-danger-700)]",
              "peer-checked:border-[var(--ro-plum-900)] peer-checked:bg-[var(--ro-plum-900)]",
              "peer-checked:[&>svg]:opacity-100"
            )}
          >
            <svg
              viewBox="0 0 16 16"
              className="size-3.5 text-[var(--ro-sand-100)] opacity-0 transition-opacity duration-[var(--ro-dur-fast)]"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.25"
            >
              <path d="M3.5 8.5 6.5 11.5 12.5 4.5" />
            </svg>
          </span>
        </span>
        <span className="min-w-0 leading-snug">{label}</span>
      </label>
      {error ? (
        <span
          id={`${fieldId}-error`}
          className="block ps-11 text-xs text-[var(--ro-danger-700)]"
          role="alert"
        >
          {error}
        </span>
      ) : helper ? (
        <span
          id={`${fieldId}-help`}
          className="block ps-11 text-xs text-ro-muted"
        >
          {helper}
        </span>
      ) : null}
    </div>
  );
}

/** P04 — radio: same hit area and checked plum as Checkbox. */
export function Radio({
  label,
  name,
  value,
  helper,
  error,
  className,
  disabled,
  defaultChecked,
  checked,
  onChange,
  id,
}: Shared & { value: string }) {
  const fieldId = id ?? `${name}-${value}`;
  const describedBy = error
    ? `${fieldId}-error`
    : helper
      ? `${fieldId}-help`
      : undefined;

  return (
    <div className={cn("space-y-1", className)}>
      <label
        htmlFor={fieldId}
        className={cn(
          "inline-flex max-w-full items-center gap-1 text-sm text-ro-ink",
          disabled && "pointer-events-none opacity-45"
        )}
      >
        <span className={hit}>
          <input
            id={fieldId}
            type="radio"
            name={name}
            value={value}
            disabled={disabled}
            defaultChecked={checked === undefined ? defaultChecked : undefined}
            checked={checked}
            onChange={onChange}
            aria-describedby={describedBy}
            aria-disabled={disabled || undefined}
            data-invalid={error ? "true" : undefined}
            className="peer absolute inset-0 z-10 m-0 cursor-pointer opacity-0 disabled:cursor-not-allowed"
          />
          <span
            aria-hidden
            className={cn(
              "pointer-events-none flex size-5 items-center justify-center rounded-full border border-[var(--ro-border-control)] bg-ro-paper transition-colors duration-[var(--ro-dur-fast)] ease-[var(--ro-ease-standard)]",
              "peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-[var(--ro-focus)]",
              "peer-data-[invalid=true]:border-[var(--ro-danger-700)]",
              "peer-checked:border-[var(--ro-plum-900)]",
              "peer-checked:[&>span]:opacity-100"
            )}
          >
            <span className="size-2.5 rounded-full bg-[var(--ro-plum-900)] opacity-0 transition-opacity duration-[var(--ro-dur-fast)]" />
          </span>
        </span>
        <span className="min-w-0 leading-snug">{label}</span>
      </label>
      {error ? (
        <span
          id={`${fieldId}-error`}
          className="block ps-11 text-xs text-[var(--ro-danger-700)]"
          role="alert"
        >
          {error}
        </span>
      ) : helper ? (
        <span
          id={`${fieldId}-help`}
          className="block ps-11 text-xs text-ro-muted"
        >
          {helper}
        </span>
      ) : null}
    </div>
  );
}
