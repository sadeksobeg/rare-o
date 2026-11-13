"use client";

export function PrintButton() {
  return (
    <button type="button" onClick={() => window.print()} style={{ padding: "8px 16px" }}>
      طباعة · Print
    </button>
  );
}
