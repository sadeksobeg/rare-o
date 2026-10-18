"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ComponentProps } from "react";
import { cn } from "@/lib/utils";

/**
 * Instant pending affordance on soft navigation — does not block the Link.
 * Clears when the pathname catches up.
 */
export function PendingNavLink({
  href,
  className,
  children,
  onClick,
  ...rest
}: ComponentProps<typeof Link>) {
  const pathname = usePathname();
  const [pending, setPending] = useState(false);
  const hrefPath = typeof href === "string" ? href.split("?")[0] : href.pathname;

  useEffect(() => {
    setPending(false);
  }, [pathname]);

  return (
    <Link
      href={href}
      {...rest}
      aria-busy={pending || undefined}
      data-pending={pending ? "true" : undefined}
      className={cn(
        "ro-portal-nav-link relative active:scale-[0.98] motion-reduce:active:scale-100",
        className
      )}
      onClick={(e) => {
        onClick?.(e);
        if (e.defaultPrevented) return;
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) {
          return;
        }
        if (hrefPath && pathname !== hrefPath) setPending(true);
      }}
    >
      {children}
    </Link>
  );
}
