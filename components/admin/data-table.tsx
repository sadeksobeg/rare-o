import { cn } from "@/lib/utils";

/** Thin presentational table primitives shared by admin list pages. */
export function DataTable({ children }: { children: React.ReactNode }) {
  return (
    <div className="overflow-x-auto border border-ro-line">
      <table className="min-w-full text-start text-sm">{children}</table>
    </div>
  );
}

export function DataTableHead({ children }: { children: React.ReactNode }) {
  return (
    <thead className="border-b border-ro-line bg-ro-surface">
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
    <th className={cn("p-3 text-start font-medium", className)}>{children}</th>
  );
}

export function Tr({ children }: { children: React.ReactNode }) {
  return (
    <tr className="border-b border-ro-line transition-colors last:border-b-0 hover:bg-ro-sunken">
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
