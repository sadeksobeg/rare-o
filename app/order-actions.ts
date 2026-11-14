"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { consumeRateLimit } from "@/lib/auth/public-rate-limit";
import { submitCustomerPaymentClaim, submitCustomerResponse } from "@/lib/retail-request/order-page";

export type OrderResponseResult = { ok: true } | { ok: false; error: string };

/** Public: the customer confirms their request or asks for a change. Token-gated + rate limited. */
export async function respondToOrderAction(formData: FormData): Promise<OrderResponseResult> {
  const h = await headers();
  const ip =
    h.get("x-forwarded-for")?.split(",")[0]?.trim().slice(0, 64) ||
    h.get("x-real-ip")?.trim().slice(0, 64) ||
    "anon";
  const limited = consumeRateLimit({ scope: "order-response", identity: ip, max: 10, windowMs: 60_000 });
  if (!limited.allowed) return { ok: false, error: "RATE_LIMITED" };

  const token = String(formData.get("token") || "");
  const response = String(formData.get("response") || "");
  if (response !== "confirmed" && response !== "changes_requested") {
    return { ok: false, error: "VALIDATION" };
  }
  const res = await submitCustomerResponse({
    token,
    response,
    note: String(formData.get("note") || ""),
  });
  if (res.ok) {
    revalidatePath(`/order/${token}`);
    revalidatePath("/admin/requests");
  }
  return res;
}

/** Public: the customer says they sent the advance payment. Token-gated + rate limited. */
export async function claimPaymentAction(token: string): Promise<OrderResponseResult> {
  const h = await headers();
  const ip =
    h.get("x-forwarded-for")?.split(",")[0]?.trim().slice(0, 64) ||
    h.get("x-real-ip")?.trim().slice(0, 64) ||
    "anon";
  const limited = consumeRateLimit({ scope: "order-payment-claim", identity: ip, max: 6, windowMs: 60_000 });
  if (!limited.allowed) return { ok: false, error: "RATE_LIMITED" };
  const res = await submitCustomerPaymentClaim(String(token || ""));
  if (res.ok) revalidatePath(`/order/${token}`);
  return res;
}
