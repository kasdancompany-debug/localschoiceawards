"use client";

export function PrintButton() {
  return (
    <button
      type="button"
      className="mt-6 rounded border border-black px-4 py-2 text-sm print:hidden"
      onClick={() => window.print()}
    >
      Print
    </button>
  );
}
