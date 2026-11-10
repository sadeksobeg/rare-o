import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type PillTone = "new" | "warn" | "info" | "ok" | "no" | "err";

const TONE_CLASS: Record<PillTone, string> = {
  new: "rad-p-new",
  warn: "rad-p-warn",
  info: "rad-p-info",
  ok: "rad-p-ok",
  no: "rad-p-no",
  err: "rad-p-err",
};

/** Status pill with leading dot — labels passed as children (i18n at call site). */
export function Pill({
  tone = "new",
  children,
  className,
}: {
  tone?: PillTone;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span className={cn("rad-pill", TONE_CLASS[tone], className)}>{children}</span>
  );
}
