"use client";

import type { ReactNode } from "react";
import { PageEnter } from "@/components/motion/page-enter";

/**
 * Soft opacity enter for admin main.
 * Do not clip with overflow-hidden — list pages must scroll inside #main-content.
 * Inbox fills/clips via CSS `:has([data-admin-inbox])` on this wrapper.
 */
export function AdminMainEnter({ children }: { children: ReactNode }) {
  return (
    <PageEnter className="flex w-full min-h-0 flex-1 flex-col">
      {children}
    </PageEnter>
  );
}
