'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface Row {
  id: number; status: string; method: string; total: number; created_at: string;
  items: Array<{ id: number; name: string; qty: number; status: string; price: number; rating: number | null; tracking: string | null; courier: string | null }>;
}

const SHIPMENT_STEPS = ['created', 'dropped_off', 'in_transit', 'delivered'] as const;

function TrackingCard({ tracking, courier, status }: { tracking: string; courier: string; status: string }) {
  const idx = SHIPMENT_STEPS.indexOf(status as (typeof SHIPMENT_STEPS)[number]);
  return (
    <div className="mt-3 rounded-xl bg-brand-50/60 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">{courier || 'J&T Express'} · tracking</p>
          <p className="font-mono text-lg font-bold text-brand-800">{tracking}</p>
        </div>
        <a className="btn-outline px-3 py-1 text-xs" target="_blank" rel="noopener noreferrer"
          href={`https://www.jtexpress.ph/track/${encodeURIComponent(tracking)}`}>Track on J&T ↗</a>
      </div>
      {idx >= 0 && (
        <ol className="mt-3 flex items-center">
          {SHIPMENT_STEPS.map((s, i) => (
            <li key={s} className="flex flex-1 items-center last:flex-none">
              <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${i <= idx ? 'bg-leaf-500 text-white' : 'bg-stone-200 text-stone-400'}`}>
                {i <= idx ? '✓' : i + 1}
              </span>
              {i < 3 && <span className={`h-0.5 flex-1 ${i < idx ? 'bg-leaf-500' : 'bg-stone-200'}`} />}
            </li>
          ))}
        </ol>
      )}
      <div className="mt-1 flex justify-between text-[10px] text-stone-500">
        <span>Booked</span><span>Drop-off</span><span>In transit</span><span>Delivered</span>
      </div>
    </div>
  );
}

export default function OrdersClient({ initial }: { initial: Row[] }) {
  const router = useRouter();
  const [rows, setRows] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [reviewing, setReviewing] = useState<number | null>(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [msg, setMsg] = useState('');

  async function receive(itemId: number) {
    setBusy(true);
    await fetch(`/api/orders/item/${itemId}/receive`, { method: 'POST' });
    setRows((rs) => rs.map((r) => ({ ...r, items: r.items.map((i) => (i.id === itemId ? { ...i, status: 'received' } : i)) })));
    setBusy(false);
    router.refresh();
  }

  async function submitReview(itemId: number) {
    setBusy(true);
    setMsg('');
    const res = await fetch(`/api/orders/item/${itemId}/review`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rating, comment }),
    });
    const data = await res.json();
    setBusy(false);
    if (data.status === 'success') {
      setRows((rs) => rs.map((r) => ({ ...r, items: r.items.map((i) => (i.id === itemId ? { ...i, rating } : i)) })));
      setReviewing(null);
      setComment('');
    } else {
      setMsg(data.message ?? 'Review failed.');
    }
  }

  return (
    <div className="mt-8 space-y-6">
      {msg && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{msg}</p>}
      {rows.map((r) => (
        <div key={r.id} className="card p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="font-bold text-stone-800">Order #{r.id}</p>
              <p className="text-sm text-stone-500">
                {new Date(r.created_at).toLocaleString()} · {r.method === 'gcash' ? 'GCash' : 'COD'} · ₱{r.total.toFixed(2)}
              </p>
            </div>
            <span className="badge bg-stone-100 capitalize text-stone-600">{r.status.replace(/_/g, ' ')}</span>
          </div>
          <div className="mt-4 divide-y divide-stone-100">
            {r.items.map((i) => (
              <div key={i.id} className="py-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-stone-700">{i.name} × {i.qty}</p>
                    <p className="text-xs capitalize text-stone-400">
                      {i.status.replace(/_/g, ' ')}
                      {i.rating != null && <span className="ml-2 text-amber-500">{'★'.repeat(i.rating)}{'☆'.repeat(5 - i.rating)}</span>}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-brand-700">₱{(i.price * i.qty).toFixed(2)}</span>
                    {i.status === 'shipped' && (
                      <button className="btn-outline px-3 py-1 text-xs" disabled={busy} onClick={() => receive(i.id)}>Mark received</button>
                    )}
                    {i.status === 'received' && i.rating == null && (
                      <button className="btn-outline px-3 py-1 text-xs" onClick={() => { setReviewing(i.id); setRating(5); setComment(''); }}>★ Review</button>
                    )}
                  </div>
                </div>
                {i.tracking && <TrackingCard tracking={i.tracking} courier={i.courier ?? 'J&T Express'} status={i.status === 'received' ? 'delivered' : 'in_transit'} />}
                {reviewing === i.id && (
                  <div className="mt-3 space-y-2 rounded-lg bg-stone-50 p-3">
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <button key={s} type="button" className={`text-2xl ${s <= rating ? 'text-amber-500' : 'text-stone-300'}`} onClick={() => setRating(s)}>★</button>
                      ))}
                    </div>
                    <textarea className="input h-16" placeholder="Share your experience (optional)" value={comment} onChange={(e) => setComment(e.target.value)} />
                    <div className="flex gap-2">
                      <button className="btn-primary px-3 py-1 text-xs" disabled={busy} onClick={() => submitReview(i.id)}>Submit review</button>
                      <button className="btn-outline px-3 py-1 text-xs" onClick={() => setReviewing(null)}>Cancel</button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
      {rows.length === 0 && <p className="text-stone-500">No orders yet.</p>}
    </div>
  );
}
