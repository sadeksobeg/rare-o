"use client";

import { RouteError } from "@/components/ui/route-error";

export default function DevForce500Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <RouteError error={error} reset={reset} homeHref="/admin" />;
}
