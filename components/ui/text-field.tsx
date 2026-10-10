import { cn } from "@/lib/utils";

type Props = {
  label: string;
  name: string;
  type?: string;
  defaultValue?: string;
  required?: boolean;
  helper?: string;
  error?: string;
  dir?: "ltr" | "rtl" | "auto";
  className?: string;
  dense?: boolean;
} & Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "name" | "type" | "defaultValue" | "required" | "dir" | "className"
>;

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
  id,
  ...rest
}: Props) {
  const fieldId = id ?? name;
  const describedBy = error ? `${fieldId}-error` : helper ? `${fieldId}-help` : undefined;

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
        defaultValue={defaultValue}
        required={required}
        dir={dir}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={cn(
          "w-full rounded-[var(--ro-r-sm)] border bg-ro-paper px-3 text-ro-ink outline-none transition-colors focus:border-[var(--ro-plum-900)] focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-[var(--ro-focus)]",
          dense ? "h-10" : "h-12",
          error
            ? "border-[var(--ro-danger-700)]"
            : "border-[var(--ro-border-control)]"
        )}
        {...rest}
      />
      {error ? (
        <span id={`${fieldId}-error`} className="block text-xs text-[var(--ro-danger-700)]" role="alert">
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
