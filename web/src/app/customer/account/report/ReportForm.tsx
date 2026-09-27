'use client';

import { useState } from 'react';

export default function ReportForm() {
  const [form, setForm] = useState({ reported_type: 'product', reported_id: '', reason: '' });
  const [msg, setMsg] = useState('');
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg('');
    const res = await fetch('/api/customer/account/report', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, reported_id: Number(form.reported_id) }),
    });
    const data = await res.json();
    setBusy(false);
    if (data.status === 'success') setDone(true);
    else setMsg(data.message ?? 'Submission failed.');
  }

  if (done) {
    return <p className="mt-8 rounded-lg bg-leaf-500/10 px-4 py-3 text-sm text-leaf-700">Thank you — your report was submitted and will be reviewed by our team.</p>;
  }

  return (
    <form onSubmit={submit} className="card mt-6 space-y-3 p-5">
      <div>
        <label className="mb-1 block text-xs text-stone-500">What are you reporting?</label>
        <select className="input" value={form.reported_type} onChange={(e) => setForm({ ...form, reported_type: e.target.value })}>
          <option value="product">A product listing</option>
          <option value="artisan">An artisan</option>
          <option value="experience">A workshop/experience</option>
        </select>
      </div>
      <div>
        <label className="mb-1 block text-xs text-stone-500">ID of the {form.reported_type} (shown on its page URL)</label>
        <input className="input" type="number" min="1" value={form.reported_id} onChange={(e) => setForm({ ...form, reported_id: e.target.value })} required />
      </div>
      <div>
        <label className="mb-1 block text-xs text-stone-500">Describe the issue</label>
        <textarea className="input h-28" value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })}
          placeholder="e.g. Inappropriate Content&#10;&#10;Details: …" required />
      </div>
      {msg && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{msg}</p>}
      <button className="btn-primary w-full" disabled={busy} type="submit">{busy ? 'Submitting…' : 'Submit report'}</button>
    </form>
  );
}
