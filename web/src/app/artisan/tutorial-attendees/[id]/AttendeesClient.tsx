'use client';

import { useState } from 'react';

interface Row { order_item_id: number; customer: string; attendee: string | null; ticket: string | null; status: string }

export default function AttendeesClient({ initial }: { initial: Row[] }) {
  const [rows, setRows] = useState(initial);
  const [busy, setBusy] = useState(false);

  async function mark(order_item_id: number, present: boolean) {
    setBusy(true);
    await fetch('/api/artisan/attendees', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ order_item_id, present }),
    });
    setRows((rs) => rs.map((r) => (r.order_item_id === order_item_id ? { ...r, status: present ? 'attended' : 'no_show' } : r)));
    setBusy(false);
  }

  return (
    <div className="mt-6 space-y-3">
      {rows.map((r) => (
        <div key={r.order_item_id} className="card flex flex-wrap items-center justify-between gap-3 p-4">
          <div>
            <p className="font-semibold text-stone-800">{r.attendee ?? r.customer}</p>
            <p className="text-sm text-stone-500">booked by {r.customer}{r.ticket ? ` · 🎟 ${r.ticket}` : ''}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className={`badge capitalize ${r.status === 'attended' ? 'bg-leaf-500/10 text-leaf-700' : r.status === 'no_show' ? 'bg-red-100 text-red-700' : 'bg-stone-100 text-stone-600'}`}>
              {r.status.replace(/_/g, ' ')}
            </span>
            <button className="btn-outline px-3 py-1 text-xs" disabled={busy} onClick={() => mark(r.order_item_id, true)}>Present</button>
            <button className="btn-outline px-3 py-1 text-xs" disabled={busy} onClick={() => mark(r.order_item_id, false)}>Absent</button>
          </div>
        </div>
      ))}
      {rows.length === 0 && <p className="text-stone-500">No attendees booked yet.</p>}
    </div>
  );
}
