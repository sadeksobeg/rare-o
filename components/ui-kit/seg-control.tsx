"use client";

import {
  useCallback,
  useLayoutEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
  type UIEvent,
} from "react";
import { cn } from "@/lib/utils";

export type SegItem = {
  value: string;
  label: ReactNode;
  /** Optional count rendered in <em> (tabular nums). */
  count?: number | string;
  disabled?: boolean;
};

/**
 * Sliding-indicator segmented control.
 * Indicator placement mirrors HTML placeInd: physical `left:0` +
 * `translateX(offsetLeft)` so RTL does not double-flip.
 * Tabs never wrap — horizontal scroll with edge fades.
 */
export function SegControl({
  items,
  value,
  onChange,
  "aria-label": ariaLabel,
  className,
}: {
  items: SegItem[];
  value: string;
  onChange: (value: string) => void;
  "aria-label": string;
  className?: string;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [fade, setFade] = useState({ start: false, end: false });

  const placeInd = useCallback(() => {
    const root = rootRef.current;
    if (!root) return;
    const on = root.querySelector<HTMLElement>("button[data-on='true']");
    const ind = root.querySelector<HTMLElement>(".rad-ind");
    if (!on || !ind) return;
    ind.style.width = `${on.offsetWidth}px`;
    ind.style.insetInlineStart = "auto";
    ind.style.left = "0";
    ind.style.transform = `translateX(${on.offsetLeft}px)`;
  }, []);

  const updateFade = useCallback(() => {
    const root = rootRef.current;
    if (!root) return;
    const max = root.scrollWidth - root.clientWidth;
    if (max <= 1) {
      setFade({ start: false, end: false });
      return;
    }
    const sl = root.scrollLeft;
    // RTL browsers may use negative scrollLeft
    const atStart = Math.abs(sl) < 2;
    const atEnd = Math.abs(sl) >= max - 2;
    const rtl = getComputedStyle(root).direction === "rtl";
    if (rtl) {
      setFade({ start: !atStart, end: !atEnd });
    } else {
      setFade({ start: !atStart, end: !atEnd });
    }
  }, []);

  const sync = useCallback(() => {
    placeInd();
    updateFade();
  }, [placeInd, updateFade]);

  useLayoutEffect(() => {
    sync();
  }, [sync, value, items]);

  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const ro = new ResizeObserver(() => sync());
    ro.observe(root);
    if (wrapRef.current) ro.observe(wrapRef.current);
    window.addEventListener("resize", sync);
    document.fonts?.ready?.then(sync).catch(() => {});
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", sync);
    };
  }, [sync]);

  const onScroll = (_e: UIEvent<HTMLDivElement>) => {
    sync();
  };

  const focusIndex = (idx: number) => {
    const buttons =
      rootRef.current?.querySelectorAll<HTMLButtonElement>("button[role='tab']");
    buttons?.[idx]?.focus();
  };

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const enabled = items.filter((i) => !i.disabled);
    const current = enabled.findIndex((i) => i.value === value);
    if (current < 0) return;
    const dir = document.documentElement.dir === "rtl" ? -1 : 1;
    let next = current;
    if (e.key === "ArrowRight") next = current + dir;
    else if (e.key === "ArrowLeft") next = current - dir;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = enabled.length - 1;
    else return;
    e.preventDefault();
    next = Math.max(0, Math.min(enabled.length - 1, next));
    const item = enabled[next];
    if (!item) return;
    onChange(item.value);
    focusIndex(items.findIndex((i) => i.value === item.value));
  };

  return (
    <div
      ref={wrapRef}
      className={cn("rad-seg-wrap", className)}
      data-fade-start={fade.start ? "true" : undefined}
      data-fade-end={fade.end ? "true" : undefined}
    >
      <div
        ref={rootRef}
        className="rad-seg rad-seg-scroll"
        role="tablist"
        aria-label={ariaLabel}
        onKeyDown={onKeyDown}
        onScroll={onScroll}
      >
        <span className="rad-ind" aria-hidden />
        {items.map((item) => {
          const selected = item.value === value;
          return (
            <button
              key={item.value}
              type="button"
              role="tab"
              aria-selected={selected}
              data-on={selected ? "true" : undefined}
              data-v={item.value}
              disabled={item.disabled}
              className={cn(selected && "rad-on")}
              onClick={() => onChange(item.value)}
            >
              {item.label}
              {item.count != null ? (
                <em className="rad-num">{item.count}</em>
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}
