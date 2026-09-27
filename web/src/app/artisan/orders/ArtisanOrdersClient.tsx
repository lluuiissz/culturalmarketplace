'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface Row {
  item_id: number; order_id: number; product_name: string; quantity: number;
  variant: string | null; customer: string; payment: string; status: string;
  purchase_type: string; tracking_number: string | null;
}

const NEXT_STATUS: Record<string, Array<{ value: string; label: string }>> = {
  pending: [{ value: 'preparing', label: 'Start preparing' }, { value: 'cancelled', label: 'Cancel' }],
  preparing: [{ value: 'ready_to_ship', label: 'Ready to ship' }, { value: 'cancelled', label: 'Cancel' }],
  ready_to_ship: [{ value: 'shipped', label: 'Mark shipped' }, { value: 'cancelled', label: 'Cancel' }],
  shipped: [{ value: 'received', label: 'Await customer receipt' }],
  received: [],
  cancelled: [],
  no_show: [],
};

export default function ArtisanOrdersClient({ initial }: { initial: Row[] }) {
  const router = useRouter();
  const [rows, setRows] = useState(initial);
  const [busy, setBusy] = useState(false);

  async function setStatus(itemId: number, status: string) {
    setBusy(true);
    await fetch(`/api/artisan/orders/${itemId}/status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    setRows((rs) => rs.map((r) => (r.item_id === itemId ? { ...r, status } : r)));
    setBusy(false);
    router.refresh();
  }

  return (
    <div className="mt-8 space-y-3">
      {rows.map((r) => (
        <div key={r.item_id} className="card flex flex-wrap items-center justify-between gap-3 p-4">
          <div>
            <p className="font-semibold text-stone-800">{r.product_name} × {r.quantity}{r.variant ? ` (${r.variant})` : ''}</p>
            <p className="text-sm text-stone-500">Order #{r.order_id} · {r.customer} · {r.payment === 'gcash' ? 'GCash' : 'COD'}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="badge bg-stone-100 capitalize text-stone-600">{r.status.replace(/_/g, ' ')}</span>
            {r.tracking_number && <span className="font-mono text-xs text-brand-700" title="J&T tracking">📦 {r.tracking_number}</span>}
            {r.purchase_type !== 'workshop' && ['paid', 'pending', 'preparing', 'ready_to_ship'].includes(r.status) && (
              <a className="btn-primary px-3 py-1 text-xs" href={`/artisan/orders/${r.item_id}/ship`}>📦 Ship with J&T</a>
            )}
            {(NEXT_STATUS[r.status] ?? []).map((s) => (
              <button key={s.value} className={`px-3 py-1 text-xs ${s.value === 'cancelled' ? 'btn-danger' : 'btn-outline'}`} disabled={busy} onClick={() => setStatus(r.item_id, s.value)}>
                {s.label}
              </button>
            ))}
          </div>
        </div>
      ))}
      {rows.length === 0 && <p className="text-stone-500">No orders yet.</p>}
    </div>
  );
}
