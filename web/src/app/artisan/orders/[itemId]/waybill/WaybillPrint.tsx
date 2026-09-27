'use client';

import type { Shipment } from '@/lib/types';

// Printable 4x6in-style waybill. Barcode is generated locally as an inline SVG
// (Code 39 — every digit maps to 5 bars; printable without any external lib).
const CODE39: Record<string, string> = {
  '0': '101001101101', '1': '110100101011', '2': '101100101011', '3': '110110010101',
  '4': '101001101011', '5': '110100110101', '6': '101100110101', '7': '101001011011',
  '8': '110100101101', '9': '101100101101', 'J': '110101100101', 'T': '101101100101',
  '-': '110101101011', '*': '110101101101',
};

function Barcode({ value }: { value: string }) {
  const text = `*${value.toUpperCase()}*`;
  const bars: boolean[] = [];
  for (const ch of text) {
    const pattern = CODE39[ch];
    if (!pattern) continue;
    for (const bit of pattern) bars.push(bit === '1');
    bars.push(false); // inter-character gap
  }
  const width = 2.2;
  let x = 0;
  return (
    <svg viewBox={`0 0 ${bars.length * (width + 0.8)} 60`} className="h-14 w-full" role="img" aria-label={`Barcode ${value}`}>
      {bars.map((bar, i) => {
        const el = bar ? <rect key={i} x={x} y={0} width={width} height={60} fill="black" /> : null;
        x += width + 0.8;
        return el;
      })}
    </svg>
  );
}

export default function WaybillPrint({ shipment }: { shipment: Shipment }) {
  return (
    <div className="mx-auto max-w-md">
      <div className="card overflow-hidden p-0" id="waybill">
        <div className="flex items-center justify-between bg-brand-700 px-5 py-3 text-white">
          <span className="font-serif text-lg font-bold">J&T Express</span>
          <span className="text-xs uppercase tracking-widest">Express waybill</span>
        </div>
        <div className="px-5 py-4">
          <div className="rounded-lg bg-stone-100 px-3 py-2 text-center">
            <Barcode value={shipment.tracking_number} />
            <p className="mt-1 font-mono text-lg font-bold tracking-[0.2em] text-stone-900">{shipment.tracking_number}</p>
          </div>

          <div className="mt-4">
            <p className="text-[10px] font-bold uppercase tracking-wider text-stone-400">From (sender)</p>
            <p className="font-semibold text-stone-900">{shipment.sender_name}</p>
            <p className="text-sm text-stone-600">{shipment.sender_phone}</p>
            <p className="whitespace-pre-line text-sm text-stone-600">{shipment.sender_address}</p>
          </div>

          <div className="mt-4 border-t-2 border-dashed border-stone-200 pt-4">
            <p className="text-[10px] font-bold uppercase tracking-wider text-brand-700">To (recipient)</p>
            <p className="font-semibold text-stone-900">{shipment.recipient_name}</p>
            <p className="text-sm text-stone-600">{shipment.recipient_phone}</p>
            <p className="whitespace-pre-line text-sm text-stone-600">{shipment.recipient_address}</p>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-3 border-t-2 border-dashed border-stone-200 pt-4 text-sm">
            <div><p className="text-[10px] font-bold uppercase text-stone-400">Weight</p><p className="font-semibold text-stone-800">{shipment.weight_kg} kg</p></div>
            <div><p className="text-[10px] font-bold uppercase text-stone-400">Declared value</p><p className="font-semibold text-stone-800">₱{shipment.declared_value.toFixed(2)}</p></div>
            <div><p className="text-[10px] font-bold uppercase text-stone-400">Service</p><p className="font-semibold text-stone-800">Standard</p></div>
          </div>

          <div className="mt-4 border-t-2 border-dashed border-stone-200 pt-4">
            <p className="text-[10px] font-bold uppercase text-stone-400">Contents</p>
            <p className="text-sm text-stone-800">{shipment.items_summary}</p>
            {shipment.notes && <p className="mt-1 text-xs italic text-stone-500">Note: {shipment.notes}</p>}
          </div>
        </div>
      </div>

      <div className="my-6 flex justify-center gap-3 print:hidden">
        <button className="btn-primary" onClick={() => window.print()}>🖨 Print</button>
        <a className="btn-outline" href="/artisan/shipments">Back to shipments</a>
      </div>

      <style jsx global>{`
        @media print {
          body * { visibility: hidden; }
          #waybill, #waybill * { visibility: visible; }
          #waybill { position: absolute; inset: 0; margin: 0; border-radius: 0; box-shadow: none; }
        }
      `}</style>
    </div>
  );
}
