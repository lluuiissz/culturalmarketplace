'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function PaymentsClient({ initial }: { initial: Array<{ id: number; total: number; reference: string | null; created: string; items: string[] }> }) {
  const router = useRouter();
  const [rows, setRows] = useState(initial);
  const [busy, setBusy] = useState(false);

  async function verify(id: number, decision: 'verify' | 'fail') {
    setBusy(true);
    await fetch('/api/admin/payment-status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ order_id: id, decision }),
    });
    setRows((rs) => rs.filter((r) => r.id !== id));
    setBusy(false);
    router.refresh();
  }

  return (
    <div className="mt-6 space-y-3">
      {rows.map((r) => (
        <div key={r.id} className="card flex flex-wrap items-center justify-between gap-3 p-4">
          <div>
            <p className="font-semibold text-stone-800">Order #{r.id} · ₱{r.total.toFixed(2)}</p>
            <p className="text-sm text-stone-500">{r.items.join(', ')} · ref {r.reference ?? '—'} · {r.created}</p>
          </div>
          <div className="flex gap-2">
            <button className="btn-primary px-3 py-1 text-xs" disabled={busy} onClick={() => verify(r.id, 'verify')}>Confirm payment</button>
            <button className="btn-danger px-3 py-1 text-xs" disabled={busy} onClick={() => verify(r.id, 'fail')}>Mark failed</button>
          </div>
        </div>
      ))}
      {rows.length === 0 && <p className="text-sm text-stone-500">Nothing awaiting verification.</p>}
    </div>
  );
}
