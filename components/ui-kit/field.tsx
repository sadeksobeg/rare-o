import {
  useId,
  type InputHTMLAttributes,
  type ReactElement,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from "react";
import { Children, cloneElement, isValidElement } from "react";
import { cn } from "@/lib/utils";

export function Field({
  label,
  hint,
  error,
  children,
  className,
}: {
  label?: ReactNode;
  hint?: ReactNode;
  error?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  const autoId = useId();
  let control = children;
  if (label != null && isValidElement(children)) {
    const child = children as ReactElement<{ id?: string }>;
    const id = child.props.id ?? autoId;
    control = cloneElement(child, { id });
    // Select wraps native select — pass id through if possible
  } else if (label != null) {
    const arr = Children.toArray(children);
    if (arr.length === 1 && isValidElement(arr[0])) {
      const child = arr[0] as ReactElement<{ id?: string }>;
      control = cloneElement(child, { id: child.props.id ?? autoId });
    }
  }
  const labelFor =
    isValidElement(control) && (control as ReactElement<{ id?: string }>).props.id
      ? String((control as ReactElement<{ id?: string }>).props.id)
      : undefined;

  return (
    <div className={cn("rad-fx", className)}>
      {label != null ? (
        <label className="rad-lb" htmlFor={labelFor}>
          {label}
        </label>
      ) : null}
      {control}
      {error ? <p className="rad-ferr">{error}</p> : null}
      {!error && hint ? <p className="rad-hint2">{hint}</p> : null}
    </div>
  );
}

export function Input({
  className,
  invalid,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { invalid?: boolean }) {
  return (
    <input
      className={cn("rad-inp", invalid && "rad-err", className)}
      aria-invalid={invalid || undefined}
      {...props}
    />
  );
}

export function Textarea({
  className,
  invalid,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement> & { invalid?: boolean }) {
  return (
    <textarea
      className={cn("rad-txa", invalid && "rad-err", className)}
      aria-invalid={invalid || undefined}
      {...props}
    />
  );
}

/** Native select with an always-visible chevron (SVG sibling — survives background resets). */
export function Select({
  className,
  invalid,
  children,
  id,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement> & { invalid?: boolean }) {
  return (
    <div className="rad-slc-wrap">
      <select
        id={id}
        className={cn("rad-slc", invalid && "rad-err", className)}
        aria-invalid={invalid || undefined}
        {...props}
      >
        {children}
      </select>
      <span className="rad-slc-chevron" aria-hidden>
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </span>
    </div>
  );
}
