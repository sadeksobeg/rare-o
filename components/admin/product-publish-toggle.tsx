"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { adminQuickSetProductStatusAction } from "@/app/actions";

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
        className="rad-btn rad-gh rad-sm"
      >
        {published ? unpublishLabel : publishLabel}
      </button>
      {error ? (
        <p className="text-[0.65rem]" style={{ color: "var(--rad-err)" }} role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
