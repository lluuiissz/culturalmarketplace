'use client';

import { useState } from 'react';

export default function SettingsClient({ initial }: { initial: Record<string, string> }) {
  const [form, setForm] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');

  function set(k: string, v: string) { setForm((f) => ({ ...f, [k]: v })); }

  async function save() {
    setBusy(true);
    setMsg('');
    const res = await fetch('/api/admin/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ settings: form }),
    });
    const data = await res.json();
    setBusy(false);
    setMsg(data.status === 'success' ? 'Settings saved.' : 'Save failed.');
  }

  return (
    <div className="mt-6 max-w-2xl space-y-4">
      <div className="card grid grid-cols-2 gap-3 p-5">
        <div><label className="mb-1 block text-xs text-stone-500">Platform name</label><input className="input" value={form.platform_name} onChange={(e) => set('platform_name', e.target.value)} /></div>
        <div><label className="mb-1 block text-xs text-stone-500">Contact email</label><input className="input" value={form.contact_email} onChange={(e) => set('contact_email', e.target.value)} /></div>
        <div><label className="mb-1 block text-xs text-stone-500">Commission rate (%)</label><input className="input" type="number" min="0" max="100" value={form.commission_rate} onChange={(e) => set('commission_rate', e.target.value)} /></div>
        <div><label className="mb-1 block text-xs text-stone-500">Shipping fee (₱)</label><input className="input" type="number" min="0" value={form.shipping_fee} onChange={(e) => set('shipping_fee', e.target.value)} /></div>
      </div>
      <div className="card space-y-3 p-5">
        <div><label className="mb-1 block text-xs text-stone-500">Terms & conditions</label><textarea className="input h-28" value={form.terms_conditions} onChange={(e) => set('terms_conditions', e.target.value)} /></div>
        <div><label className="mb-1 block text-xs text-stone-500">Privacy policy</label><textarea className="input h-28" value={form.privacy_policy} onChange={(e) => set('privacy_policy', e.target.value)} /></div>
      </div>
      <button className="btn-primary" disabled={busy} onClick={save}>Save settings</button>
      {msg && <p className="text-sm text-stone-600">{msg}</p>}
    </div>
  );
}
