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
    return (
      <p className="rounded-2xl border border-[#D6B56D] bg-[#FFF9EF] px-5 py-4 text-sm font-medium text-[#9A681D] shadow-sm">
        Thank you — your report was submitted and will be reviewed by our team.
      </p>
    );
  }

  return (
    <form
      onSubmit={submit}
      className="space-y-4 rounded-2xl border border-[#D6D0C9] bg-white p-5 shadow-sm sm:p-6"
    >
      <div>
        <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-[#3D3028]">
          What are you reporting?
        </label>
        <select
          className="input border-[#D6D0C9]"
          value={form.reported_type}
          onChange={(e) => setForm({ ...form, reported_type: e.target.value })}
        >
          <option value="product">A product listing</option>
          <option value="artisan">An artisan</option>
          <option value="experience">A workshop/experience</option>
        </select>
      </div>

      <div>
        <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-[#3D3028]">
          ID of the {form.reported_type}
        </label>
        <input
          className="input border-[#D6D0C9]"
          type="number"
          min="1"
          value={form.reported_id}
          onChange={(e) => setForm({ ...form, reported_id: e.target.value })}
          required
        />
        <p className="mt-1 text-[11px] text-[#71675F]">Shown on its page URL.</p>
      </div>

      <div>
        <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-[#3D3028]">
          Describe the issue
        </label>
        <textarea
          className="input h-28 border-[#D6D0C9]"
          value={form.reason}
          onChange={(e) => setForm({ ...form, reason: e.target.value })}
          placeholder="e.g. Inappropriate Content&#10;&#10;Details: …"
          required
        />
      </div>

      {msg && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700">
          {msg}
        </p>
      )}

      <button
        className="btn-primary w-full py-2.5 text-xs font-bold uppercase tracking-wider shadow-sm"
        disabled={busy}
        type="submit"
      >
        {busy ? 'Submitting…' : 'Submit report'}
      </button>
    </form>
  );
}