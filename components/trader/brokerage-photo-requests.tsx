"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Camera, CheckCircle2, Send } from "lucide-react";
import { traderSubmitBrokeragePhotosAction } from "@/app/brokerage-actions";
import type { ActionResult } from "@/app/actions";
import { PhotoUploader } from "@/components/brokerage/photo-uploader";
import { BrokeragePhotoGallery } from "@/components/brokerage/photo-gallery";
import { toastOk } from "@/lib/portal/toast";

export type PhotoBatchView = {
  id: string;
  note: string;
  requestedBy: string;
  traderNote: string;
  photos: string[];
  fulfilled: boolean;
  createdAt: string;
};

const initial: ActionResult | null = null;

function UploadForm({
  requestId,
  batch,
  title,
  hint,
}: {
  requestId: string;
  batch: PhotoBatchView | null;
  title: string;
  hint?: string;
}) {
  const router = useRouter();
  const [state, action, pending] = useActionState(traderSubmitBrokeragePhotosAction, initial);
  const [resetKey, setResetKey] = useState(0);

  useEffect(() => {
    if (state?.ok) {
      toastOk("وصلت الصور إلى فريق RARE OUD");
      setResetKey((k) => k + 1);
      router.refresh();
    }
  }, [state, router]);

  return (
    <form action={action} encType="multipart/form-data" className="space-y-4">
      <input type="hidden" name="id" value={requestId} />
      {batch ? <input type="hidden" name="photoRequestId" value={batch.id} /> : null}
      <div>
        <h3 className="flex items-center gap-2 text-base font-bold text-[color:var(--rad-tx)]">
          <Camera className="size-5 text-[var(--rad-ac,#8a52c4)]" aria-hidden /> {title}
        </h3>
        {hint ? <p className="mt-1 text-sm leading-relaxed text-[color:var(--rad-tx2)]">{hint}</p> : null}
      </div>
      <PhotoUploader resetKey={resetKey} />
      <label className="block space-y-1.5 text-sm font-semibold">
        <span className="text-[color:var(--rad-tx2)]">ملاحظة مع الصور (اختياري)</span>
        <textarea
          name="note"
          rows={2}
          maxLength={1000}
          className="w-full rounded-[12px] border border-[color:var(--rad-bd2)] bg-[color:var(--rad-surface)] px-3 py-2.5 text-sm"
          placeholder="مثال: الصورة الثالثة توضح الختم من الداخل"
        />
      </label>
      {state && !state.ok ? (
        <p role="alert" className="text-sm font-semibold text-[color:var(--ro-danger-700)]">
          {state.error}
        </p>
      ) : null}
      <button type="submit" disabled={pending} className="rad-btn rad-pri inline-flex items-center gap-2">
        <Send className="size-4" aria-hidden /> {pending ? "جارٍ الإرسال…" : "إرسال الصور للفريق"}
      </button>
    </form>
  );
}

/**
 * Trader side of the photo stage: what RARE OUD asked for, an upload form per open request,
 * a way to send extra photos at any time, and the history of what was sent.
 */
export function BrokeragePhotoRequests({
  requestId,
  batches,
  canSend,
}: {
  requestId: string;
  batches: PhotoBatchView[];
  canSend: boolean;
}) {
  const open = batches.filter((b) => !b.fulfilled && b.requestedBy === "admin");
  const sent = batches.filter((b) => b.fulfilled);
  const [extra, setExtra] = useState(false);

  return (
    <div className="space-y-4">
      {canSend
        ? open.map((b) => (
            <section
              key={b.id}
              className="rounded-3xl border p-5 sm:p-6"
              style={{
                borderColor: "color-mix(in srgb, #e0a030 55%, var(--rad-bd))",
                background: "linear-gradient(160deg, color-mix(in srgb, #e0a030 12%, var(--rad-surface, transparent)), var(--rad-surface, transparent))",
              }}
              aria-label="صور مطلوبة منك"
            >
              <p className="mb-3 inline-flex items-center gap-2 rounded-full bg-[rgba(224,160,48,.2)] px-3 py-1 text-xs font-bold text-[#c98a1a]">
                مطلوب منك الآن
              </p>
              <div className="mb-4 rounded-2xl bg-black/5 p-4 text-sm leading-relaxed text-[color:var(--rad-tx)]">
                <b className="block text-[13px] text-[color:var(--rad-tx2)]">ما نحتاج أن نراه:</b>
                {b.note}
              </div>
              <UploadForm requestId={requestId} batch={b} title="ارفع الصور المطلوبة" />
            </section>
          ))
        : null}

      {canSend ? (
        <section className="rad-card p-5">
          {extra ? (
            <UploadForm
              requestId={requestId}
              batch={null}
              title="إرسال صور إضافية"
              hint="أضف أي صور تساعدنا في المعاينة أو الشراء — تصلنا فوراً."
            />
          ) : (
            <button type="button" className="rad-btn rad-gh inline-flex items-center gap-2" onClick={() => setExtra(true)}>
              <Camera className="size-4" aria-hidden /> إرسال صور إضافية
            </button>
          )}
        </section>
      ) : null}

      {sent.length > 0 ? (
        <section className="rad-card space-y-4 p-5">
          <h3 className="text-base font-bold text-[color:var(--rad-tx)]">الصور التي أرسلتها</h3>
          {sent.map((b) => (
            <div key={b.id} className="space-y-2">
              <p className="flex items-center gap-2 text-sm text-[color:var(--rad-tx2)]">
                <CheckCircle2 className="size-4 text-[#2e9d6a]" aria-hidden />
                {b.requestedBy === "admin" ? `ردّاً على: ${b.note}` : "صور أرسلتها بمبادرتك"}
                <span className="text-xs opacity-60">· {b.createdAt}</span>
              </p>
              {b.traderNote ? <p className="text-sm text-[color:var(--rad-tx)]">«{b.traderNote}»</p> : null}
              <BrokeragePhotoGallery paths={b.photos} title="" />
            </div>
          ))}
        </section>
      ) : null}
    </div>
  );
}
