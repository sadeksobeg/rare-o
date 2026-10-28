"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useToast } from "@/components/ui/toast";

/** Fires a success toast when a known query flag is present, then strips it. */
export function SavedToast({
  message,
  param = "notesSaved",
}: {
  message: string;
  param?: string;
}) {
  const search = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const { toast } = useToast();
  const fired = useRef<string | null>(null);

  useEffect(() => {
    if (search.get(param) !== "1") {
      fired.current = null;
      return;
    }
    const key = `${pathname}?${param}`;
    if (fired.current === key) return;
    fired.current = key;
    toast({ message, tone: "success" });
    const next = new URLSearchParams(search.toString());
    next.delete(param);
    const qs = next.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }, [search, param, pathname, router, toast, message]);

  return null;
}
