"use client";

import { Toaster } from "sonner";

/** Optional Sonner mount for lab-port surfaces. Existing AppToast remains default. */
export function SonnerToaster() {
  return (
    <Toaster
      position="bottom-center"
      richColors
      closeButton
      theme="light"
      toastOptions={{
        className: "font-[family-name:var(--font-plex-ar),sans-serif]",
      }}
    />
  );
}
