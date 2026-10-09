'use client';

export default function PrintReceiptButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="btn-outline inline-flex items-center gap-2 border-stone-300 bg-white hover:bg-stone-50 font-semibold shadow-xs text-sm px-4 py-2"
    >
      <span>🖨️</span> Print Official Receipt / Download PDF
    </button>
  );
}
