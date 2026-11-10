"use client";

import { useEffect, useState } from "react";
import {
  Check,
  CheckCheck,
  CircleAlert,
  Clock,
  LoaderCircle,
  OctagonX,
  Send,
} from "lucide-react";
import { KillSwitchBannerText } from "@/components/admin/rad/inbox/kill-switch-banner-text";
import { getDictionary } from "@/lib/i18n/dictionaries";

type Frame = "sending" | "sent" | "delivered" | "failed" | "kill";

const FRAME_ORDER: Frame[] = [
  "sending",
  "sent",
  "delivered",
  "failed",
  "kill",
];

const ib = getDictionary("ar").ib;

function Tick({ status }: { status: string }) {
  const props = { width: 14, height: 14, strokeWidth: 1.5 as const };
  switch (status) {
    case "sending":
      return <LoaderCircle {...props} aria-label="sending" />;
    case "pending":
      return <Clock {...props} aria-label="pending" />;
    case "sent":
      return <Check {...props} aria-label="sent" />;
    case "delivered":
      return <CheckCheck {...props} aria-label="delivered" />;
    case "failed":
      return <CircleAlert {...props} aria-label="failed" className="rad-retry-ic" />;
    default:
      return null;
  }
}

/**
 * Renders real inbox chrome classes and steps frames without page reload —
 * stand-in for SSE message.status / connection.state from a simulated worker.
 */
export function WaW1EvidenceHarness() {
  const [frame, setFrame] = useState<Frame>("sending");
  const [composer, setComposer] = useState("");

  useEffect(() => {
    (window as unknown as { __waW1SetFrame?: (f: Frame) => void }).__waW1SetFrame =
      (f) => {
        setFrame(f);
        if (f === "sending") setComposer("");
      };
    return () => {
      delete (window as unknown as { __waW1SetFrame?: (f: Frame) => void })
        .__waW1SetFrame;
    };
  }, []);

  const status =
    frame === "kill" ? "sent" : frame === "failed" ? "failed" : frame;

  const killOn = frame === "kill";
  const canSend = Boolean(composer.trim()) && !killOn;

  return (
    <div
      dir="rtl"
      lang="ar"
      className="ro-portal ro-portal-admin rad-root"
      data-portal="admin"
      data-theme="dark"
      data-frame={frame}
      style={{ minHeight: "100vh", background: "var(--rad-c0, #0c0b0a)" }}
    >
      <div
        className="rad-shell"
        style={{ display: "grid", gridTemplateColumns: "1fr", minHeight: "100vh" }}
      >
        <div
          className="rad-thread"
          style={{ maxWidth: 720, marginInline: "auto", width: "100%" }}
        >
          <div className="rad-th">
            <div>
              <b>دليل WA-W1 · محاكاة عامل</b>
              <small>بدون إرسال حقيقي · flags off</small>
            </div>
            <div className="rad-acts">
              <span
                className={`rad-conn s-${killOn ? "outbound-off" : "connected"}`}
              >
                <span className="rad-cd" aria-hidden />
                {killOn ? "إيقاف طارئ" : "متصل"}
              </span>
            </div>
          </div>

          {killOn ? (
            <div className="rad-bn rad-err" role="alert" data-testid="kill-banner">
              <OctagonX width={18} height={18} strokeWidth={1.5} aria-hidden />
              <KillSwitchBannerText
                ib={ib}
                locale="ar"
                by="admin@rareoud.local"
                at="2026-11-10T14:57:05.000Z"
                reason="اشتباه حظر"
              />
            </div>
          ) : null}

          <div className="rad-msgs" id="msgs">
            <div
              className={`rad-bb rad-out${status === "failed" ? " rad-bb-failed" : ""}${
                status === "sending" ? " rad-sending" : ""
              }`}
              data-testid="bubble"
              data-status={status}
            >
              اختبار
              <div className="rad-bm">
                17:30
                {status === "failed" ? (
                  <button
                    type="button"
                    className="rad-retry"
                    aria-label={ib.retrySend}
                    data-testid="retry"
                  >
                    <CircleAlert
                      width={14}
                      height={14}
                      strokeWidth={1.5}
                      aria-hidden
                      className="rad-retry-ic"
                    />
                    <span>{ib.retrySend}</span>
                  </button>
                ) : (
                  <Tick status={status} />
                )}
              </div>
            </div>
          </div>

          <div className="rad-cmp">
            <div className="rad-cbx">
              <textarea
                data-testid="composer"
                value={composer}
                onChange={(e) => setComposer(e.target.value)}
                placeholder={
                  killOn
                    ? "الرد متوقف حالياً — استخدم ملاحظة داخلية"
                    : "اكتب رداً…"
                }
                disabled={killOn}
                rows={2}
              />
              <div className="rad-cbr">
                <span className="sp" />
                <button
                  type="button"
                  className={`rad-sendb${canSend ? " rad-sendb-ready" : ""}`}
                  disabled={!canSend}
                >
                  إرسال
                  <Send width={16} height={16} strokeWidth={1.5} aria-hidden />
                </button>
              </div>
            </div>
          </div>

          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", padding: 12 }}>
            {FRAME_ORDER.map((f) => (
              <button
                key={f}
                type="button"
                className="rad-btn rad-gh"
                data-testid={`frame-${f}`}
                onClick={() => {
                  setFrame(f);
                  if (f === "sending") setComposer("");
                }}
              >
                {f}
              </button>
            ))}
            <button
              type="button"
              className="rad-btn rad-gh"
              onClick={() => setComposer("نص تجريبي")}
            >
              fill
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
