"use client";

export function PrintInvoiceButton({ label }: { label: string }) {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="inv-print-btn"
    >
      {label}
    </button>
  );
}
