import { cn } from "@/lib/utils";
import type { StatusTone } from "@/lib/ui/status";

const toneClass: Record<StatusTone, string> = {
  neutral: "bg-[var(--ro-sand-300)] text-[var(--ro-ink-600)]",
  info: "bg-[var(--ro-plum-100)] text-[var(--ro-plum-900)]",
  progress: "bg-[var(--ro-progress-100)] text-[var(--ro-progress-700)]",
  attention: "bg-[var(--ro-amber-100)] text-[var(--ro-amber-800)]",
  success: "bg-[var(--ro-success-100)] text-[var(--ro-success-700)]",
  danger: "bg-[var(--ro-danger-100)] text-[var(--ro-danger-700)]",
  closed: "bg-[#E6E0EA] text-[var(--ro-ink-500)]",
};

export function StatusChip({
  tone,
  label,
  icon,
  size = "md",
  className,
}: {
  tone: StatusTone;
  label: string;
  icon?: React.ReactNode;
  size?: "sm" | "md";
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-[var(--ro-r-sm)] font-medium",
        size === "sm" ? "h-[22px] px-2 text-xs" : "h-7 px-2.5 text-xs",
        toneClass[tone],
        className
      )}
    >
      {icon}
      <span>{label}</span>
    </span>
  );
}
