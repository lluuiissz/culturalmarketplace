'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface Row { id: number; name: string; email: string; phone: string | null; location: string | null; order_count: number; status: string }

export default function CustomersClient({ initial }: { initial: Row[] }) {
  const router = useRouter();
  const [rows, setRows] = useState(initial);
  const [editing, setEditing] = useState<Row | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');

  async function act(action: string, id: number, fields?: Record<string, string>) {
    setBusy(true);
    setMsg('');
    const res = await fetch('/api/admin/customers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, id, ...fields }),
    });
    const data = await res.json();
    setBusy(false);
    if (data.status !== 'success') { setMsg(data.message ?? 'Action failed.'); return; }
    if (action === 'delete') setRows((rs) => rs.filter((r) => r.id !== id));
    if (action === 'toggle') setRows((rs) => rs.map((r) => (r.id === id ? { ...r, status: r.status === 'active' ? 'disabled' : 'active' } : r)));
    if (action === 'update' && editing) {
      setRows((rs) => rs.map((r) => (r.id === id ? { ...r, ...editing } : r)));
      setEditing(null);
    }
    router.refresh();
  }

  return (
    <div className="mt-6 space-y-3">
      {msg && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{msg}</p>}
      {rows.map((c) => (
        <div key={c.id} className="card p-4">
          {editing?.id === c.id ? (
            <div className="space-y-2">
              <input className="input" value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} placeholder="Name" />
              <input className="input" value={editing.phone ?? ''} onChange={(e) => setEditing({ ...editing, phone: e.target.value })} placeholder="Phone" />
              <input className="input" value={editing.location ?? ''} onChange={(e) => setEditing({ ...editing, location: e.target.value })} placeholder="Location" />
              <div className="flex gap-2">
                <button className="btn-primary px-3 py-1 text-xs" disabled={busy} onClick={() => act('update', c.id, { name: editing.name, phone: editing.phone ?? '', location: editing.location ?? '' })}>Save</button>
                <button className="btn-outline px-3 py-1 text-xs" onClick={() => setEditing(null)}>Cancel</button>
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-semibold text-stone-800">{c.name} {c.status === 'disabled' && <span className="badge bg-red-100 text-red-700">disabled</span>}</p>
                <p className="text-sm text-stone-500">{c.email} · {c.phone ?? '—'} · {c.location ?? '—'} · {c.order_count} order{c.order_count === 1 ? '' : 's'}</p>
              </div>
              <div className="flex gap-2">
                <button className="btn-outline px-3 py-1 text-xs" onClick={() => setEditing({ ...c })}>Edit</button>
                <button className="btn-outline px-3 py-1 text-xs" disabled={busy} onClick={() => act('toggle', c.id)}>{c.status === 'active' ? 'Disable' : 'Enable'}</button>
                <button className="btn-danger px-3 py-1 text-xs" disabled={busy} onClick={() => { if (confirm(`Delete customer ${c.name}? This cannot be undone.`)) act('delete', c.id); }}>Delete</button>
              </div>
            </div>
          )}
        </div>
      ))}
      {rows.length === 0 && <p className="text-sm text-stone-500">No customers found.</p>}
    </div>
  );
}
