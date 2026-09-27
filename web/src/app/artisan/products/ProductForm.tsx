'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Variation } from '@/lib/types';

interface FormState {
  name: string; description: string; price: string; stock_quantity: string; category: string;
  has_tutorial: boolean; tutorial_title: string; tutorial_description: string;
  tutorial_price: string; tutorial_capacity: string; tutorial_fee_type: 'paid' | 'free';
}

const VARIATION_TYPES = [
  { type: 'size', typeLabel: 'Size' },
  { type: 'color', typeLabel: 'Color' },
  { type: 'material', typeLabel: 'Material' },
  { type: 'others', typeLabel: 'Pattern' },
];

export default function ProductForm({
  mode, productId, categories, initial, initialHasVariations, initialVariations,
}: {
  mode: 'create' | 'edit';
  productId?: number;
  categories: Array<{ id: number; name: string }>;
  initial?: Partial<FormState>;
  initialHasVariations?: boolean;
  initialVariations?: Variation[];
}) {
  // A product saved before categories were managed may hold a value outside the
  // list — keep it selectable (marked legacy) so editing never silently rewrites it.
  const initialCat = (initial?.category ?? '').trim();
  const legacyCat =
    initialCat && !categories.some((c) => c.name.toLowerCase() === initialCat.toLowerCase())
      ? initialCat
      : null;
  const router = useRouter();
  const [form, setForm] = useState<FormState>({
    name: '', description: '', price: '', stock_quantity: '', category: '',
    has_tutorial: false, tutorial_title: '', tutorial_description: '',
    tutorial_price: '', tutorial_capacity: '', tutorial_fee_type: 'paid',
    ...initial,
  });
  const [hasVariations, setHasVariations] = useState(initialHasVariations ?? false);
  const [variations, setVariations] = useState<Variation[]>(initialVariations ?? []);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  function set<K extends keyof FormState>(k: K, v: FormState[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');
    const payload: Record<string, unknown> = {
      ...form,
      price: Number(form.price) || 0,
      stock_quantity: Number(form.stock_quantity) || 0,
      tutorial_price: form.tutorial_price === '' ? null : Number(form.tutorial_price),
      tutorial_capacity: form.tutorial_capacity === '' ? null : Number(form.tutorial_capacity),
      has_variations: hasVariations,
      variations_data: hasVariations ? variations : null,
    };
    if (mode === 'create') {
      const res = await fetch('/api/artisan/products', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
      });
      const data = await res.json();
      setBusy(false);
      if (data.status === 'success') {
        // Photos first (the product must exist before images can upload), then NFC.
        router.push(`/artisan/products/${data.id}/media-setup`);
        return;
      }
      setError(data.message || 'Could not save.');
    } else {
      // Edit path: same payload as create — full field coverage.
      const res = await fetch(`/api/artisan/products/${productId}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      setBusy(false);
      if (res.ok) { router.push('/artisan/products'); return; }
      setError('Could not save changes.');
    }
  }

  return (
    <form onSubmit={submit} className="mt-6 space-y-5">
      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      <div className="card space-y-4 p-5">
        <div>
          <label className="mb-1 block text-sm font-medium text-stone-700">Product name</label>
          <input className="input" value={form.name} onChange={(e) => set('name', e.target.value)} required />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-stone-700">Description</label>
          <textarea className="input h-24" value={form.description} onChange={(e) => set('description', e.target.value)} />
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-stone-700">Price (₱)</label>
            <input className="input" type="number" min="0" step="0.01" value={form.price} onChange={(e) => set('price', e.target.value)} required />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-stone-700">Stock</label>
            <input className="input" type="number" min="0" value={form.stock_quantity} onChange={(e) => set('stock_quantity', e.target.value)} required />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-stone-700">Category</label>
            <select
              className={`input ${form.category ? 'border-leaf-500/60' : 'border-stone-300'}`}
              value={form.category}
              onChange={(e) => set('category', e.target.value)}
              required
            >
              <option value="" disabled>Select a category…</option>
              {legacyCat && <option value={legacyCat}>{legacyCat} (legacy — please update)</option>}
              {categories.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
            </select>
            <p className="mt-1 text-xs text-stone-400">Buyers filter the marketplace by this — pick the closest craft type.</p>
          </div>
        </div>
      </div>

      <div className="card space-y-3 p-5">
        <label className="flex items-center gap-2 text-sm font-semibold text-stone-700">
          <input type="checkbox" checked={hasVariations} onChange={(e) => setHasVariations(e.target.checked)} />
          This product has variations (sizes, colors…)
        </label>
        {hasVariations && (
          <div className="space-y-3">
            {variations.map((v, idx) => (
              <div key={idx} className="flex flex-wrap items-end gap-2 rounded-lg bg-stone-50 p-3">
                <div>
                  <label className="block text-xs text-stone-500">Type</label>
                  <select
                    className="input mt-1 w-32"
                    value={v.type}
                    onChange={(e) => {
                      const t = VARIATION_TYPES.find((x) => x.type === e.target.value)!;
                      setVariations((vs) => vs.map((x, i) => (i === idx ? { ...x, type: t.type, typeLabel: t.typeLabel } : x)));
                    }}
                  >
                    {VARIATION_TYPES.map((t) => <option key={t.type} value={t.type}>{t.typeLabel}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-stone-500">Name</label>
                  <input className="input mt-1 w-28" value={v.name}
                    onChange={(e) => setVariations((vs) => vs.map((x, i) => (i === idx ? { ...x, name: e.target.value } : x)))} />
                </div>
                <div>
                  <label className="block text-xs text-stone-500">Stock</label>
                  <input className="input mt-1 w-20" type="number" value={v.stock}
                    onChange={(e) => setVariations((vs) => vs.map((x, i) => (i === idx ? { ...x, stock: Number(e.target.value) } : x)))} />
                </div>
                <div>
                  <label className="block text-xs text-stone-500">Extra price (₱)</label>
                  <input className="input mt-1 w-24" type="number" value={v.price}
                    onChange={(e) => setVariations((vs) => vs.map((x, i) => (i === idx ? { ...x, price: Number(e.target.value) } : x)))} />
                </div>
                <button type="button" className="text-red-500 hover:text-red-700" onClick={() => setVariations((vs) => vs.filter((_, i) => i !== idx))}>✕</button>
              </div>
            ))}
            <button type="button" className="btn-outline" onClick={() => setVariations((vs) => [...vs, { name: '', stock: 10, price: 0, type: 'size', typeLabel: 'Size' }])}>
              + Add variation
            </button>
          </div>
        )}
      </div>

      <div className="card space-y-4 p-5">
        <label className="flex items-center gap-2 text-sm font-semibold text-stone-700">
          <input type="checkbox" checked={form.has_tutorial} onChange={(e) => set('has_tutorial', e.target.checked)} />
          Offer a workshop / tutorial experience for this craft
        </label>
        {form.has_tutorial && (
          <div className="space-y-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-stone-700">Workshop title</label>
              <input className="input" value={form.tutorial_title} onChange={(e) => set('tutorial_title', e.target.value)} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-stone-700">Description</label>
              <textarea className="input h-20" value={form.tutorial_description} onChange={(e) => set('tutorial_description', e.target.value)} />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-stone-700">Fee (₱)</label>
                <input className="input" type="number" min="0" step="0.01" value={form.tutorial_price} onChange={(e) => set('tutorial_price', e.target.value)} />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-stone-700">Capacity</label>
                <input className="input" type="number" min="1" value={form.tutorial_capacity} onChange={(e) => set('tutorial_capacity', e.target.value)} />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-stone-700">Fee type</label>
                <select className="input" value={form.tutorial_fee_type} onChange={(e) => set('tutorial_fee_type', e.target.value as 'paid' | 'free')}>
                  <option value="paid">Paid</option>
                  <option value="free">Free</option>
                </select>
              </div>
            </div>
            <p className="text-xs text-stone-400">Session dates can be added after saving (dates picker ships with the calendar page).</p>
          </div>
        )}
      </div>

      <button className="btn-primary" disabled={busy} type="submit">
        {busy ? 'Saving…' : mode === 'create' ? 'Save & add photos' : 'Save changes'}
      </button>
      {mode === 'create' && (
        <p className="text-xs text-stone-400">Photos and NFC tags are optional — you can add them any time from the product page.</p>
      )}
    </form>
  );
}
