"use client";

import { useEffect, useState, type ComponentType } from "react";

type ToastProps = { message: string; param?: string };

/**
 * Loads SavedToast after mount so AdminShell never statically binds
 * a useSearchParams module (webpack `undefined.call` in the shell).
 */
export function SavedToastMount({ message, param }: ToastProps) {
  const [Comp, setComp] = useState<ComponentType<ToastProps> | null>(null);

  useEffect(() => {
    let live = true;
    void import("./saved-toast")
      .then((mod) => {
        const next = mod?.SavedToast;
        if (live && typeof next === "function") setComp(() => next);
      })
      .catch(() => {
        /* keep silent — save still shows inline status on the record */
      });
    return () => {
      live = false;
    };
  }, []);

  if (!Comp) return null;
  return <Comp message={message} param={param} />;
}
