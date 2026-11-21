"use client";

export default function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="no-print rounded border border-[var(--color-border)] px-4 py-2 text-sm hover:bg-[var(--color-paper)]"
    >
      Print
    </button>
  );
}
