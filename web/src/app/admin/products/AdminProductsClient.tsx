'use client';

import { useState } from 'react';

export default function AdminProductsClient({ initial }: { initial: Array<{ id: number; name: string; price: number; status: string; artisan: string; category: string | null }> }) {
  const [rows] = useState(initial);

  return (
    <div className="mt-6 space-y-3">
      {rows.map((p) => (
        <div key={p.id} className="card flex flex-wrap items-center justify-between gap-3 p-4">
          <div>
            <p className="font-semibold text-stone-800">{p.name}</p>
            <p className="text-sm text-stone-500">{p.artisan} · {p.category ?? '—'} · ₱{p.price.toFixed(2)}</p>
          </div>
          <span className={`badge ${p.status === 'active' ? 'bg-leaf-500/10 text-leaf-700' : 'bg-stone-100 text-stone-500'}`}>{p.status}</span>
        </div>
      ))}
      {rows.length === 0 && <p className="text-sm text-stone-500">No products.</p>}
    </div>
  );
}
