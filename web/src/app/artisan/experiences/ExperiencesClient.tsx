'use client';

import Link from 'next/link';
import { useState } from 'react';

interface Row {
  id: number; name: string; price: number; capacity: number | null; status: string;
  dates: Array<{ date: string; time_start: string; time_end: string; location?: string }>;
}

export default function ExperiencesClient({ initial }: { initial: Row[] }) {
  const [rows, setRows] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');

  async function saveDates(id: number, dates: Row['dates']) {
    setBusy(true);
    setMsg('');
    const res = await fetch('/api/artisan/tutorial-dates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ product_id: id, dates }),
    });
    const data = await res.json();
    setBusy(false);
    setMsg(data.status === 'success' ? 'Sessions saved.' : data.message ?? 'Save failed.');
  }

  function updateRow(id: number, dates: Row['dates']) {
    setRows((rs) => rs.map((r) => (r.id === id ? { ...r, dates } : r)));
  }

  return (
    <div className="mt-6 space-y-5">
      {msg && <p className="rounded-lg bg-leaf-500/10 px-3 py-2 text-sm text-leaf-700">{msg}</p>}
      {rows.map((r) => (
        <div key={r.id} className="card p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="font-semibold text-stone-800">{r.name}</p>
              <p className="text-sm text-stone-500">₱{r.price.toFixed(2)} · capacity {r.capacity ?? '—'} · <span className="capitalize">{r.status.replace(/_/g, ' ')}</span></p>
            </div>
            <Link href={`/artisan/tutorial-attendees/${r.id}`} className="btn-outline px-3 py-1 text-xs whitespace-nowrap">👥 Attendees</Link>
          </div>

          <div className="mt-4 space-y-2">
            {r.dates.map((d, i) => (
              <div key={i} className="flex flex-wrap items-center gap-2 rounded-lg bg-stone-50 p-2 text-sm">
                <input type="date" className="input w-40" value={d.date}
                  onChange={(e) => updateRow(r.id, r.dates.map((x, xi) => (xi === i ? { ...x, date: e.target.value } : x)))} />
                <input type="time" className="input w-32" value={d.time_start}
                  onChange={(e) => updateRow(r.id, r.dates.map((x, xi) => (xi === i ? { ...x, time_start: e.target.value } : x)))} />
                <input type="time" className="input w-32" value={d.time_end}
                  onChange={(e) => updateRow(r.id, r.dates.map((x, xi) => (xi === i ? { ...x, time_end: e.target.value } : x)))} />
                <input className="input flex-1" placeholder="Venue / location" value={d.location ?? ''}
                  onChange={(e) => updateRow(r.id, r.dates.map((x, xi) => (xi === i ? { ...x, location: e.target.value } : x)))} />
                <button className="text-red-500 hover:text-red-700" aria-label="Remove session"
                  onClick={() => updateRow(r.id, r.dates.filter((_, xi) => xi !== i))}>✕</button>
              </div>
            ))}
          </div>

          <div className="mt-3 flex gap-2">
            <button className="btn-outline px-3 py-1 text-xs"
              onClick={() => updateRow(r.id, [...r.dates, { date: '', time_start: '', time_end: '', location: '' }])}>
              + Add session
            </button>
            <button className="btn-primary px-3 py-1 text-xs" disabled={busy} onClick={() => saveDates(r.id, r.dates)}>Save sessions</button>
          </div>
        </div>
      ))}
    </div>
  );
}
