'use client';

import { useState } from 'react';

export default function CategoriesClient({ initial }: { initial: Array<{ id: number; name: string; type: string }> }) {
  const [rows, setRows] = useState(initial);
  const [name, setName] = useState('');
  const [type, setType] = useState<'product' | 'experience'>('product');
  const [busy, setBusy] = useState(false);

  async function add() {
    if (!name.trim()) return;
    setBusy(true);
    const res = await fetch('/api/admin/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'add', name, type }),
    });
    const data = await res.json();
    setBusy(false);
    if (data.status === 'success') {
      setRows((rs) => [...rs, { id: Math.max(0, ...rs.map((r) => r.id)) + 1, name: name.trim(), type }]);
      setName('');
    } else {
      setMsg(data.message ?? 'Could not add category.');
    }
  }

  const [msg, setMsg] = useState('');

  async function remove(id: number) {
    setBusy(true);
    setMsg('');
    const res = await fetch('/api/admin/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'delete', id }),
    });
    const data = await res.json();
    setBusy(false);
    if (data.status === 'success') {
      setRows((rs) => rs.filter((r) => r.id !== id));
    } else {
      setMsg(data.message ?? 'Could not delete category.');
    }
  }

  return (
    <div className="mt-6 max-w-xl space-y-4">
      {msg && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{msg}</p>}
      <div className="card flex flex-wrap items-end gap-2 p-4">
        <div className="flex-1">
          <label className="mb-1 block text-xs text-stone-500">New category</label>
          <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Pottery" />
        </div>
        <div>
          <label className="mb-1 block text-xs text-stone-500">Type</label>
          <select className="input w-36" value={type} onChange={(e) => setType(e.target.value as 'product' | 'experience')}>
            <option value="product">Product</option>
            <option value="experience">Experience</option>
          </select>
        </div>
        <button className="btn-primary" disabled={busy} onClick={add}>+ Add</button>
      </div>

      <div className="card divide-y divide-stone-100">
        {rows.map((c) => (
          <div key={c.id} className="flex items-center justify-between p-3">
            <div>
              <span className="font-medium text-stone-700">{c.name}</span>
              <span className="badge ml-2 bg-stone-100 text-stone-500">{c.type}</span>
            </div>
            <button className="text-stone-400 hover:text-red-600" onClick={() => remove(c.id)} aria-label={`Delete ${c.name}`}>✕</button>
          </div>
        ))}
        {rows.length === 0 && <p className="p-4 text-sm text-stone-500">No categories.</p>}
      </div>
    </div>
  );
}
