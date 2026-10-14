"use client";

import {
  useEffect,
  useId,
  useRef,
  type CSSProperties,
  type KeyboardEvent,
} from "react";
import { cn } from "@/lib/utils";
import { Button, type ButtonVariant, type ButtonSize } from "@/components/ui/button";

export type MenuItem = {
  id: string;
  label: string;
  onSelect?: () => void;
  href?: string;
  disabled?: boolean;
  danger?: boolean;
};

type Props = {
  /** Accessible name for the menu. */
  label: string;
  items: readonly MenuItem[];
  /** Visible trigger label (defaults to `label`). */
  triggerLabel?: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
  align?: "start" | "end";
};

type PopoverElement = HTMLDivElement & {
  hidePopover?: () => void;
  showPopover?: () => void;
};

/**
 * P09 — Button + Popover API menu.
 * Arrow keys move, Esc closes (native + handler), Home/End supported. Min width 200.
 */
export function Menu({
  label,
  items,
  triggerLabel,
  variant = "secondary",
  size = "md",
  className,
  align = "start",
}: Props) {
  const reactId = useId().replace(/:/g, "");
  const popoverId = `ro-menu-${reactId}`;
  const anchorName = `--ro-menu-${reactId}`;
  const popoverRef = useRef<PopoverElement>(null);
  const itemRefs = useRef<(HTMLButtonElement | HTMLAnchorElement | null)[]>([]);

  useEffect(() => {
    const el = popoverRef.current;
    if (!el) return;
    function onToggle(e: Event) {
      const t = e as ToggleEvent;
      if (t.newState !== "open") return;
      const first = itemRefs.current.find(
        (node, i) => node && !items[i]?.disabled
      );
      first?.focus();
    }
    el.addEventListener("toggle", onToggle);
    return () => el.removeEventListener("toggle", onToggle);
  }, [items]);

  function close() {
    popoverRef.current?.hidePopover?.();
  }

  function enabledIndexes() {
    return items
      .map((item, i) => (!item.disabled ? i : -1))
      .filter((i) => i >= 0);
  }

  function onMenuKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    const enabled = enabledIndexes();
    if (!enabled.length) return;
    const active = document.activeElement;
    const current = itemRefs.current.findIndex((n) => n === active);
    const posInEnabled =
      current < 0
        ? 0
        : Math.max(0, enabled.findIndex((i) => i === current));

    let nextPos = posInEnabled;
    switch (e.key) {
      case "ArrowDown":
        nextPos = (posInEnabled + 1) % enabled.length;
        break;
      case "ArrowUp":
        nextPos = (posInEnabled - 1 + enabled.length) % enabled.length;
        break;
      case "Home":
        nextPos = 0;
        break;
      case "End":
        nextPos = enabled.length - 1;
        break;
      case "Escape":
        e.preventDefault();
        close();
        return;
      default:
        return;
    }
    e.preventDefault();
    itemRefs.current[enabled[nextPos]!]?.focus();
  }

  function activate(item: MenuItem) {
    if (item.disabled) return;
    item.onSelect?.();
    close();
  }

  const anchorStyle = { anchorName } as CSSProperties;

  return (
    <div className={cn("relative inline-block", className)}>
      <Button
        type="button"
        variant={variant}
        size={size}
        aria-haspopup="menu"
        aria-controls={popoverId}
        aria-label={label}
        popoverTarget={popoverId}
        style={anchorStyle}
      >
        {triggerLabel ?? label}
      </Button>

      <div
        id={popoverId}
        ref={popoverRef}
        popover="auto"
        role="menu"
        aria-label={label}
        onKeyDown={onMenuKeyDown}
        className={cn(
          "ro-menu-popover m-0 min-w-[200px] border border-ro-border bg-ro-paper p-1 text-ro-ink shadow-[var(--ro-e2)]",
          align === "end" && "ro-menu-popover--end"
        )}
        style={
          {
            positionAnchor: anchorName,
          } as CSSProperties
        }
      >
        {items.map((item, index) => {
          const itemClass = cn(
            "flex w-full items-center rounded-[var(--ro-r-xs)] px-3 py-2.5 text-start text-sm outline-none transition-colors duration-[var(--ro-dur-fast)] focus-visible:bg-ro-sunken focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--ro-focus)] disabled:pointer-events-none disabled:opacity-45",
            item.danger
              ? "text-[var(--ro-danger-700)] hover:bg-[var(--ro-danger-100)]"
              : "text-ro-ink hover:bg-ro-sunken"
          );

          if (item.href && !item.disabled) {
            return (
              <a
                key={item.id}
                href={item.href}
                role="menuitem"
                className={itemClass}
                ref={(node) => {
                  itemRefs.current[index] = node;
                }}
                onClick={() => close()}
              >
                {item.label}
              </a>
            );
          }

          return (
            <button
              key={item.id}
              type="button"
              role="menuitem"
              disabled={item.disabled}
              className={itemClass}
              ref={(node) => {
                itemRefs.current[index] = node;
              }}
              onClick={() => activate(item)}
            >
              {item.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/** Alias matching Part 02 naming. */
export const PopoverMenu = Menu;
