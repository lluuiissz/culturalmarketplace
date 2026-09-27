'use client';

import { useState } from 'react';

export default function ProfileForm({ initial }: { initial: { name: string; email: string } }) {
  const [form, setForm] = useState({ name: initial.name, phone: '', location: '', bio: '' });
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');

  function set(k: string, v: string) { setForm((f) => ({ ...f, [k]: v })); }

  async function save() {
    setBusy(true);
    setMsg('');
    const res = await fetch('/api/customer/account/profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    setBusy(false);
    setMsg(data.status === 'success' ? 'Profile saved.' : 'Save failed.');
  }

  return (
    <div className="card mt-6 space-y-3 p-5">
      <div>
        <label className="mb-1 block text-xs text-stone-500">Email (login)</label>
        <input className="input bg-stone-50" value={initial.email} disabled />
      </div>
      <div>
        <label className="mb-1 block text-xs text-stone-500">Name</label>
        <input className="input" value={form.name} onChange={(e) => set('name', e.target.value)} />
      </div>
      <div>
        <label className="mb-1 block text-xs text-stone-500">Phone</label>
        <input className="input" value={form.phone} onChange={(e) => set('phone', e.target.value)} placeholder="09XXXXXXXXX" />
      </div>
      <div>
        <label className="mb-1 block text-xs text-stone-500">Location</label>
        <input className="input" value={form.location} onChange={(e) => set('location', e.target.value)} />
      </div>
      <div>
        <label className="mb-1 block text-xs text-stone-500">Bio</label>
        <textarea className="input h-20" value={form.bio} onChange={(e) => set('bio', e.target.value)} />
      </div>
      <button className="btn-primary" disabled={busy} onClick={save}>Save profile</button>
      {msg && <p className="text-sm text-stone-600">{msg}</p>}
    </div>
  );
}
