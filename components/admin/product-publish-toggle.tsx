"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { adminQuickSetProductStatusAction } from "@/app/actions";
import { cn } from "@/lib/utils";

export function ProductPublishToggle({
  productId,
  published,
  publishLabel,
  unpublishLabel,
  disabledReason,
}: {
  productId: string;
  published: boolean;
  publishLabel: string;
  unpublishLabel: string;
  disabledReason?: string | null;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const canPublish = !disabledReason;

  return (
    <div className="space-y-1">
      <button
        type="button"
        disabled={pending || (published ? false : !canPublish)}
        title={published ? unpublishLabel : disabledReason || publishLabel}
        aria-pressed={published}
        onClick={() => {
          setError(null);
          const fd = new FormData();
          fd.set("productId", productId);
          fd.set("status", published ? "draft" : "published");
          start(async () => {
            const res = await adminQuickSetProductStatusAction(fd);
            if (!res.ok) {
              setError(res.error ?? "Error");
              return;
            }
            router.refresh();
          });
        }}
        className={cn(
          "inline-flex h-9 min-w-11 items-center justify-center rounded-full px-3 text-xs font-semibold transition-opacity",
          published
            ? "bg-[var(--ro-success-100)] text-[var(--ro-success-700)]"
            : "bg-[var(--ro-sand-200)] text-ro-muted",
          pending ? "opacity-60" : "hover:opacity-90"
        )}
      >
        {published ? unpublishLabel : publishLabel}
      </button>
      {error ? (
        <p className="text-[0.65rem] text-[var(--ro-danger-700)]" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
