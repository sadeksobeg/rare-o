"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { respondToOrderAction } from "@/app/order-actions";
import type { Locale } from "@/lib/i18n/config";

const T = (l: Locale, ar: string, en: string) => (l === "ar" ? ar : en);

const ERR: Record<string, [string, string]> = {
  NOTE_REQUIRED: ["اكتب التعديل المطلوب", "Write the change you need"],
  REQUEST_CLOSED: ["هذا الطلب مُغلق", "This request is closed"],
  RATE_LIMITED: ["محاولات كثيرة، أعد المحاولة بعد قليل", "Too many attempts, try again shortly"],
};

export function OrderResponse({
  token,
  locale,
  disabled,
}: {
  token: string;
  locale: Locale;
  disabled: boolean;
}) {
  const router = useRouter();
  const [mode, setMode] = useState<"idle" | "changes">("idle");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function send(response: "confirmed" | "changes_requested") {
    setError(null);
    const fd = new FormData();
    fd.set("token", token);
    fd.set("response", response);
    fd.set("note", note);
    start(async () => {
      const res = await respondToOrderAction(fd);
      if (!res.ok) {
        const m = ERR[res.error];
        setError(m ? T(locale, m[0], m[1]) : T(locale, "تعذّر الإرسال", "Could not send"));
        return;
      }
      router.refresh();
    });
  }

  if (disabled) return null;
  return (
    <div className="space-y-3">
      {mode === "idle" ? (
        <div className="flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            disabled={pending}
            onClick={() => send("confirmed")}
            className="h-12 flex-1 rounded-[var(--ro-r-sm)] bg-[var(--ro-plum-900)] px-5 text-sm font-semibold text-ro-canvas disabled:opacity-60"
          >
            {T(locale, "أؤكد صحة البيانات", "I confirm my details")}
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={() => setMode("changes")}
            className="h-12 flex-1 rounded-[var(--ro-r-sm)] border border-[var(--ro-border-control)] px-5 text-sm font-semibold text-ro-ink"
          >
            {T(locale, "أحتاج تعديلاً", "I need a change")}
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          <label className="block text-sm font-medium text-ro-ink" htmlFor="order-note">
            {T(locale, "ما التعديل المطلوب؟", "What should we change?")}
          </label>
          <textarea
            id="order-note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={4}
            maxLength={1000}
            className="w-full rounded-[var(--ro-r-sm)] border border-[var(--ro-border-control)] bg-ro-paper px-3 py-2 text-ro-ink"
          />
          <div className="flex gap-2">
            <button
              type="button"
              disabled={pending}
              onClick={() => send("changes_requested")}
              className="h-11 rounded-[var(--ro-r-sm)] bg-[var(--ro-plum-900)] px-5 text-sm font-semibold text-ro-canvas disabled:opacity-60"
            >
              {T(locale, "إرسال التعديل", "Send change")}
            </button>
            <button
              type="button"
              onClick={() => setMode("idle")}
              className="h-11 rounded-[var(--ro-r-sm)] border border-[var(--ro-border-control)] px-4 text-sm"
            >
              {T(locale, "رجوع", "Back")}
            </button>
          </div>
        </div>
      )}
      {error ? (
        <p role="alert" className="text-sm text-[var(--ro-danger-700)]">
          {error}
        </p>
      ) : null}
    </div>
  );
}
