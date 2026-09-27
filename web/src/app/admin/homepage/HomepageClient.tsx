'use client';

import { useState } from 'react';

export default function HomepageClient({
  initial, announcements,
}: {
  initial: { homepage_banner_title: string; homepage_banner_subtitle: string; contact_email: string };
  announcements: Array<{ date: string; type: string; message: string }>;
}) {
  const [form, setForm] = useState(initial);
  const [ann, setAnn] = useState({ type: 'new_feature', message: '' });
  const [list, setList] = useState(announcements);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');

  async function saveBanner() {
    setBusy(true);
    setMsg('');
    const res = await fetch('/api/admin/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ settings: form }),
    });
    const data = await res.json();
    setBusy(false);
    setMsg(data.status === 'success' ? 'Homepage updated.' : 'Save failed.');
  }

  async function sendAnnouncement() {
    if (!ann.message.trim()) return;
    setBusy(true);
    const res = await fetch('/api/admin/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ announcement: ann }),
    });
    const data = await res.json();
    setBusy(false);
    if (data.status === 'success') {
      setList((l) => [{ date: new Date().toISOString(), type: ann.type, message: ann.message }, ...l]);
      setAnn({ type: 'new_feature', message: '' });
    }
  }

  return (
    <div className="mt-6 grid gap-6 lg:grid-cols-2">
      <div className="card space-y-3 p-5">
        <h2 className="font-serif text-lg font-bold text-brand-900">Hero banner</h2>
        <div>
          <label className="mb-1 block text-xs text-stone-500">Title</label>
          <input className="input" value={form.homepage_banner_title} onChange={(e) => setForm({ ...form, homepage_banner_title: e.target.value })} />
        </div>
        <div>
          <label className="mb-1 block text-xs text-stone-500">Subtitle</label>
          <textarea className="input h-20" value={form.homepage_banner_subtitle} onChange={(e) => setForm({ ...form, homepage_banner_subtitle: e.target.value })} />
        </div>
        <div>
          <label className="mb-1 block text-xs text-stone-500">Contact email</label>
          <input className="input" value={form.contact_email} onChange={(e) => setForm({ ...form, contact_email: e.target.value })} />
        </div>
        <button className="btn-primary" disabled={busy} onClick={saveBanner}>Save</button>
        {msg && <p className="text-sm text-stone-600">{msg}</p>}
      </div>

      <div className="card space-y-3 p-5">
        <h2 className="font-serif text-lg font-bold text-brand-900">Post announcement</h2>
        <select className="input" value={ann.type} onChange={(e) => setAnn({ ...ann, type: e.target.value })}>
          <option value="new_feature">New feature</option>
          <option value="event">Event</option>
          <option value="maintenance">Maintenance</option>
        </select>
        <textarea className="input h-24" value={ann.message} onChange={(e) => setAnn({ ...ann, message: e.target.value })} placeholder="Announcement message…" />
        <button className="btn-primary" disabled={busy} onClick={sendAnnouncement}>Publish</button>

        <h3 className="mt-4 text-sm font-semibold text-stone-700">Recent</h3>
        <div className="space-y-2">
          {list.map((a, i) => (
            <div key={i} className="rounded-lg bg-stone-50 p-3 text-sm">
              <span className="badge mr-2 bg-stone-200 text-stone-600">{a.type}</span>
              {a.message}
            </div>
          ))}
          {list.length === 0 && <p className="text-sm text-stone-400">No announcements yet.</p>}
        </div>
      </div>
    </div>
  );
}
