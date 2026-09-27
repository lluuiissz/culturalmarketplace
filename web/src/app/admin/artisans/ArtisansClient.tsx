'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function ArtisansClient({
  pending, approved,
}: {
  pending: Array<{ id: number; name: string; email: string; craft_type: string | null; location: string | null }>;
  approved: Array<{ id: number; name: string; email: string; craft_type: string | null; productCount: number }>;
}) {
  const router = useRouter();
  const [pendingList, setPendingList] = useState(pending);
  const [approvedList, setApprovedList] = useState(approved);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');

  async function decide(id: number, decision: 'approve' | 'reject') {
    setBusy(true);
    setMsg('');
    const res = await fetch('/api/admin/artisan-status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ artisan_id: id, status: decision === 'approve' ? 'approved' : 'rejected' }),
    });
    const data = await res.json();
    setBusy(false);
    if (data.status === 'success') {
      const moved = pendingList.find((a) => a.id === id);
      setPendingList((l) => l.filter((a) => a.id !== id));
      if (moved && decision === 'approve') {
        setApprovedList((l) => [{ id: moved.id, name: moved.name, email: moved.email, craft_type: moved.craft_type, productCount: 0 }, ...l]);
      }
      router.refresh();
    } else {
      setMsg(data.message ?? 'Action failed.');
    }
  }

  async function suspend(id: number) {
    setBusy(true);
    await fetch('/api/admin/artisan-status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ artisan_id: id, status: 'suspended' }),
    });
    setBusy(false);
    router.refresh();
  }

  return (
    <div className="mt-6 space-y-8">
      {msg && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{msg}</p>}

      <section>
        <h2 className="font-serif text-xl font-bold text-brand-900">Pending applications ({pendingList.length})</h2>
        <div className="mt-3 space-y-3">
          {pendingList.map((a) => (
            <div key={a.id} className="card flex flex-wrap items-center justify-between gap-3 p-4">
              <div>
                <Link href={`/admin/artisans/${a.id}`} className="font-semibold text-stone-800 hover:text-brand-700 hover:underline">{a.name}</Link>
                <p className="text-sm text-stone-500">{a.email} · {a.craft_type ?? '—'} · {a.location ?? '—'}</p>
              </div>
              <div className="flex gap-2">
                <button className="btn-primary px-3 py-1 text-xs" disabled={busy} onClick={() => decide(a.id, 'approve')}>Approve</button>
                <button className="btn-danger px-3 py-1 text-xs" disabled={busy} onClick={() => decide(a.id, 'reject')}>Reject</button>
              </div>
            </div>
          ))}
          {pendingList.length === 0 && <p className="text-sm text-stone-500">No pending applications.</p>}
        </div>
      </section>

      <section>
        <h2 className="font-serif text-xl font-bold text-brand-900">Approved artisans ({approvedList.length})</h2>
        <div className="mt-3 space-y-3">
          {approvedList.map((a) => (
            <div key={a.id} className="card flex flex-wrap items-center justify-between gap-3 p-4">
              <div>
                <Link href={`/admin/artisans/${a.id}`} className="font-semibold text-stone-800 hover:text-brand-700 hover:underline">{a.name}</Link>
                <p className="text-sm text-stone-500">{a.email} · {a.productCount} product{a.productCount === 1 ? '' : 's'}</p>
              </div>
              <button className="btn-outline px-3 py-1 text-xs" disabled={busy} onClick={() => suspend(a.id)}>Suspend</button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
