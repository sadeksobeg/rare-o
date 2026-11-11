"use client";

import { useEffect, useState } from "react";
import {
  CheckCheck,
  Ellipsis,
  FileText,
  Mic,
  Paperclip,
  Search,
  Send,
  UserRound,
  Zap,
} from "lucide-react";

type Frame =
  | "menu"
  | "attach"
  | "preview"
  | "voice"
  | "incoming"
  | "quick"
  | "search"
  | "emoji";

type Theme = "light" | "dark";

const FRAMES: Frame[] = [
  "menu",
  "attach",
  "preview",
  "voice",
  "incoming",
  "quick",
  "search",
  "emoji",
];

/**
 * Dev harness for WA-W2 review screenshots (no real WhatsApp).
 * Frames simulate working chrome: header menu, attach, preview, voice,
 * incoming media bubbles, quick replies, in-thread search, emoji.
 */
export function WaW2EvidenceHarness() {
  const [frame, setFrame] = useState<Frame>("menu");
  const [theme, setTheme] = useState<Theme>("light");

  useEffect(() => {
    const w = window as unknown as {
      __waW2SetFrame?: (f: Frame) => void;
      __waW2SetTheme?: (t: Theme) => void;
    };
    w.__waW2SetFrame = setFrame;
    w.__waW2SetTheme = setTheme;
    return () => {
      delete w.__waW2SetFrame;
      delete w.__waW2SetTheme;
    };
  }, []);

  return (
    <div
      dir="rtl"
      lang="ar"
      className="ro-portal ro-portal-admin rad-root"
      data-portal="admin"
      data-theme={theme}
      data-frame={frame}
      style={{ minHeight: "100vh", background: "var(--rad-c0, #f5efe6)" }}
    >
      <div
        className="rad-thread"
        style={{
          position: "relative",
          maxWidth: 720,
          marginInline: "auto",
          minHeight: 560,
        }}
      >
        <div className="rad-th">
          <div className="rad-tt">
            <b>عميل تجريبي</b>
            <small>
              <bdi dir="ltr">+964 7•• ••• 000</bdi>
            </small>
          </div>
          <div className="rad-acts">
            <button type="button" className="rad-ib" aria-label="search">
              <Search width={18} height={18} strokeWidth={1.5} />
            </button>
            <button type="button" className="rad-ib" aria-label="contact">
              <UserRound width={18} height={18} strokeWidth={1.5} />
            </button>
            <div className="rad-ov" style={{ position: "relative" }}>
              <button type="button" className="rad-ib" aria-label="more">
                <Ellipsis width={18} height={18} strokeWidth={1.5} />
              </button>
              {frame === "menu" ? (
                <div
                  className="rad-menu rad-ov-menu rad-on"
                  data-testid="overflow-menu"
                  role="menu"
                >
                  <button type="button" role="menuitem">
                    تعيين كغير مقروء
                  </button>
                  <button type="button" role="menuitem">
                    أرشفة
                  </button>
                  <button type="button" role="menuitem">
                    كتم ٨ ساعات
                  </button>
                  <button type="button" role="menuitem">
                    نسخ الرقم المقنّع
                  </button>
                  <button type="button" role="menuitem">
                    إظهار الرقم كاملاً
                  </button>
                  <hr />
                  <button type="button" role="menuitem" className="rad-dng">
                    حظر
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        </div>

        {frame === "search" ? (
          <div className="rad-tsearch" data-testid="search-bar">
            <input defaultValue="اختبار" aria-label="search" />
            <button type="button" className="rad-ib">
              السابق
            </button>
            <button type="button" className="rad-ib">
              التالي
            </button>
            <span className="rad-tsearch-count">1/2</span>
          </div>
        ) : null}

        <div className="rad-msgs">
          {(frame === "incoming" || frame === "search") && (
            <>
              <div className="rad-bb rad-in" data-testid="bubble-image">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  className="rad-media-img"
                  src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAQAAAABkCAYAAABuz1EwAAAAhUlEQVR4nO3BMQEAAADCoPVP7WsIoAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA4G0eYgABH5u3xwAAAABJRU5ErkJggg=="
                  alt="صورة تجريبية"
                  style={{ borderRadius: 12, maxWidth: 240, height: 100, objectFit: "cover", background: "#6b4a8a" }}
                />
              </div>
              <div className="rad-bb rad-in" data-testid="bubble-audio">
                <div className="rad-ap">
                  <span className="rad-ap-play">▶</span>
                  <div className="rad-ap-body">
                    <div className="rad-ap-wave">
                      <span className="rad-ap-fill" style={{ width: "35%" }} />
                    </div>
                    <div className="rad-ap-meta">
                      <span>0:04 / 0:12</span>
                      <span>ملاحظة صوتية</span>
                    </div>
                  </div>
                  <span className="rad-ap-speed">1x</span>
                </div>
              </div>
              <div className="rad-bb rad-in" data-testid="bubble-doc">
                <FileText width={18} height={18} strokeWidth={1.5} />
                <span>
                  <bdi dir="ltr">report.pdf · 240 KB</bdi>
                </span>
              </div>
            </>
          )}
          {frame !== "incoming" && frame !== "search" ? (
            <div className="rad-bb rad-out">
              اختبار
              <div className="rad-bm">
                17:30
                <CheckCheck width={14} height={14} strokeWidth={1.5} />
              </div>
            </div>
          ) : null}
        </div>

        {frame === "preview" ? (
          <div
            className="rad-mo rad-on"
            data-testid="preview-dialog"
            role="dialog"
            aria-modal="true"
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 200,
              display: "grid",
              placeItems: "center",
              padding: 24,
              background: "rgba(5,3,7,0.55)",
            }}
          >
            <div
              className="rad-mpv"
              style={{
                width: "min(560px, 100%)",
                background: "var(--rad-surface)",
                borderRadius: 16,
                border: "1px solid var(--rad-bd2)",
                padding: 16,
                boxShadow: "0 24px 60px -20px #000",
              }}
            >
              <div className="rad-mpv-stage">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='480' height='280'%3E%3Cdefs%3E%3ClinearGradient id='g' x1='0' y1='0' x2='1' y2='1'%3E%3Cstop stop-color='%236b3fa0'/%3E%3Cstop offset='1' stop-color='%23c4a574'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect fill='url(%23g)' width='480' height='280'/%3E%3Ctext x='50%25' y='50%25' fill='%23fff' text-anchor='middle' dy='.3em' font-size='22'%3Epreview%3C/text%3E%3C/svg%3E"
                  alt="معاينة صورة"
                />
              </div>
              <div className="rad-mpv-cap">
                <textarea placeholder="تعليق…" rows={2} />
              </div>
              <div className="rad-mpv-acts">
                <button type="button" className="rad-btn rad-gh">
                  إلغاء
                </button>
                <button type="button" className="rad-btn rad-pri">
                  إرسال
                </button>
              </div>
            </div>
          </div>
        ) : null}

        <div className="rad-cmp" style={{ position: "relative" }}>
          {frame === "attach" ? (
            <div
              className="rad-attach"
              style={{ position: "absolute", insetInlineEnd: 16, bottom: "100%", marginBottom: 8 }}
            >
              <div
                className="rad-menu rad-attach-menu rad-on"
                data-testid="attach-menu"
                role="menu"
                style={{ position: "relative", display: "block" }}
              >
                <button type="button" role="menuitem">
                  صورة / فيديو
                </button>
                <button type="button" role="menuitem">
                  مستند
                </button>
                <button type="button" role="menuitem">
                  كاميرا
                </button>
              </div>
            </div>
          ) : null}

          {frame === "quick" ? (
            <div
              className="rad-qm rad-qr-panel rad-on"
              data-testid="quick-replies"
              style={{
                position: "absolute",
                insetInlineEnd: 12,
                bottom: "100%",
                marginBottom: 8,
                display: "block",
                width: 300,
              }}
            >
              <div className="rad-qr-head">
                <div className="rad-qr-search">
                  <input placeholder="بحث في الردود…" />
                </div>
              </div>
              <button type="button" className="rad-qr-row">
                <span>
                  <b>ترحيب</b>
                  <span>مرحباً {"{name}"}، كيف نقدر نساعدك؟</span>
                </span>
              </button>
              <button type="button" className="rad-qr-row">
                <span>
                  <b>متابعة طلب</b>
                  <span>بخصوص طلبك {"{request_ref}"}…</span>
                </span>
              </button>
            </div>
          ) : null}

          {frame === "voice" ? (
            <div
              className="rad-voice rad-on"
              data-testid="voice-ui"
              style={{
                position: "absolute",
                insetInlineEnd: 12,
                bottom: "100%",
                marginBottom: 8,
                background: "var(--rad-surface)",
                border: "1px solid var(--rad-bd2)",
                boxShadow: "0 12px 40px -16px #000",
                padding: "10px 12px",
              }}
            >
              <span className="rad-voice-dot" aria-hidden />
              <Mic width={18} height={18} strokeWidth={1.5} />
              <span className="rad-voice-timer">0:07</span>
              <div className="rad-voice-bars" aria-hidden>
                {Array.from({ length: 12 }).map((_, i) => (
                  <i key={i} style={{ height: 4 + ((i * 7) % 16) }} />
                ))}
              </div>
              <button type="button" className="rad-dng">
                إلغاء
              </button>
              <button type="button" className="rad-btn rad-pri">
                إرسال
              </button>
            </div>
          ) : null}

          {frame === "emoji" ? (
            <div
              className="rad-emoji-panel rad-on"
              data-testid="emoji-panel"
              style={{
                position: "absolute",
                insetInlineEnd: 72,
                bottom: "100%",
                marginBottom: 8,
                display: "grid",
              }}
            >
              {["🙂", "😊", "🙏", "👍", "👌", "✨", "🌹", "✅", "❗", "❓"].map(
                (e) => (
                  <button key={e} type="button" className="rad-emoji-btn">
                    {e}
                  </button>
                )
              )}
            </div>
          ) : null}

          <div className="rad-cbx">
            <textarea rows={2} placeholder="اكتب رداً…" defaultValue="" />
            <div className="rad-cbr">
              <div className="rad-attach" style={{ position: "relative" }}>
                <button type="button" className="rad-ib" aria-label="attach">
                  <Paperclip width={18} height={18} strokeWidth={1.5} />
                </button>
              </div>
              <button type="button" className="rad-ib" aria-label="emoji">
                🙂
              </button>
              <button type="button" className="rad-ib" aria-label="quick">
                <Zap width={18} height={18} strokeWidth={1.5} />
              </button>
              <button type="button" className="rad-ib" aria-label="mic">
                <Mic width={18} height={18} strokeWidth={1.5} />
              </button>
              <span className="sp" />
              <button type="button" className="rad-sendb">
                إرسال
                <Send width={16} height={16} strokeWidth={1.5} />
              </button>
            </div>
          </div>
        </div>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", padding: 12 }}>
          {(["light", "dark"] as const).map((t) => (
            <button
              key={t}
              type="button"
              className="rad-btn rad-gh"
              data-testid={`theme-${t}`}
              onClick={() => setTheme(t)}
            >
              {t}
            </button>
          ))}
          {FRAMES.map((f) => (
            <button
              key={f}
              type="button"
              className="rad-btn rad-gh"
              data-testid={`frame-${f}`}
              onClick={() => setFrame(f)}
            >
              {f}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
