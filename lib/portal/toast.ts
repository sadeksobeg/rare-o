"use client";

import { toast } from "sonner";

/** Shared success toast for portal client actions. */
export function toastOk(message: string) {
  toast.success(message);
}

/** Shared error toast for portal client actions. */
export function toastErr(message: string) {
  toast.error(message);
}

export function toastInfo(message: string) {
  toast.message(message);
}
