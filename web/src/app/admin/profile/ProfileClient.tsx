'use client';

import { useState } from 'react';

export default function ProfileClient({ initial }: { initial: { name: string; email: string } }) {
  const [form, setForm] = useState(initial);
  const [pw, setPw] = useState({ current_password: '', new_password: '' });
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const [pwMsg, setPwMsg] = useState('');

  async function saveProfile() {
    setBusy(true);
    setMsg('');
    const res = await fetch('/api/admin/profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'update', name: form.name }),
    });
    const data = await res.json();
    setBusy(false);
    setMsg(data.status === 'success' ? 'Profile saved.' : 'Save failed.');
  }

  async function changePassword() {
    setBusy(true);
    setPwMsg('');
    const res = await fetch('/api/admin/profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'password', ...pw }),
    });
    const data = await res.json();
    setBusy(false);
    setPwMsg(data.status === 'success' ? 'Password changed.' : data.message ?? 'Change failed.');
    if (data.status === 'success') setPw({ current_password: '', new_password: '' });
  }

  return (
    <div className="mt-6 grid gap-6 lg:grid-cols-2">
      <div className="card space-y-3 p-5">
        <h2 className="font-serif text-lg font-bold text-brand-900">Details</h2>
        <div>
          <label className="mb-1 block text-xs text-stone-500">Name</label>
          <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </div>
        <div>
          <label className="mb-1 block text-xs text-stone-500">Email (login)</label>
          <input className="input bg-stone-50" value={form.email} disabled />
        </div>
        <button className="btn-primary" disabled={busy} onClick={saveProfile}>Save</button>
        {msg && <p className="text-sm text-stone-600">{msg}</p>}
      </div>

      <div className="card space-y-3 p-5">
        <h2 className="font-serif text-lg font-bold text-brand-900">Change password</h2>
        <div>
          <label className="mb-1 block text-xs text-stone-500">Current password</label>
          <input className="input" type="password" value={pw.current_password} onChange={(e) => setPw({ ...pw, current_password: e.target.value })} />
        </div>
        <div>
          <label className="mb-1 block text-xs text-stone-500">New password (min 8 chars)</label>
          <input className="input" type="password" value={pw.new_password} onChange={(e) => setPw({ ...pw, new_password: e.target.value })} />
        </div>
        <button className="btn-primary" disabled={busy} onClick={changePassword}>Update password</button>
        {pwMsg && <p className="text-sm text-stone-600">{pwMsg}</p>}
      </div>
    </div>
  );
}
