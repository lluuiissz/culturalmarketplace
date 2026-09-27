'use client';

import { useState } from 'react';

interface Row {
  id: number; reporter: string; type: string; reported_id: number; reported_name: string;
  reason: string; status: string; action_taken: string | null; created: string;
}

export default function ReportsClient({ initial }: { initial: Row[] }) {
  const [rows, setRows] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');

  async function act(id: number, action: string) {
    setBusy(true);
    setMsg('');
    const res = await fetch('/api/admin/reports', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ report_id: id, action }),
    });
    const data = await res.json();
    setBusy(false);
    if (data.status !== 'success') { setMsg(data.message ?? 'Action failed.'); return; }
    setRows((rs) => rs.map((r) => {
      if (r.id !== id) return r;
      if (action === 'investigate') return { ...r, status: 'investigating' };
      if (action === 'resolve') return { ...r, status: 'resolved', action_taken: 'Resolved by admin' };
      if (action === 'warn') return { ...r, status: 'investigating', action_taken: 'Warning sent' };
      if (action === 'suspend-listing') return { ...r, status: 'resolved', action_taken: 'Listing suspended' };
      if (action === 'suspend-account') return { ...r, status: 'resolved', action_taken: 'Account suspended' };
      return r;
    }));
  }

  return (
    <div className="mt-6 space-y-4">
      {msg && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{msg}</p>}
      {rows.map((r) => (
        <div key={r.id} className="card p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="font-semibold text-stone-800">
                {r.type === 'product' ? '📦' : r.type === 'artisan' ? '🧑‍🎨' : '🧑‍🏫'} {r.reported_name}
                <span className="badge ml-2 bg-stone-100 capitalize text-stone-600">{r.type}</span>
              </p>
              <p className="text-xs text-stone-400">by {r.reporter} · {r.created}</p>
            </div>
            <span className={`badge ${r.status === 'resolved' ? 'bg-leaf-500/10 text-leaf-700' : r.status === 'investigating' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>
              {r.status}
            </span>
          </div>
          <p className="mt-3 whitespace-pre-line rounded-lg bg-stone-50 p-3 text-sm text-stone-700">{r.reason}</p>
          {r.action_taken && <p className="mt-2 text-xs text-stone-500">Action taken: {r.action_taken}</p>}
          <div className="mt-3 flex flex-wrap gap-2">
            {r.status === 'pending' && <button className="btn-outline px-3 py-1 text-xs" disabled={busy} onClick={() => act(r.id, 'investigate')}>Investigate</button>}
            <button className="btn-outline px-3 py-1 text-xs" disabled={busy} onClick={() => act(r.id, 'warn')}>Send warning</button>
            {r.type === 'product' && r.status !== 'resolved' && (
              <button className="btn-outline px-3 py-1 text-xs" disabled={busy} onClick={() => act(r.id, 'suspend-listing')}>Suspend listing</button>
            )}
            {r.type === 'artisan' && r.status !== 'resolved' && (
              <button className="btn-outline px-3 py-1 text-xs" disabled={busy} onClick={() => act(r.id, 'suspend-account')}>Suspend account</button>
            )}
            {r.status !== 'resolved' && <button className="btn-primary px-3 py-1 text-xs" disabled={busy} onClick={() => act(r.id, 'resolve')}>Resolve</button>}
          </div>
        </div>
      ))}
      {rows.length === 0 && <p className="text-sm text-stone-500">No reports.</p>}
    </div>
  );
}
