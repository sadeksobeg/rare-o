import { cn } from "@/lib/utils";

/** Thin presentational table primitives — interactive row affordance. */
export function DataTable({ children }: { children: React.ReactNode }) {
  return (
    <div className="ro-portal-table overflow-x-auto border">
      <table className="min-w-full text-start text-sm">{children}</table>
    </div>
  );
}

export function DataTableHead({ children }: { children: React.ReactNode }) {
  return (
    <thead className="border-b border-ro-line">
      <tr>{children}</tr>
    </thead>
  );
}

export function Th({
  children,
  className,
}: {
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <th
      className={cn(
        "p-3 text-start text-xs font-semibold tracking-wide text-ro-text-2",
        className
      )}
    >
      {children}
    </th>
  );
}

export function Tr({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <tr
      className={cn(
        "ro-portal-interactive-row border-b border-ro-line last:border-b-0 hover:bg-[color-mix(in_srgb,var(--ro-plum-50)_55%,var(--ro-sand-200))]",
        className
      )}
    >
      {children}
    </tr>
  );
}

export function Td({
  children,
  className,
  dir,
}: {
  children?: React.ReactNode;
  className?: string;
  dir?: "ltr" | "rtl";
}) {
  return (
    <td dir={dir} className={cn("p-3 align-middle", className)}>
      {children}
    </td>
  );
}
