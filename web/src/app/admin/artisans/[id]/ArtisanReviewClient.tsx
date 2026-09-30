'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { RuleResult } from '@/lib/verificationRules';

interface EvidenceItem {
  key: string;
  label: string;
  submitted: boolean;
  url: string | null;
}

interface Props {
  artisan: {
    id: number; name: string; email: string; phone: string | null; location: string | null;
    craft_type: string | null; business_name: string | null; bio: string | null; status: string;
    id_number: string | null; dob: string | null; has_id_docs: boolean; has_proof: boolean;
  };
  productCount: number;
  rules: RuleResult[];
  ruleSummary: { canApprove: boolean; text: string };
  evidence: EvidenceItem[];
}

const RULE_MARK = { pass: '✓', warn: '⚠', fail: '✗' } as const;
const RULE_STYLE = {
  pass: 'bg-leaf-50 text-leaf-700',
  warn: 'bg-amber-50 text-amber-700',
  fail: 'bg-red-50 text-red-700',
} as const;

export default function ArtisanReviewClient({ artisan, productCount, rules, ruleSummary, evidence }: Props) {
  const router = useRouter();
  const [form, setForm] = useState(artisan);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const [zoom, setZoom] = useState<EvidenceItem | null>(null);

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
      body: JSON.stringify({ artisan_id: artisan.id, status, rule_snapshot: rules.map((r) => `${r.id}:${r.status}`).join(',') }),
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
        {/* Deterministic verification checklist (Objective 2) */}
        <div className="card p-5">
          <div className="flex items-center justify-between">
            <h2 className="font-serif text-lg font-bold text-brand-900">Verification checklist</h2>
            <span className={`badge ${ruleSummary.canApprove ? 'bg-leaf-50 text-leaf-700' : 'bg-red-50 text-red-700'}`}>
              {ruleSummary.canApprove ? 'Rules satisfied' : 'Incomplete'}
            </span>
          </div>
          <p className="mt-1 text-xs text-stone-500">{ruleSummary.text}</p>
          <ul className="mt-3 space-y-1.5">
            {rules.map((r) => (
              <li key={r.id} className="flex items-start gap-2 text-sm">
                <span className={`mt-0.5 flex h-5 w-8 shrink-0 items-center justify-center rounded text-xs font-bold ${RULE_STYLE[r.status]}`}>
                  {RULE_MARK[r.status]}
                </span>
                <span className="min-w-0">
                  <span className="font-medium text-stone-700">{r.id} · {r.label}</span>
                  <span className="block text-xs text-stone-400">{r.detail}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* Evidence viewer — signed URLs, tap to zoom */}
        <div className="card p-5">
          <h2 className="font-serif text-lg font-bold text-brand-900">Submitted evidence</h2>
          <p className="mt-1 text-xs text-stone-500">Private documents, viewable by admins only (links expire in 5 minutes).</p>
          <div className="mt-3 grid grid-cols-3 gap-2">
            {evidence.map((e) => (
              <div key={e.key} className="rounded-xl border border-stone-200 p-2 text-center">
                <p className="mb-1 text-[11px] font-medium text-stone-500">{e.label}</p>
                {e.url ? (
                  <button type="button" onClick={() => setZoom(e)} className="block w-full">
                    <img src={e.url} alt={e.label} className="h-20 w-full rounded object-cover" />
                  </button>
                ) : (
                  <div className="flex h-20 w-full items-center justify-center rounded bg-stone-50 text-xl text-stone-300">
                    {e.submitted ? '🔒' : '—'}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="card p-5">
          <dl className="space-y-1 text-sm text-stone-600">
            <div className="flex justify-between"><dt>Status</dt><dd><span className="badge bg-stone-100 capitalize">{form.status}</span></dd></div>
            <div className="flex justify-between"><dt>ID number</dt><dd className="font-mono text-xs">{form.id_number ?? '—'}</dd></div>
            <div className="flex justify-between"><dt>Date of birth</dt><dd>{form.dob ?? '—'}</dd></div>
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

      {/* Full-size evidence modal */}
      {zoom && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setZoom(null)}>
          <div className="max-h-full max-w-2xl overflow-auto rounded-xl bg-white p-3" onClick={(e) => e.stopPropagation()}>
            <p className="mb-2 text-sm font-semibold text-stone-700">{zoom.label}</p>
            <img src={zoom.url ?? ''} alt={zoom.label} className="max-h-[70vh] rounded-lg" />
            <div className="mt-2 text-right">
              <button className="btn-outline px-3 py-1 text-xs" onClick={() => setZoom(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
