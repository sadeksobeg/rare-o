"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui-kit/modal";
import { Check, Copy } from "lucide-react";

/**
 * Dev-only fixture: traders dialogs + one-time temp password state.
 * No real submit — for Round 6 evidence captures only.
 */
export default function DevTradersDialogsPage() {
  const [createOpen, setCreateOpen] = useState(false);
  const [disableOpen, setDisableOpen] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const [tempOpen, setTempOpen] = useState(false);
  const [acked, setAcked] = useState(false);
  const [copied, setCopied] = useState(false);

  return (
    <section className="space-y-6 p-6" data-dev-traders-dialogs="">
      <h1 className="text-lg font-semibold" style={{ color: "var(--rad-tx)" }}>
        تجّار — نوافذ /dev
      </h1>
      <div className="flex flex-wrap gap-3">
        <Button type="button" size="sm" onClick={() => setCreateOpen(true)}>
          إنشاء تاجر
        </Button>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => setDisableOpen(true)}
        >
          تعطيل
        </Button>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => setResetOpen(true)}
        >
          إعادة تعيين كلمة المرور
        </Button>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => {
            setTempOpen(true);
            setAcked(false);
            setCopied(false);
          }}
        >
          كلمة مرور مؤقتة
        </Button>
      </div>

      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="إنشاء تاجر"
        actions={
          <>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setCreateOpen(false)}
            >
              إلغاء
            </Button>
            <Button type="button" size="sm" onClick={() => setCreateOpen(false)}>
              إنشاء
            </Button>
          </>
        }
      >
        <p className="text-sm text-[color:var(--rad-tx2)]">
          نموذج وهمي — لا يُرسل.
        </p>
      </Modal>

      <Modal
        open={disableOpen}
        onClose={() => setDisableOpen(false)}
        title="تعطيل التاجر"
        actions={
          <>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setDisableOpen(false)}
            >
              إلغاء
            </Button>
            <Button
              type="button"
              variant="danger"
              size="sm"
              onClick={() => setDisableOpen(false)}
            >
              تعطيل
            </Button>
          </>
        }
      >
        <p className="text-sm text-[color:var(--rad-tx2)]">
          تأكيد وهمي — لا يُرسل.
        </p>
      </Modal>

      <Modal
        open={resetOpen}
        onClose={() => setResetOpen(false)}
        title="إعادة تعيين كلمة المرور"
        actions={
          <>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setResetOpen(false)}
            >
              إلغاء
            </Button>
            <Button type="button" size="sm" onClick={() => setResetOpen(false)}>
              إعادة تعيين
            </Button>
          </>
        }
      >
        <p className="text-sm text-[color:var(--rad-tx2)]">
          تأكيد وهمي — لا يُرسل.
        </p>
      </Modal>

      <Modal
        open={tempOpen}
        onClose={() => {
          if (acked) setTempOpen(false);
        }}
        title="كلمة مرور مؤقتة"
        actions={
          <Button
            type="button"
            size="sm"
            disabled={!acked}
            onClick={() => setTempOpen(false)}
          >
            إغلاق
          </Button>
        }
      >
        <div className="space-y-4">
          <p className="text-sm text-[color:var(--rad-tx2)]">
            تُعرض مرة واحدة فقط — احفظها الآن. (واجهة /dev بلا إرسال حقيقي)
          </p>
          <p className="text-sm" dir="ltr">
            fixture.trader@example.com
          </p>
          <p
            className="rounded-[11px] border border-[color:var(--rad-bd)] bg-[color:var(--rad-surface3)] px-3 py-2 font-mono text-sm tracking-wide text-[color:var(--rad-tx)]"
            dir="ltr"
          >
            Tmp-Fxtr-9Kx2
          </p>
          <Button
            type="button"
            size="sm"
            variant="secondary"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText("Tmp-Fxtr-9Kx2");
                setCopied(true);
              } catch {
                setCopied(false);
              }
            }}
          >
            {copied ? (
              <Check className="size-3.5" strokeWidth={1.5} aria-hidden />
            ) : (
              <Copy className="size-3.5" strokeWidth={1.5} aria-hidden />
            )}
            {copied ? "تم النسخ" : "نسخ"}
          </Button>
          <label className="flex items-start gap-2 text-sm text-[color:var(--rad-tx)]">
            <input
              type="checkbox"
              checked={acked}
              onChange={(e) => setAcked(e.target.checked)}
              className="mt-1 accent-[var(--rad-ac)]"
            />
            <span>حفظتُ كلمة المرور ولن تظهر مرة أخرى</span>
          </label>
        </div>
      </Modal>
    </section>
  );
}
