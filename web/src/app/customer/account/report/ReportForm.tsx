'use client';

import { useState } from 'react';
import Link from 'next/link';

type ReportType = 'product' | 'artisan' | 'experience';
type Option = { id: number; name: string };

const TYPE_LABEL: Record<ReportType, string> = {
  product: 'product',
  artisan: 'artisan',
  experience: 'workshop',
};

export default function ReportForm({
  prefill,
  options,
}: {
  prefill: { type: ReportType; id: number; name: string } | null;
  options: Record<ReportType, Option[]>;
}) {
  const [type, setType] = useState<ReportType>(prefill?.type ?? 'product');
  const [reportedId, setReportedId] = useState<string>(prefill ? String(prefill.id) : '');
  const [reason, setReason] = useState('');
  const [msg, setMsg] = useState('');
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!reportedId) {
      setMsg(`Please choose the ${TYPE_LABEL[type]} you are reporting.`);
      return;
    }
    setBusy(true);
    setMsg('');
    const res = await fetch('/api/customer/account/report', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reported_type: type, reported_id: Number(reportedId), reason }),
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

  const label = 'mb-1 block text-xs font-semibold uppercase tracking-wider text-[#3D3028]';

  return (
    <form
      onSubmit={submit}
      className="space-y-4 rounded-2xl border border-[#D6D0C9] bg-white p-5 shadow-sm sm:p-6"
    >
      {prefill ? (
        /* Arrived from a Report button: show the name, no ID needed */
        <div className="rounded-xl border border-[#E8DCCB] bg-[#FCF9F4] p-3">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-[#71675F]">
            You are reporting this {TYPE_LABEL[prefill.type]}
          </p>
          <p className="mt-0.5 text-sm font-bold text-[#3D3028]">{prefill.name}</p>
          <Link
            href="/customer/account/report"
            className="mt-1 inline-block text-[11px] font-medium text-[#8B0000] underline"
          >
            Report something else
          </Link>
        </div>
      ) : (
        <>
          <div>
            <label className={label}>What are you reporting?</label>
            <select
              className="input border-[#D6D0C9]"
              value={type}
              onChange={(e) => {
                setType(e.target.value as ReportType);
                setReportedId('');
              }}
            >
              <option value="product">A product listing</option>
              <option value="artisan">An artisan</option>
              <option value="experience">A workshop/experience</option>
            </select>
          </div>

          <div>
            <label className={label}>Which {TYPE_LABEL[type]}?</label>
            <select
              className="input border-[#D6D0C9]"
              value={reportedId}
              onChange={(e) => setReportedId(e.target.value)}
              required
            >
              <option value="">Select a {TYPE_LABEL[type]}…</option>
              {options[type].map((o) => (
                <option key={o.id} value={o.id}>
                  {o.name}
                </option>
              ))}
            </select>
          </div>
        </>
      )}

      <div>
        <label className={label}>Describe the issue</label>
        <textarea
          className="input h-28 border-[#D6D0C9]"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
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