'use client';

import Link from 'next/link';
import { useState } from 'react';

interface Row {
  order_item_id: number; product_id: number; customer: string; product: string; attendee: string | null;
  session: string | null; quantity: number; status: string; ticket: string | null;
}

export default function BookingsClient({ initial }: { initial: Row[] }) {
  const [rows, setRows] = useState(initial);
  const [busy, setBusy] = useState(false);

  async function setStatus(id: number, status: string) {
    setBusy(true);
    await fetch('/api/artisan/orders/status-booking', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ order_item_id: id, status }),
    });
    setRows((rs) => rs.map((r) => (r.order_item_id === id ? { ...r, status } : r)));
    setBusy(false);
  }

  return (
    <div className="mt-6 space-y-3">
      {rows.map((b) => (
        <div key={b.order_item_id} className="card flex flex-wrap items-center justify-between gap-3 p-4">
          <div>
            <p className="font-semibold text-stone-800">
              {b.product} × {b.quantity}
              {b.ticket && <span className="ml-2 font-mono text-xs text-brand-700">🎟 {b.ticket}</span>}
            </p>
            <p className="text-sm text-stone-500">
              {b.customer}{b.attendee ? ` (attendee: ${b.attendee})` : ''}{b.session ? ` · 📅 ${b.session}` : ''}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className={`badge capitalize ${b.status === 'cancelled' || b.status === 'no_show' ? 'bg-red-100 text-red-700' : b.status === 'attended' ? 'bg-leaf-500/10 text-leaf-700' : 'bg-stone-100 text-stone-600'}`}>
              {b.status.replace(/_/g, ' ')}
            </span>
            {b.status !== 'cancelled' && b.status !== 'attended' && (
              <>
                <Link href={`/artisan/tutorial-attendees/${b.product_id}`} className="btn-outline px-3 py-1 text-xs">👥 Attendees</Link>
                <button className="btn-outline px-3 py-1 text-xs" disabled={busy} onClick={() => setStatus(b.order_item_id, 'cancelled')}>Cancel</button>
                <button className="btn-outline px-3 py-1 text-xs" disabled={busy} onClick={() => setStatus(b.order_item_id, 'no_show')}>No-show</button>
              </>
            )}
          </div>
        </div>
      ))}
      {rows.length === 0 && <p className="text-stone-500">No bookings yet.</p>}
    </div>
  );
}
