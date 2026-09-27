'use client';

import { useState } from 'react';

interface Row {
  id: number; label: string; full_name: string | null; phone: string | null;
  address: string; landmark: string | null; is_default: boolean;
}

export default function AddressesClient({ initial }: { initial: Row[] }) {
  const [rows, setRows] = useState(initial);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ label: 'Home', full_name: '', phone: '', address: '', landmark: '', is_default: false });
  const [busy, setBusy] = useState(false);

  async function call(body: Record<string, unknown>) {
    setBusy(true);
    await fetch('/api/customer/account/addresses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    setBusy(false);
  }

  async function add() {
    if (!form.address.trim()) return;
    await call({ action: 'create', ...form });
    setRows((rs) => [...rs, { ...form, id: Math.max(0, ...rs.map((r) => r.id)) + 1, full_name: form.full_name || null, phone: form.phone || null, landmark: form.landmark || null }]);
    setAdding(false);
    setForm({ label: 'Home', full_name: '', phone: '', address: '', landmark: '', is_default: false });
  }

  return (
    <div className="mt-6 space-y-3">
      {rows.map((a) => (
        <div key={a.id} className="card p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-semibold text-stone-800">
                {a.label}{a.is_default && <span className="badge ml-2 bg-leaf-500/10 text-leaf-700">default</span>}
              </p>
              <p className="mt-1 text-sm text-stone-600">{a.address}</p>
              <p className="text-xs text-stone-400">{a.full_name}{a.phone ? ` · ${a.phone}` : ''}{a.landmark ? ` · landmark: ${a.landmark}` : ''}</p>
            </div>
            <div className="flex flex-col items-end gap-2">
              {!a.is_default && (
                <button className="btn-outline px-3 py-1 text-xs" disabled={busy} onClick={async () => { await call({ action: 'set-default', id: a.id }); setRows((rs) => rs.map((r) => ({ ...r, is_default: r.id === a.id }))); }}>
                  Set default
                </button>
              )}
              <button className="text-stone-400 hover:text-red-600" disabled={busy}
                onClick={async () => { await call({ action: 'delete', id: a.id }); setRows((rs) => rs.filter((r) => r.id !== a.id)); }}>
                ✕
              </button>
            </div>
          </div>
        </div>
      ))}

      {adding ? (
        <div className="card space-y-3 p-4">
          <div className="grid grid-cols-2 gap-3">
            <input className="input" placeholder="Label (Home, Office…)" value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} />
            <input className="input" placeholder="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </div>
          <input className="input" placeholder="Full name" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
          <textarea className="input h-20" placeholder="Complete address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
          <input className="input" placeholder="Landmark (optional)" value={form.landmark} onChange={(e) => setForm({ ...form, landmark: e.target.value })} />
          <label className="flex items-center gap-2 text-sm text-stone-600">
            <input type="checkbox" checked={form.is_default} onChange={(e) => setForm({ ...form, is_default: e.target.checked })} /> Set as default
          </label>
          <div className="flex gap-2">
            <button className="btn-primary px-3 py-1 text-xs" disabled={busy} onClick={add}>Save address</button>
            <button className="btn-outline px-3 py-1 text-xs" onClick={() => setAdding(false)}>Cancel</button>
          </div>
        </div>
      ) : (
        <button className="btn-outline w-full" onClick={() => setAdding(true)}>+ Add address</button>
      )}
    </div>
  );
}
