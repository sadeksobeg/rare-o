import { cn } from "@/lib/utils";
import type { StatusTone } from "@/lib/ui/status";

const toneClass: Record<StatusTone, string> = {
  neutral: "border-[var(--ro-sand-400)] bg-[var(--ro-sand-300)] text-[var(--ro-ink-600)]",
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

export function Banner({
  tone = "info",
  children,
  className,
  alert = false,
}: {
  tone?: StatusTone;
  children: React.ReactNode;
  className?: string;
  alert?: boolean;
}) {
  return (
    <div
      role={alert ? "alert" : "status"}
      className={cn(
        "rounded-[var(--ro-r-sm)] border px-4 py-3 text-sm",
        toneClass[tone],
        className
      )}
    >
      {children}
    </div>
  );
}
