'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import NfcWriter from '@/components/NfcWriter';

interface Row { id: number; name: string; tag: string; status: string }

const STATUS_BADGE: Record<string, string> = {
  active: 'bg-leaf-500/10 text-leaf-700',
  awaiting_write: 'bg-amber-100 text-amber-700',
  lost: 'bg-red-100 text-red-700',
  inactive: 'bg-stone-100 text-stone-500',
};

export default function NfcAdminClient({ tagged, untagged }: { tagged: Row[]; untagged: Array<{ id: number; name: string }> }) {
  const router = useRouter();
  const [rows, setRows] = useState(tagged);
  const [writingId, setWritingId] = useState<number | null>(null);
  const [replacing, setReplacing] = useState<Row | null>(null);
  const [newTag, setNewTag] = useState('');
  const [attaching, setAttaching] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function post(body: Record<string, unknown>) {
    setBusy(true);
    setError('');
    try {
      const res = await fetch('/api/admin/nfc', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message ?? 'Something went wrong.');
        return null;
      }
      return data;
    } finally {
      setBusy(false);
    }
  }

  async function setStatus(id: number, status: string) {
    const ok = await post({ product_id: id, action: 'status', status });
    if (ok) setRows((rs) => rs.map((r) => (r.id === id ? { ...r, status } : r)));
  }

  async function attach(productId: number) {
    const data = await post({ product_id: productId, action: 'register' });
    if (!data) return;
    setRows((rs) => [{ id: productId, name: untagged.find((u) => u.id === productId)?.name ?? `#${productId}`, tag: data.tag_id, status: 'awaiting_write' }, ...rs]);
    setWritingId(productId);
    router.refresh();
  }

  async function replace() {
    if (!replacing || !newTag.trim()) return;
    const ok = await post({ product_id: replacing.id, action: 'replace', new_tag_id: newTag.trim() });
    if (ok) {
      setRows((rs) => rs.map((r) => (r.id === replacing.id ? { ...r, tag: newTag.trim(), status: 'active' } : r)));
      setReplacing(null);
      setNewTag('');
    }
  }

  const remaining = untagged.filter((u) => !rows.some((r) => r.id === u.id));

  return (
    <div className="mt-6 space-y-3">
      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      {/* Attach a tag to a product that doesn't have one */}
      <div className="card p-4">
        <p className="text-sm font-semibold text-stone-700">Attach a tag to a product</p>
        {remaining.length > 0 ? (
          <div className="mt-2 flex flex-wrap gap-2">
            {remaining.map((u) => (
              <button key={u.id} type="button" className="btn-outline px-3 py-1.5 text-xs" disabled={busy} onClick={() => attach(u.id)}>
                + {u.name}
              </button>
            ))}
          </div>
        ) : (
          <p className="mt-1 text-sm text-stone-500">All products have tags.</p>
        )}
      </div>

      {rows.map((r) => (
        <div key={r.id} className="card p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-semibold text-stone-800">{r.name}</p>
              <p className="font-mono text-xs text-stone-500">{r.tag}</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className={`badge ${STATUS_BADGE[r.status] ?? 'bg-stone-100 text-stone-500'}`}>{r.status}</span>
              {r.status !== 'active' && <button className="btn-outline px-3 py-1 text-xs" disabled={busy} onClick={() => setStatus(r.id, 'active')}>Set active</button>}
              {r.status !== 'lost' && <button className="btn-outline px-3 py-1 text-xs" disabled={busy} onClick={() => setStatus(r.id, 'lost')}>Mark lost</button>}
              <button className="btn-outline px-3 py-1 text-xs" onClick={() => setWritingId(writingId === r.id ? null : r.id)}>
                {writingId === r.id ? 'Hide writer' : 'Write card'}
              </button>
              <button className="btn-outline px-3 py-1 text-xs" onClick={() => { setReplacing(r); setNewTag(''); }}>Replace ID</button>
            </div>
          </div>
          {writingId === r.id && (
            <div className="mt-3">
              <NfcWriter tagId={r.tag} />
            </div>
          )}
          {replacing?.id === r.id && (
            <div className="mt-3 flex w-full flex-wrap items-end gap-2">
              <div className="flex-1">
                <label className="mb-1 block text-xs text-stone-500">New tag ID for {r.name}</label>
                <input className="input font-mono" value={newTag} onChange={(e) => setNewTag(e.target.value)} placeholder="e.g. CM-1A2B3C4D" />
              </div>
              <button className="btn-primary px-3 py-1 text-xs" disabled={busy} onClick={replace}>Save</button>
              <button className="btn-outline px-3 py-1 text-xs" onClick={() => setReplacing(null)}>Cancel</button>
            </div>
          )}
        </div>
      ))}
      {rows.length === 0 && <p className="text-sm text-stone-500">No NFC-tagged products yet.</p>}
    </div>
  );
}
