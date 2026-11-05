"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { cn } from "@/lib/utils";

const LIST_KEY = "ro-inbox-list-w";
const CTX_KEY = "ro-inbox-ctx-w";

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

/**
 * OPS-01 — desktop three-pane shell with drag-resizable list + context columns.
 * Mobile keeps stacked / sequential screens from existing CSS.
 */
export function InboxResizablePanes({
  list,
  main,
  context,
  className,
}: {
  list: ReactNode;
  main: ReactNode;
  context?: ReactNode;
  className?: string;
}) {
  const shellRef = useRef<HTMLDivElement>(null);
  const [listW, setListW] = useState(420);
  const [ctxW, setCtxW] = useState(300);
  const drag = useRef<"list" | "ctx" | null>(null);

  useEffect(() => {
    try {
      const l = Number(localStorage.getItem(LIST_KEY));
      const c = Number(localStorage.getItem(CTX_KEY));
      if (Number.isFinite(l) && l >= 280) setListW(clamp(l, 280, 560));
      if (Number.isFinite(c) && c >= 260) setCtxW(clamp(c, 260, 420));
    } catch {
      /* ignore */
    }
  }, []);

  const onMove = useCallback((e: PointerEvent) => {
    const shell = shellRef.current;
    if (!shell || !drag.current) return;
    const rect = shell.getBoundingClientRect();
    const rtl = getComputedStyle(shell).direction === "rtl";
    if (drag.current === "list") {
      const next = rtl
        ? clamp(rect.right - e.clientX, 280, 560)
        : clamp(e.clientX - rect.left, 280, 560);
      setListW(next);
    } else {
      const next = rtl
        ? clamp(e.clientX - rect.left, 260, 420)
        : clamp(rect.right - e.clientX, 260, 420);
      setCtxW(next);
    }
  }, []);

  const onUp = useCallback(() => {
    if (!drag.current) return;
    const which = drag.current;
    drag.current = null;
    document.body.style.cursor = "";
    document.body.style.userSelect = "";
    try {
      if (which === "list") localStorage.setItem(LIST_KEY, String(listW));
      if (which === "ctx") localStorage.setItem(CTX_KEY, String(ctxW));
    } catch {
      /* ignore */
    }
  }, [listW, ctxW]);

  useEffect(() => {
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, [onMove, onUp]);

  function start(which: "list" | "ctx") {
    drag.current = which;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  }

  const hasContext = Boolean(context);

  return (
    <div
      ref={shellRef}
      data-inbox-panes=""
      className={cn(
        "grid min-h-0 flex-1 grid-rows-[minmax(0,1fr)] gap-0 overflow-hidden border-t border-[color:var(--ro-border-subtle)] bg-[color:var(--ro-bg-raised)] lg:gap-0",
        hasContext
          ? "lg:grid-cols-[var(--ro-inbox-list)_8px_minmax(0,1fr)_8px_var(--ro-inbox-ctx)]"
          : "lg:grid-cols-[var(--ro-inbox-list)_8px_minmax(0,1fr)]",
        className
      )}
      style={
        {
          "--ro-inbox-list": `${listW}px`,
          "--ro-inbox-ctx": hasContext ? `${ctxW}px` : "0px",
        } as CSSProperties
      }
    >
      <div className="flex h-full min-h-0 min-w-0 flex-col overflow-hidden lg:pe-0">
        {list}
      </div>
      <button
        type="button"
        aria-label="Resize conversation list"
        className="hidden cursor-col-resize touch-none border-e border-[color:var(--ro-border-subtle)] bg-[color:var(--ro-border-subtle)] opacity-60 transition-opacity hover:opacity-100 lg:block"
        onPointerDown={(e) => {
          e.preventDefault();
          start("list");
        }}
      />
      <div className="flex h-full min-h-0 min-w-0 flex-col overflow-hidden bg-[color:var(--ro-bg-sunken)]">
        {main}
      </div>
      {hasContext ? (
        <>
          <button
            type="button"
            aria-label="Resize context panel"
            className="hidden cursor-col-resize touch-none border-e border-[color:var(--ro-border-subtle)] bg-[color:var(--ro-border-subtle)] opacity-60 transition-opacity hover:opacity-100 xl:block"
            onPointerDown={(e) => {
              e.preventDefault();
              start("ctx");
            }}
          />
          <div className="hidden min-h-0 min-w-0 overflow-y-auto border-s border-[color:var(--ro-border-subtle)] bg-[color:var(--ro-bg-raised)] xl:block">
            {context}
          </div>
        </>
      ) : null}
    </div>
  );
}
