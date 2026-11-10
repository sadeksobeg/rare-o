import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type SettingsNavItem = {
  href: string;
  label: string;
  icon?: ReactNode;
  active?: boolean;
};

/** ui-kit admin-settings.html sgrid: sticky section nav + wide content. */
export function AdminSettingsShell({
  title,
  description,
  breadcrumb,
  nav,
  navLabel,
  children,
  className,
  locale = "ar",
}: {
  title: string;
  description?: string;
  breadcrumb?: Array<{ href?: string; label: string }>;
  nav: SettingsNavItem[];
  navLabel: string;
  children: ReactNode;
  className?: string;
  locale?: string;
}) {
  const Chevron = locale === "ar" ? ChevronLeft : ChevronRight;

  return (
    <section className={cn("ro-portal-stagger space-y-6 pb-16", className)}>
      {breadcrumb && breadcrumb.length > 0 ? (
        <nav
          aria-label="breadcrumb"
          className="flex flex-wrap items-center gap-2 text-sm"
          style={{ color: "var(--rad-tx3)" }}
        >
          {breadcrumb.map((crumb, i) => {
            const last = i === breadcrumb.length - 1;
            return (
              <span key={`${crumb.label}-${i}`} className="inline-flex items-center gap-2">
                {i > 0 ? (
                  <Chevron className="size-3.5 opacity-60" strokeWidth={1.5} aria-hidden />
                ) : null}
                {crumb.href && !last ? (
                  <Link
                    href={crumb.href}
                    className="font-medium underline-offset-4 hover:underline"
                    style={{ color: "var(--rad-tx2)" }}
                  >
                    {crumb.label}
                  </Link>
                ) : (
                  <span
                    className={cn(last && "font-medium")}
                    style={{ color: last ? "var(--rad-tx)" : "var(--rad-tx2)" }}
                  >
                    {crumb.label}
                  </span>
                )}
              </span>
            );
          })}
        </nav>
      ) : null}

      <header className="space-y-1.5 border-b border-[color:var(--rad-bd)] pb-5">
        <h1
          className="text-[1.75rem] font-semibold tracking-tight sm:text-[1.85rem]"
          style={{ color: "var(--rad-tx)", fontFamily: "var(--rad-font, inherit)" }}
        >
          {title}
        </h1>
        {description ? (
          <p className="max-w-2xl text-sm leading-relaxed" style={{ color: "var(--rad-tx2)" }}>
            {description}
          </p>
        ) : null}
      </header>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[230px_minmax(0,1fr)] lg:items-start">
        <nav
          aria-label={navLabel}
          className="flex gap-1 overflow-x-auto lg:sticky lg:top-20 lg:flex-col lg:overflow-visible"
        >
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "inline-flex h-10 shrink-0 items-center gap-2.5 rounded-[10px] px-3 text-sm font-medium transition-colors",
                item.active
                  ? "bg-[color:var(--rad-surface3)] text-[color:var(--rad-tx)]"
                  : "text-[color:var(--rad-tx2)] hover:bg-[color:var(--rad-surface3)] hover:text-[color:var(--rad-tx)]"
              )}
              aria-current={item.active ? "page" : undefined}
            >
              {item.icon ? (
                <span
                  className="inline-flex size-[1.125rem] shrink-0 items-center justify-center [&>svg]:size-[1.125rem]"
                  style={{ color: item.active ? "var(--rad-ac)" : "inherit" }}
                >
                  {item.icon}
                </span>
              ) : null}
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="min-w-0 space-y-5">{children}</div>
      </div>
    </section>
  );
}

export function AdminSettingsCard({
  title,
  action,
  children,
  className,
  id,
}: {
  title?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  id?: string;
}) {
  return (
    <section
      id={id}
      className={cn(
        "rounded-[14px] border border-[color:var(--rad-bd)] bg-[color:var(--rad-surface)] shadow-[var(--rad-sh)]",
        className
      )}
    >
      {title != null || action != null ? (
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 pt-5 sm:px-6">
          {title != null ? (
            <h2
              className="text-[15px] font-semibold"
              style={{ color: "var(--rad-tx)", fontFamily: "var(--rad-font, inherit)" }}
            >
              {title}
            </h2>
          ) : (
            <span />
          )}
          {action}
        </div>
      ) : null}
      <div className="space-y-4 px-5 py-5 sm:px-6">{children}</div>
    </section>
  );
}
