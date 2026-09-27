'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/Toast';
import type { Product } from '@/lib/types';

export default function ProductDetailClient({ product, loggedIn }: { product: Product; loggedIn: boolean }) {
  const router = useRouter();
  const [variant, setVariant] = useState('');
  const [session, setSession] = useState(0);
  const [qty, setQty] = useState(1);
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);
  const toast = useToast();

  const variations = product.variations_data ?? [];
  const grouped = variations.reduce<Record<string, typeof variations>>((acc, v) => {
    (acc[v.typeLabel] ??= []).push(v);
    return acc;
  }, {});

  async function addToCart(purchaseType: 'product' | 'workshop' | 'bundle') {
    setBusy(true);
    setMsg('');
    const res = await fetch('/api/cart', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        product_id: product.id,
        purchase_type: purchaseType,
        quantity: qty,
        selected_variant: variant || null,
        selected_session: purchaseType !== 'product' ? product.tutorial_dates?.[session] ?? null : null,
      }),
    });
    const data = await res.json();
    setBusy(false);
    if (data.status === 'success') {
      toast.success('Added to your cart', { label: 'View cart →', href: '/cart' });
      setMsg('');
    } else {
      setMsg(data.message || 'Could not add to cart.');
    }
  }

  async function messageArtisan() {
    setBusy(true);
    setMsg('');
    const res = await fetch('/api/chat/open', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ product_id: product.id }),
    });
    const data = await res.json();
    setBusy(false);
    if (data.status === 'success') router.push(`/customer/account/messages?c=${data.conversation_id}`);
    else setMsg(data.message || 'Please sign in as a customer to chat.');
    // (non-success surfaces inline below so the message stays next to the button)
  }

  return (
    <div className="mt-6 space-y-4">
      {msg && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{msg}</p>}

      {Object.entries(grouped).map(([label, opts]) => (
        <div key={label}>
          <label className="mb-1 block text-sm font-medium text-stone-700">{label}</label>
          <div className="flex flex-wrap gap-2">
            {opts.map((v) => {
              const val = `${v.typeLabel}: ${v.name}`;
              return (
                <button
                  key={v.name}
                  type="button"
                  onClick={() => setVariant(val)}
                  className={`rounded-lg border px-3 py-1.5 text-sm ${variant === val ? 'border-brand-600 bg-brand-500 text-white' : 'border-stone-300 bg-white text-stone-600 hover:border-brand-400'}`}
                >
                  {v.name}
                </button>
              );
            })}
          </div>
        </div>
      ))}

      {product.has_tutorial && product.tutorial_dates?.length ? (
        <div>
          <label className="mb-1 block text-sm font-medium text-stone-700">Choose a session</label>
          <select className="input" value={session} onChange={(e) => setSession(Number(e.target.value))}>
            {product.tutorial_dates.map((d, i) => (
              <option key={i} value={i}>{d.date} · {d.time_start}–{d.time_end}</option>
            ))}
          </select>
        </div>
      ) : null}

      <div className="flex items-center gap-3">
        <label className="text-sm font-medium text-stone-700">Qty</label>
        <input
          type="number" min={1} max={99} value={qty}
          onChange={(e) => setQty(Math.max(1, Number(e.target.value)))}
          className="input w-20"
        />
      </div>

      <div className="flex flex-wrap gap-3">
        <button className="btn-primary" disabled={busy} onClick={() => addToCart('product')}>
          🛒 Add to cart — ₱{(Number(product.price) + (variations.find((v) => `${v.typeLabel}: ${v.name}` === variant)?.price ?? 0)).toFixed(2)}
        </button>
        {product.has_tutorial && (
          <button className="btn-outline" disabled={busy} onClick={() => addToCart('workshop')}>
            🧑‍🏫 Book workshop — ₱{Number(product.tutorial_price ?? 0).toFixed(2)}
          </button>
        )}
        <button className="btn-outline" disabled={busy} onClick={messageArtisan}>💬 Message artisan</button>
      </div>
      {!loggedIn && <p className="text-xs text-stone-400">You&apos;ll be asked to sign in as a customer first.</p>}
    </div>
  );
}
