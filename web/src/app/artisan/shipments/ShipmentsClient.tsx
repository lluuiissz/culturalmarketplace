'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface Row {
  id: number; order_id: number; tracking: string; status: string;
  recipient: string; items: string; weight: number; declared: number;
  order_item_id: number; updated_at: string;
}

const NEXT: Record<string, { value: string; label: string } | null> = {
  created: { value: 'dropped_off', label: 'Mark dropped off' },
  dropped_off: { value: 'in_transit', label: 'Mark in transit' },
  in_transit: { value: 'delivered', label: 'Mark delivered' },
  delivered: null,
  cancelled: null,
};

const STATUS_STYLE: Record<string, string> = {
  created: 'bg-stone-100 text-stone-600',
  dropped_off: 'bg-amber-100 text-amber-700',
  in_transit: 'bg-blue-100 text-blue-700',
  delivered: 'bg-leaf-500/10 text-leaf-700',
  cancelled: 'bg-red-100 text-red-700',
};

export default function ShipmentsClient({ initial }: { initial: Row[] }) {
  const router = useRouter();
  const [rows, setRows] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function advance(id: number, status: string) {
    setBusy(true);
    setError('');
    const res = await fetch(`/api/shipments/${id}/status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    const data = await res.json();
    setBusy(false);
    if (data.status === 'success') {
      setRows((rs) => rs.map((r) => (r.id === id ? { ...r, status } : r)));
      router.refresh();
    } else {
      setError(data.message ?? 'Update failed.');
    }
  }

  return (
    <div className="mt-6 space-y-3">
      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      {rows.map((r) => (
        <div key={r.id} className="card flex flex-wrap items-center justify-between gap-3 p-4">
          <div>
            <p className="font-mono font-bold text-brand-700">{r.tracking}</p>
            <p className="text-sm font-semibold text-stone-800">{r.items}</p>
            <p className="text-sm text-stone-500">to {r.recipient} · Order #{r.order_id} · {r.weight} kg · ₱{r.declared.toFixed(2)}</p>
            <p className="text-xs text-stone-400">Updated {new Date(r.updated_at).toLocaleString()}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className={`badge capitalize ${STATUS_STYLE[r.status] ?? 'bg-stone-100 text-stone-600'}`}>{r.status.replace(/_/g, ' ')}</span>
            <a className="btn-outline px-3 py-1 text-xs" href={`/artisan/orders/${r.order_item_id}/waybill`}>🖨 Waybill</a>
            {NEXT[r.status] && (
              <button className="btn-primary px-3 py-1 text-xs" disabled={busy} onClick={() => advance(r.id, NEXT[r.status]!.value)}>
                {NEXT[r.status]!.label}
              </button>
            )}
          </div>
        </div>
      ))}
      {rows.length === 0 && <p className="text-stone-500">No shipments yet. Book one from an order on the Orders page.</p>}
    </div>
  );
}
