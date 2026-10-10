import Link from "next/link";
import { ChevronRight, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function TaskCard({
  href,
  title,
  body,
  icon: Icon,
  className,
}: {
  href: string;
  title: string;
  body: string;
  icon: LucideIcon;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "group flex min-h-24 items-center gap-4 border border-ro-line bg-ro-surface px-5 py-4 transition-colors hover:border-ro-ink/35",
        className
      )}
    >
      <span className="flex size-12 shrink-0 items-center justify-center bg-[var(--ro-plum-100)] text-[var(--ro-plum-900)]">
        <Icon className="size-5" aria-hidden />
      </span>
      <span className="min-w-0 flex-1">
        <span className="font-display block text-lg font-semibold leading-snug">
          {title}
        </span>
        <span className="mt-1 block text-sm text-ro-muted">{body}</span>
      </span>
      <ChevronRight
        className="size-5 shrink-0 text-ro-muted transition-transform group-hover:translate-x-0.5 rtl:rotate-180 rtl:group-hover:-translate-x-0.5"
        aria-hidden
      />
    </Link>
  );
}
