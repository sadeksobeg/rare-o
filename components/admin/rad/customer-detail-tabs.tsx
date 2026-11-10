"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { SegControl } from "@/components/ui-kit";

export function CustomerDetailTabs({
  customerId,
  tab,
  counts,
  labels,
}: {
  customerId: string;
  tab: string;
  counts: {
    overview: number;
    requests: number;
    conversations: number;
    notes: number;
  };
  labels: {
    aria: string;
    overview: string;
    requests: string;
    conversations: string;
    notes: string;
  };
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();

  return (
    <SegControl
      aria-label={labels.aria}
      className="mb-4 w-full max-w-full"
      value={tab}
      onChange={(value) => {
        const params = new URLSearchParams();
        if (value !== "overview") params.set("tab", value);
        const qs = params.toString();
        startTransition(() => {
          router.push(
            qs
              ? `/admin/customers/${customerId}?${qs}`
              : `/admin/customers/${customerId}`
          );
        });
      }}
      items={[
        {
          value: "overview",
          label: labels.overview,
          count: counts.overview || undefined,
        },
        {
          value: "requests",
          label: labels.requests,
          count: counts.requests,
        },
        {
          value: "conversations",
          label: labels.conversations,
          count: counts.conversations,
        },
        {
          value: "notes",
          label: labels.notes,
          count: counts.notes || undefined,
        },
      ]}
    />
  );
}
