'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface Item { id: number; name: string; image_path: string | null; artisan: string; flagged_reason: string }

export default function ModerationClient({ initial }: { initial: Item[] }) {
  const router = useRouter();
  const [items, setItems] = useState(initial);
  const [rejecting, setRejecting] = useState<Item | null>(null);
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);

  async function act(item: Item, action: 'approve' | 'reject', why?: string) {
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/moderation/${item.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, reason: why }),
      });
      if (res.ok) {
        setItems((xs) => xs.filter((x) => x.id !== item.id));
        setRejecting(null);
        setReason('');
        router.refresh();
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-6 space-y-3">
      {items.map((it) => (
        <div key={it.id} className="card flex flex-wrap items-center gap-4 p-4">
          <div className="relative h-24 w-32 shrink-0 overflow-hidden rounded-lg bg-brand-50">
            {it.image_path ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={it.image_path} alt={it.name} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full items-center justify-center text-3xl">🧶</div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-stone-800">{it.name}</p>
            <p className="text-sm text-stone-500">by {it.artisan}</p>
            <p className="mt-1 text-xs text-amber-700">{it.flagged_reason}</p>
          </div>
          <div className="flex gap-2">
            <button className="btn-primary px-4 py-2 text-sm" disabled={busy} onClick={() => act(it, 'approve')}>
              ✓ Approve
            </button>
            <button className="btn-outline px-4 py-2 text-sm text-red-600" onClick={() => { setRejecting(it); setReason(''); }}>
              Reject
            </button>
          </div>
        </div>
      ))}

      {rejecting && (
        <div className="card border-red-200 p-4">
          <p className="text-sm font-semibold text-stone-700">Reject “{rejecting.name}” — tell the artisan why</p>
          <textarea
            className="input mt-2 h-20 w-full text-sm"
            placeholder="e.g. The photo doesn't show the handicraft — please upload a clear photo of the product itself."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
          <div className="mt-2 flex gap-2">
            <button className="btn-primary px-4 py-2 text-sm" disabled={busy} onClick={() => act(rejecting, 'reject', reason)}>
              Send rejection
            </button>
            <button className="btn-outline px-4 py-2 text-sm" onClick={() => setRejecting(null)}>Cancel</button>
          </div>
        </div>
      )}

      {items.length === 0 && (
        <p className="card mt-6 p-8 text-center text-sm text-stone-500">
          🎉 Queue is clear — no images awaiting review.
        </p>
      )}
    </div>
  );
}
