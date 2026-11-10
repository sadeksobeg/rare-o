import { notFound } from "next/navigation";

export const metadata = { title: "dev: contrast gate self-test" };

/**
 * Intentionally bad contrast samples for the pixel gate SELF-TEST.
 * Gate must FAIL when pointed at this page.
 */
export default function GateSelfTestPage() {
  if (process.env.NODE_ENV === "production") {
    notFound();
  }

  return (
    <main
      data-portal="admin"
      data-theme="dark"
      className="ro-portal min-h-screen space-y-8 p-10"
      style={{ background: "#0B080D", color: "#F4E7D8", fontFamily: "sans-serif" }}
    >
      <h1 style={{ fontSize: 18, fontWeight: 600 }}>Gate self-test (must fail)</h1>

      <p
        data-gate-bad="dark-on-dark"
        style={{ color: "#1a1520", background: "#15101A", padding: "12px 16px" }}
      >
        نص داكن على أرضية داكنة — يجب أن يفشل الفحص
      </p>

      <button
        type="button"
        data-gate-bad="button-on-gradient"
        style={{
          display: "inline-flex",
          padding: "10px 18px",
          borderRadius: 11,
          border: 0,
          color: "#F4E7D8",
          background: "linear-gradient(120deg, #7A44B3, #F4E7D8)",
          fontWeight: 600,
        }}
      >
        حفظ المنتج
      </button>

      <div
        data-gate-bad="lavender-tile"
        className="rad-pt-empty"
        style={{
          width: 120,
          height: 120,
          borderRadius: 12,
          background: "linear-gradient(160deg, #4c4666, #5a5278)",
          display: "grid",
          placeItems: "center",
          color: "#6a6480",
        }}
      >
        معاينة
      </div>

      <span
        data-gate-bad="icon-low-contrast"
        style={{
          display: "inline-flex",
          padding: 8,
          background: "#15101A",
          color: "#1a1520",
        }}
      >
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          aria-hidden
        >
          <circle cx="12" cy="12" r="9" />
        </svg>
      </span>

      <p
        data-gate-bad="nego-terms"
        style={{ color: "#3a2a4a", background: "#15101A", padding: 8, fontSize: 12 }}
      >
        شروط · 1,200 US$ · الكمية 2
      </p>
    </main>
  );
}
