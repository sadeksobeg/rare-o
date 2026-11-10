"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { CircleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/** P14 — EmptyState layout with alert icon, retry, optional contact link. */
export function ErrorState({
  title,
  body,
  retryLabel,
  onRetry,
  contactHref,
  contactLabel,
  className,
  compact,
}: {
  title: string;
  body?: string;
  retryLabel: string;
  /** Defaults to `router.refresh()`. */
  onRetry?: () => void;
  contactHref?: string;
  contactLabel?: string;
  className?: string;
  compact?: boolean;
}) {
  const router = useRouter();

  return (
    <div
      role="alert"
      className={cn(
        "ro-portal-card flex flex-col items-center border text-center",
        compact ? "px-4 py-8" : "px-6 py-16",
        className
      )}
    >
      <div
        className={cn(
          "mb-4 text-[var(--ro-danger-700)]",
          "ro-portal-icon-well size-14 [&>svg]:size-7"
        )}
      >
        <CircleAlert className="size-7" strokeWidth={1.5} aria-hidden />
      </div>
      <h3 className="ro-portal-section-title">{title}</h3>
      {body ? (
        <p className="ro-portal-muted mt-2 max-w-md text-sm">{body}</p>
      ) : null}
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <Button
          type="button"
          variant="primary"
          size="sm"
          onClick={() => (onRetry ? onRetry() : router.refresh())}
        >
          {retryLabel}
        </Button>
        {contactHref && contactLabel ? (
          <Link
            href={contactHref}
            className="inline-flex min-h-11 items-center border border-ro-line px-4 text-sm font-medium text-ro-plum hover:bg-ro-sunken"
          >
            {contactLabel}
          </Link>
        ) : null}
      </div>
    </div>
  );
}
