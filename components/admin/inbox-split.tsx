"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { cn } from "@/lib/utils";

const KEY = "ro-inbox-ctx-w";

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

/** OPS-01 — resize thread | context on xl+. */
export function InboxThreadContextSplit({
  thread,
  context,
  className,
}: {
  thread: ReactNode;
  context: ReactNode;
  className?: string;
}) {
  const shellRef = useRef<HTMLDivElement>(null);
  const [ctxW, setCtxW] = useState(320);
  const dragging = useRef(false);

  useEffect(() => {
    try {
      const c = Number(localStorage.getItem(KEY));
      if (Number.isFinite(c) && c >= 260) setCtxW(clamp(c, 260, 420));
    } catch {
      /* ignore */
    }
  }, []);

  const onMove = useCallback((e: PointerEvent) => {
    const shell = shellRef.current;
    if (!shell || !dragging.current) return;
    const rect = shell.getBoundingClientRect();
    setCtxW(clamp(rect.right - e.clientX, 260, 420));
  }, []);

  const onUp = useCallback(() => {
    if (!dragging.current) return;
    dragging.current = false;
    document.body.style.cursor = "";
    document.body.style.userSelect = "";
    try {
      localStorage.setItem(KEY, String(ctxW));
    } catch {
      /* ignore */
    }
  }, [ctxW]);

  useEffect(() => {
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, [onMove, onUp]);

  return (
    <div
      ref={shellRef}
      className={cn(
        "flex h-full min-h-0 flex-1 flex-col gap-0 xl:grid xl:gap-0",
        className
      )}
      style={
        {
          gridTemplateColumns: `minmax(0,1fr) 8px ${ctxW}px`,
        } as React.CSSProperties
      }
    >
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">{thread}</div>
      <button
        type="button"
        aria-label="Resize context panel"
        className="hidden cursor-col-resize touch-none bg-transparent xl:block"
        onPointerDown={(e) => {
          e.preventDefault();
          dragging.current = true;
          document.body.style.cursor = "col-resize";
          document.body.style.userSelect = "none";
        }}
      />
      <div className="hidden min-h-0 min-w-0 overflow-y-auto xl:block">
        {context}
      </div>
    </div>
  );
}
