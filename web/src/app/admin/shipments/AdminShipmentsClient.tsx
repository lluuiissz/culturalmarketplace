'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface Row {
  id: number; order_id: number; tracking: string; status: string;
  artisan: string; recipient: string; items: string;
  weight: number; declared: number; created_at: string;
}

const STATUSES = ['created', 'dropped_off', 'in_transit', 'delivered', 'cancelled'];

const STATUS_STYLE: Record<string, string> = {
  created: 'bg-stone-100 text-stone-600',
  dropped_off: 'bg-amber-100 text-amber-700',
  in_transit: 'bg-blue-100 text-blue-700',
  delivered: 'bg-leaf-500/10 text-leaf-700',
  cancelled: 'bg-red-100 text-red-700',
};

export default function AdminShipmentsClient({ initial }: { initial: Row[] }) {
  const router = useRouter();
  const [rows, setRows] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState<number | null>(null);
  const [newTracking, setNewTracking] = useState('');

  async function setStatus(id: number, status: string) {
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

  async function fixTracking(id: number) {
    setBusy(true);
    setError('');
    const res = await fetch(`/api/admin/shipments/${id}/tracking`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tracking_number: newTracking.trim() }),
    });
    const data = await res.json();
    setBusy(false);
    if (data.status === 'success') {
      setRows((rs) => rs.map((r) => (r.id === id ? { ...r, tracking: newTracking.trim().toUpperCase() } : r)));
      setEditing(null);
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
          <div className="min-w-0">
            {editing === r.id ? (
              <div className="flex items-center gap-2">
                <input className="input h-9 w-52 font-mono text-sm" value={newTracking} onChange={(e) => setNewTracking(e.target.value)} placeholder="JT…" />
                <button className="btn-primary px-3 py-1 text-xs" disabled={busy} onClick={() => fixTracking(r.id)}>Save</button>
                <button className="btn-outline px-3 py-1 text-xs" onClick={() => setEditing(null)}>Cancel</button>
              </div>
            ) : (
              <button className="font-mono font-bold text-brand-700 hover:underline" title="Click to correct the tracking number" onClick={() => { setEditing(r.id); setNewTracking(r.tracking); }}>
                {r.tracking} ✎
              </button>
            )}
            <p className="text-sm font-semibold text-stone-800">{r.items}</p>
            <p className="text-sm text-stone-500">{r.artisan} → {r.recipient} · Order #{r.order_id} · {r.weight} kg · ₱{r.declared.toFixed(2)}</p>
            <p className="text-xs text-stone-400">Booked {new Date(r.created_at).toLocaleString()}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className={`badge capitalize ${STATUS_STYLE[r.status] ?? 'bg-stone-100 text-stone-600'}`}>{r.status.replace(/_/g, ' ')}</span>
            <select
              className="input h-9 w-36 text-xs"
              value={r.status}
              disabled={busy}
              onChange={(e) => setStatus(r.id, e.target.value)}
            >
              {STATUSES.map((s) => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
            </select>
          </div>
        </div>
      ))}
      {rows.length === 0 && <p className="text-stone-500">No shipments yet.</p>}
    </div>
  );
}
