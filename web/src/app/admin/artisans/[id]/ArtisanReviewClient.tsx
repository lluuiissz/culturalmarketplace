'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface Props {
  artisan: {
    id: number; name: string; email: string; phone: string | null; location: string | null;
    craft_type: string | null; business_name: string | null; bio: string | null; status: string;
    id_number: string | null; dob: string | null; has_id_docs: boolean; has_proof: boolean;
  };
  productCount: number;
}

export default function ArtisanReviewClient({ artisan, productCount }: Props) {
  const router = useRouter();
  const [form, setForm] = useState(artisan);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');

  async function save() {
    setBusy(true);
    setMsg('');
    const res = await fetch('/api/admin/artisans', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'update', id: artisan.id,
        name: form.name, phone: form.phone, location: form.location,
        craft_type: form.craft_type, business_name: form.business_name, bio: form.bio,
      }),
    });
    const data = await res.json();
    setBusy(false);
    setMsg(data.status === 'success' ? 'Saved.' : data.message ?? 'Save failed.');
    router.refresh();
  }

  async function setStatus(status: string) {
    setBusy(true);
    await fetch('/api/admin/artisan-status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ artisan_id: artisan.id, status }),
    });
    setBusy(false);
    setForm((f) => ({ ...f, status }));
    router.refresh();
  }

  async function remove() {
    if (!confirm(`Delete artisan ${artisan.name} and all their products? This cannot be undone.`)) return;
    setBusy(true);
    await fetch('/api/admin/artisans', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'delete', id: artisan.id }),
    });
    router.push('/admin/artisans');
  }

  return (
    <div className="mt-6 grid gap-6 lg:grid-cols-2">
      <div className="card space-y-3 p-5">
        <h2 className="font-serif text-lg font-bold text-brand-900">Profile details</h2>
        <div className="grid grid-cols-2 gap-3">
          <div><label className="mb-1 block text-xs text-stone-500">Name</label><input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
          <div><label className="mb-1 block text-xs text-stone-500">Email</label><input className="input bg-stone-50" value={form.email} disabled /></div>
          <div><label className="mb-1 block text-xs text-stone-500">Phone</label><input className="input" value={form.phone ?? ''} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
          <div><label className="mb-1 block text-xs text-stone-500">Craft type</label><input className="input" value={form.craft_type ?? ''} onChange={(e) => setForm({ ...form, craft_type: e.target.value })} /></div>
          <div><label className="mb-1 block text-xs text-stone-500">Business name</label><input className="input" value={form.business_name ?? ''} onChange={(e) => setForm({ ...form, business_name: e.target.value })} /></div>
          <div><label className="mb-1 block text-xs text-stone-500">Location</label><input className="input" value={form.location ?? ''} onChange={(e) => setForm({ ...form, location: e.target.value })} /></div>
        </div>
        <div><label className="mb-1 block text-xs text-stone-500">Bio</label><textarea className="input h-20" value={form.bio ?? ''} onChange={(e) => setForm({ ...form, bio: e.target.value })} /></div>
        <button className="btn-primary" disabled={busy} onClick={save}>Save changes</button>
        {msg && <p className="text-sm text-stone-600">{msg}</p>}
      </div>

      <div className="space-y-4">
        <div className="card p-5">
          <h2 className="font-serif text-lg font-bold text-brand-900">Verification</h2>
          <dl className="mt-3 space-y-1 text-sm text-stone-600">
            <div className="flex justify-between"><dt>Status</dt><dd><span className="badge bg-stone-100 capitalize">{form.status}</span></dd></div>
            <div className="flex justify-between"><dt>ID number</dt><dd className="font-mono text-xs">{form.id_number ?? '—'}</dd></div>
            <div className="flex justify-between"><dt>Date of birth</dt><dd>{form.dob ?? '—'}</dd></div>
            <div className="flex justify-between"><dt>ID documents</dt><dd>{form.has_id_docs ? '📎 uploaded' : '—'}</dd></div>
            <div className="flex justify-between"><dt>Proof of craft</dt><dd>{form.has_proof ? '📎 uploaded' : '—'}</dd></div>
            <div className="flex justify-between"><dt>Products</dt><dd>{productCount}</dd></div>
          </dl>
          <div className="mt-4 flex flex-wrap gap-2">
            {form.status !== 'approved' && <button className="btn-primary px-3 py-1 text-xs" disabled={busy} onClick={() => setStatus('approved')}>Approve</button>}
            {form.status !== 'suspended' && <button className="btn-outline px-3 py-1 text-xs" disabled={busy} onClick={() => setStatus('suspended')}>Suspend</button>}
            {form.status !== 'rejected' && <button className="btn-outline px-3 py-1 text-xs" disabled={busy} onClick={() => setStatus('rejected')}>Reject</button>}
            <button className="btn-danger px-3 py-1 text-xs" disabled={busy} onClick={remove}>Delete</button>
          </div>
        </div>
      </div>
    </div>
  );
}
