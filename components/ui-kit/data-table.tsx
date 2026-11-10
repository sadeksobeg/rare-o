"use client";

import type {
  CSSProperties,
  KeyboardEvent,
  ReactNode,
} from "react";
import { cn } from "@/lib/utils";

export type DataTableMobileSlot =
  | "check"
  | "id"
  | "who"
  | "status"
  | "actions"
  /** Visible action row on mobile cards (disable/reset/etc). */
  | "acts";

export type DataTableColumn<T> = {
  id: string;
  header: ReactNode;
  cell: (row: T, index: number) => ReactNode;
  className?: string;
  headerClassName?: string;
  /** Hide column body/header at ≤900px (reference `.mh`). */
  hideOnMobile?: boolean;
  /** Mobile card grid placement (reference `.cid` / `.cwho` / `.cst` / `.c1`). */
  mobileSlot?: DataTableMobileSlot;
};

const MOBILE_SLOT_CLASS: Record<DataTableMobileSlot, string> = {
  check: "rad-c1",
  id: "rad-cid",
  who: "rad-cwho",
  status: "rad-cst",
  actions: "rad-mh",
  acts: "rad-cacts",
};

export type DataTableProps<T> = {
  columns: DataTableColumn<T>[];
  rows: T[];
  getRowId: (row: T) => string;
  /** Optional row selection. Omit (or selectable=false) to hide checkbox column. */
  selectable?: boolean;
  selectedIds?: ReadonlySet<string> | readonly string[];
  onSelectionChange?: (ids: string[]) => void;
  selectAllLabel?: string;
  selectRowLabel?: (row: T) => string;
  onRowClick?: (row: T) => void;
  /** Extra row panel / menu hooks — called after selection toggle is skipped. */
  onRowActivate?: (row: T) => void;
  className?: string;
  /** Sticky `<th>` offset inside scroll container (default 0; main scroll is below topbar). */
  stickyTop?: number;
  empty?: ReactNode;
};

function toSet(ids: ReadonlySet<string> | readonly string[] | undefined): Set<string> {
  if (!ids) return new Set();
  return ids instanceof Set ? new Set(ids) : new Set(ids);
}

/**
 * Sticky-header data table with staggered row enter (30ms), optional selection,
 * and ≤900px card transform via CSS.
 */
export function DataTable<T>({
  columns,
  rows,
  getRowId,
  selectable = false,
  selectedIds,
  onSelectionChange,
  selectAllLabel,
  selectRowLabel,
  onRowClick,
  onRowActivate,
  className,
  stickyTop = 0,
  empty,
}: DataTableProps<T>) {
  const selected = toSet(selectedIds);
  const allIds = rows.map(getRowId);
  const allSelected = allIds.length > 0 && allIds.every((id) => selected.has(id));
  const someSelected = allIds.some((id) => selected.has(id));

  const setSelected = (next: Set<string>) => {
    onSelectionChange?.([...next]);
  };

  const toggleAll = () => {
    if (allSelected) setSelected(new Set());
    else setSelected(new Set(allIds));
  };

  const toggleOne = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  };

  const onKeyDownRow = (e: KeyboardEvent<HTMLTableRowElement>, row: T) => {
    const tr = e.currentTarget;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      (tr.nextElementSibling as HTMLElement | null)?.focus();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      (tr.previousElementSibling as HTMLElement | null)?.focus();
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onRowActivate?.(row);
      onRowClick?.(row);
    } else if (e.key === "x" && selectable) {
      e.preventDefault();
      toggleOne(getRowId(row));
    }
  };

  if (rows.length === 0 && empty) {
    return <>{empty}</>;
  }

  return (
    <table
      className={cn("rad-dt", className)}
      style={{ "--rad-dt-sticky-top": `${stickyTop}px` } as CSSProperties}
    >
      <thead>
        <tr>
          {selectable ? (
            <th className="rad-c1">
              <input
                type="checkbox"
                className="rad-ck"
                checked={allSelected}
                ref={(el) => {
                  if (el) el.indeterminate = someSelected && !allSelected;
                }}
                onChange={toggleAll}
                aria-label={selectAllLabel}
              />
            </th>
          ) : null}
          {columns.map((col) => (
            <th
              key={col.id}
              className={cn(
                col.hideOnMobile && "rad-mh",
                col.mobileSlot && MOBILE_SLOT_CLASS[col.mobileSlot],
                col.headerClassName
              )}
            >
              {col.header}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, i) => {
          const id = getRowId(row);
          const isSel = selected.has(id);
          return (
            <tr
              key={id}
              tabIndex={0}
              data-id={id}
              className={cn(isSel && "rad-sel")}
              style={{ "--rad-i": i } as CSSProperties}
              onClick={() => onRowClick?.(row)}
              onKeyDown={(e) => onKeyDownRow(e, row)}
            >
              {selectable ? (
                <td className="rad-c1" onClick={(e) => e.stopPropagation()}>
                  <input
                    type="checkbox"
                    className="rad-ck"
                    checked={isSel}
                    onChange={() => toggleOne(id)}
                    aria-label={selectRowLabel?.(row) ?? selectAllLabel}
                  />
                </td>
              ) : null}
              {columns.map((col) => (
                <td
                  key={col.id}
                  className={cn(
                    col.hideOnMobile && "rad-mh",
                    col.mobileSlot && MOBILE_SLOT_CLASS[col.mobileSlot],
                    col.className
                  )}
                >
                  {col.cell(row, i)}
                </td>
              ))}
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
