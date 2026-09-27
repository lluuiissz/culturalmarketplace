'use client';

import { useState } from 'react';

export default function ProfileForm({ initial }: { initial: Record<string, string> }) {
  const [form, setForm] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');

  function set(k: string, v: string) { setForm((f) => ({ ...f, [k]: v })); }

  async function save() {
    setBusy(true);
    setMsg('');
    const res = await fetch('/api/artisan/profile', {
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
      <div className="grid grid-cols-2 gap-3">
        <div><label className="mb-1 block text-xs text-stone-500">Name</label><input className="input" value={form.name} onChange={(e) => set('name', e.target.value)} /></div>
        <div><label className="mb-1 block text-xs text-stone-500">Business name</label><input className="input" value={form.business_name} onChange={(e) => set('business_name', e.target.value)} /></div>
        <div><label className="mb-1 block text-xs text-stone-500">Craft type</label><input className="input" value={form.craft_type} onChange={(e) => set('craft_type', e.target.value)} /></div>
        <div><label className="mb-1 block text-xs text-stone-500">Phone</label><input className="input" value={form.phone} onChange={(e) => set('phone', e.target.value)} /></div>
      </div>
      <div><label className="mb-1 block text-xs text-stone-500">Location</label><input className="input" value={form.location} onChange={(e) => set('location', e.target.value)} /></div>
      <div><label className="mb-1 block text-xs text-stone-500">Bio</label><textarea className="input h-24" value={form.bio} onChange={(e) => set('bio', e.target.value)} /></div>
      <button className="btn-primary" disabled={busy} onClick={save}>Save profile</button>
      {msg && <p className="text-sm text-stone-600">{msg}</p>}
    </div>
  );
}
