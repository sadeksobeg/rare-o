"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { claimPaymentAction } from "@/app/order-actions";
import type { Locale } from "@/lib/i18n/config";

/** Prepaid orders: the customer tells us the payment was sent; the team then confirms receipt. */
export function PaymentClaim({
  token,
  locale,
  claimed,
}: {
  token: string;
  locale: Locale;
  claimed: boolean;
}) {
  const ar = locale === "ar";
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState(false);
  return (
    <div className="rounded-2xl border border-[var(--ro-border-control)] bg-ro-paper p-4 text-sm">
      <p className="font-semibold text-ro-ink">
        {claimed
          ? ar
            ? "وصلنا إشعارك بالدفع — بانتظار تأكيد الفريق لاستلام الدفعة"
            : "We got your payment notice — waiting for the team to confirm receipt"
          : ar
            ? "طلبك بنظام الدفع المسبق"
            : "Your request is paid in advance"}
      </p>
      {!claimed ? (
        <>
          <p className="mt-1 text-ro-text-2">
            {ar
              ? "بعد إتمام الدفع حسب المتفق عليه اضغط الزر ليصلنا إشعار فوري."
              : "After paying as agreed, tap the button so we are notified instantly."}
          </p>
          <button
            type="button"
            disabled={pending}
            onClick={() =>
              start(async () => {
                setError(false);
                const res = await claimPaymentAction(token);
                if (!res.ok) return void setError(true);
                router.refresh();
              })
            }
            className="mt-3 h-11 rounded-[var(--ro-r-sm)] bg-[var(--ro-plum-900)] px-5 text-sm font-semibold text-ro-canvas disabled:opacity-60"
          >
            {ar ? "أرسلتُ الدفعة" : "I have paid"}
          </button>
          {error ? (
            <p role="alert" className="mt-2 text-ro-text-2">
              {ar ? "تعذّر الإرسال، أعد المحاولة" : "Could not send, try again"}
            </p>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
