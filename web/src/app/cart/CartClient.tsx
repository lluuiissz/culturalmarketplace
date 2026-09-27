'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/Toast';

export interface CartRow {
  id: number; product_id: number; quantity: number; name: string; price: number;
  variant: string | null; purchase_type: string; session?: object | null;
}

// Last removed row, kept in memory so Undo can restore it without re-fetching.
let lastRemoved: CartRow | null = null;

export default function CartClient({ initialItems }: { initialItems: CartRow[] }) {
  const router = useRouter();
  const [items, setItems] = useState(initialItems);
  const [busy, setBusy] = useState(false);
  const toast = useToast();

  const total = items.reduce((s, i) => s + i.price * i.quantity, 0);

  async function updateQty(id: number, quantity: number) {
    setBusy(true);
    setItems((list) => list.map((i) => (i.id === id ? { ...i, quantity } : i)));
    await fetch(`/api/cart/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ quantity }),
    });
    setBusy(false);
    router.refresh();
  }

  // Undo support: remember the removed row so one click restores it.

  async function remove(id: number) {
    const removed = items.find((i) => i.id === id);
    setBusy(true);
    setItems((list) => list.filter((i) => i.id !== id));
    await fetch(`/api/cart/${id}`, { method: 'DELETE' });
    setBusy(false);
    lastRemoved = removed ?? null;
    router.refresh();
    if (removed) {
      toast.success('Removed from cart', { label: 'Undo', onClick: undoRemove });
    }
  }

  // Undo re-adds the exact removed row (same variant/session) via the cart API.
  async function undoRemove() {
    const removed = lastRemoved;
    if (!removed) return;
    lastRemoved = null;
    setBusy(true);
    const res = await fetch('/api/cart', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        product_id: removed.product_id,
        purchase_type: removed.purchase_type,
        quantity: removed.quantity,
        selected_variant: removed.variant,
        selected_session: removed.session ?? null,
      }),
    });
    const data = await res.json();
    setBusy(false);
    if (data.status === 'success') {
      toast.success('Restored to your cart');
      router.refresh();
    } else {
      toast.error(data.message || 'Could not restore the item.');
    }
  }

  // (Undo is invoked directly by the toast action below — no event bridge needed.)

  if (items.length === 0) {
    return (
      <div className="card mt-8 p-10 text-center">
        <div className="text-5xl">🛒</div>
        <p className="mt-4 text-stone-600">Your cart is empty.</p>
        <Link className="btn-primary mt-6" href="/customer/browse">Browse crafts</Link>
      </div>
    );
  }

  return (
    <div className="mt-8 space-y-4">
      {items.map((i) => (
        <div key={i.id} className="card flex items-center gap-4 p-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-brand-100 text-3xl">🧶</div>
          <div className="flex-1">
            <p className="font-semibold text-stone-800">{i.name}</p>
            <p className="text-sm text-stone-500">
              {i.variant ? `${i.variant} · ` : ''}{i.purchase_type === 'workshop' ? 'Workshop booking' : 'Product'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button className="btn-outline px-2 py-1" disabled={busy} onClick={() => updateQty(i.id, Math.max(1, i.quantity - 1))}>−</button>
            <span className="w-8 text-center font-semibold">{i.quantity}</span>
            <button className="btn-outline px-2 py-1" disabled={busy} onClick={() => updateQty(i.id, i.quantity + 1)}>+</button>
          </div>
          <div className="w-24 text-right font-bold text-brand-700">₱{(i.price * i.quantity).toFixed(2)}</div>
          <button className="text-stone-400 hover:text-red-600" aria-label="Remove" onClick={() => remove(i.id)}>✕</button>
        </div>
      ))}
      <div className="card flex items-center justify-between p-5">
        <div>
          <p className="text-sm text-stone-500">Total</p>
          <p className="text-2xl font-bold text-brand-700">₱{total.toFixed(2)}</p>
        </div>
        <Link className="btn-primary" href="/checkout">Proceed to checkout →</Link>
      </div>
    </div>
  );
}
