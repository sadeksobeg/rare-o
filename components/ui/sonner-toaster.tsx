"use client";

import { Toaster } from "sonner";

/**
 * Bottom-end toasts — never cover the inbox composer (bottom-center did).
 * Offset clears the composer + safe area.
 */
export function SonnerToaster() {
  return (
    <Toaster
      position="bottom-right"
      offset={88}
      expand
      gap={12}
      visibleToasts={4}
      duration={7000}
      closeButton
      theme="system"
      toastOptions={{
        className: "font-[family-name:var(--font-plex-ar),sans-serif] rad-toast",
      }}
    />
  );
}
