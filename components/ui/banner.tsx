import { cn } from "@/lib/utils";
import type { StatusTone } from "@/lib/ui/status";
import { CircleAlert, Info, CheckCircle2 } from "lucide-react";

const toneClass: Record<StatusTone, string> = {
  neutral:
    "border-[var(--ro-sand-400)] bg-[var(--ro-sand-300)] text-[var(--ro-ink-600)]",
  info: "border-[var(--ro-plum-100)] bg-[var(--ro-plum-50)] text-[var(--ro-plum-900)]",
  progress:
    "border-[var(--ro-progress-100)] bg-[var(--ro-progress-100)] text-[var(--ro-progress-700)]",
  attention:
    "border-[var(--ro-amber-100)] bg-[var(--ro-amber-100)] text-[var(--ro-amber-800)]",
  success:
    "border-[var(--ro-success-100)] bg-[var(--ro-success-100)] text-[var(--ro-success-700)]",
  danger:
    "border-[var(--ro-danger-100)] bg-[var(--ro-danger-100)] text-[var(--ro-danger-700)]",
  closed: "border-[#E6E0EA] bg-[#E6E0EA] text-[var(--ro-ink-500)]",
};

/** P21 — tone + icon + message + optional action; role=alert for danger/errors. */
export function Banner({
  tone = "info",
  children,
  className,
  alert,
  action,
}: {
  tone?: StatusTone;
  children: React.ReactNode;
  className?: string;
  /** Force alert role; defaults true for `danger`. */
  alert?: boolean;
  action?: React.ReactNode;
}) {
  const asAlert = alert ?? tone === "danger";
  const Icon =
    tone === "danger" || tone === "attention"
      ? CircleAlert
      : tone === "success"
        ? CheckCircle2
        : Info;

  return (
    <div
      role={asAlert ? "alert" : "status"}
      className={cn(
        "flex items-start gap-3 rounded-[var(--ro-r-sm)] border px-4 py-3 text-sm",
        toneClass[tone],
        className
      )}
    >
      <Icon className="mt-0.5 size-4 shrink-0" strokeWidth={1.5} aria-hidden />
      <div className="min-w-0 flex-1">{children}</div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
