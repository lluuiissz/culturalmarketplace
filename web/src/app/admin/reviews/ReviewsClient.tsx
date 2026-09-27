'use client';

import { useState } from 'react';

interface Row {
  item_id: number; product: string; customer: string; rating: number;
  comment: string | null; visible: boolean; reviewed: string;
}

export default function ReviewsClient({ initial }: { initial: Row[] }) {
  const [rows, setRows] = useState(initial);
  const [busy, setBusy] = useState(false);

  async function act(item_id: number, action: 'toggle' | 'delete') {
    setBusy(true);
    await fetch('/api/admin/reviews', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ item_id, action }),
    });
    if (action === 'delete') setRows((rs) => rs.filter((r) => r.item_id !== item_id));
    else setRows((rs) => rs.map((r) => (r.item_id === item_id ? { ...r, visible: !r.visible } : r)));
    setBusy(false);
  }

  return (
    <div className="mt-6 space-y-3">
      {rows.map((r) => (
        <div key={r.item_id} className={`card p-4 ${r.visible ? '' : 'opacity-60'}`}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="font-semibold text-stone-800">
                {r.product}
                <span className="ml-2 text-amber-500">{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</span>
                {!r.visible && <span className="badge ml-2 bg-red-100 text-red-700">hidden</span>}
              </p>
              <p className="text-sm text-stone-500">{r.customer} · {r.reviewed}</p>
            </div>
            <div className="flex gap-2">
              <button className="btn-outline px-3 py-1 text-xs" disabled={busy} onClick={() => act(r.item_id, 'toggle')}>{r.visible ? 'Hide' : 'Show'}</button>
              <button className="btn-danger px-3 py-1 text-xs" disabled={busy} onClick={() => act(r.item_id, 'delete')}>Delete</button>
            </div>
          </div>
          {r.comment && <p className="mt-2 text-sm text-stone-600">“{r.comment}”</p>}
        </div>
      ))}
      {rows.length === 0 && <p className="text-sm text-stone-500">No reviews yet.</p>}
    </div>
  );
}
