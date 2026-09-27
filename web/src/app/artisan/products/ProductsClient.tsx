'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export interface Row {
  id: number; name: string; price: number; stock: number;
  status: string; has_tutorial: boolean; nfc_tag_id: string | null;
}

export default function ProductsClient({ initial }: { initial: Row[] }) {
  const router = useRouter();
  const [rows, setRows] = useState(initial);
  const [busy, setBusy] = useState(false);

  async function toggle(id: number) {
    setBusy(true);
    await fetch(`/api/artisan/products/${id}/toggle`, { method: 'POST' });
    setRows((rs) => rs.map((r) => (r.id === id ? { ...r, status: r.status === 'active' ? 'inactive' : 'active' } : r)));
    setBusy(false);
    router.refresh();
  }

  return (
    <div className="mt-8 space-y-3">
      {rows.map((p) => (
        <div key={p.id} className="card flex flex-wrap items-center justify-between gap-3 p-4">
          <div className="min-w-[200px] flex-1">
            <p className="font-semibold text-stone-800">
              {p.name} {p.has_tutorial && <span className="badge ml-1 bg-leaf-500/10 text-leaf-700">Workshop</span>}
            </p>
            <p className="text-sm text-stone-500">
              ₱{p.price.toFixed(2)} · {p.stock} in stock
              {p.nfc_tag_id ? ` · NFC ${p.nfc_tag_id}` : ' · no NFC tag'}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className={`badge ${p.status === 'active' ? 'bg-leaf-500/10 text-leaf-700' : 'bg-stone-100 text-stone-500'}`}>{p.status}</span>
            <button className="btn-outline px-3 py-1 text-xs" disabled={busy} onClick={() => toggle(p.id)}>Toggle</button>
            <Link className="btn-outline px-3 py-1 text-xs" href={`/artisan/products/edit/${p.id}`}>Edit</Link>
            {!p.nfc_tag_id && <Link className="btn-outline px-3 py-1 text-xs" href={`/artisan/products/${p.id}/nfc`}>Register NFC</Link>}
          </div>
        </div>
      ))}
      {rows.length === 0 && <p className="text-stone-500">No products yet — add your first craft!</p>}
    </div>
  );
}
