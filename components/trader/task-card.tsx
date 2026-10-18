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
        "ro-portal-card group flex min-h-24 items-center gap-4 border px-5 py-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ro-focus)]",
        className
      )}
    >
      <span className="flex size-12 shrink-0 items-center justify-center bg-[var(--ro-plum-100)] text-[var(--ro-plum-900)] shadow-[inset_0_1px_0_color-mix(in_srgb,var(--ro-sand-50)_55%,transparent)] transition-transform duration-[var(--ro-dur-fast)] group-hover:scale-105 group-active:scale-100">
        <Icon className="size-5" aria-hidden />
      </span>
      <span className="min-w-0 flex-1">
        <span className="font-display block text-lg font-semibold leading-snug transition-colors group-hover:text-[var(--ro-plum-900)]">
          {title}
        </span>
        <span className="mt-1 block text-sm text-ro-muted">{body}</span>
      </span>
      <ChevronRight
        className="size-5 shrink-0 text-[var(--ro-plum-800)] transition-transform duration-[var(--ro-dur-fast)] group-hover:translate-x-1 rtl:rotate-180 rtl:group-hover:-translate-x-1"
        aria-hidden
      />
    </Link>
  );
}
