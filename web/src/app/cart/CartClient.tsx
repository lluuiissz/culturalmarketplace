'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/Toast';

export interface CartRow {
  id: number;
  product_id: number;
  quantity: number;
  name: string;
  price: number;
  variant: string | null;
  purchase_type: string;
  session?: object | null;
}

// Last removed row, kept in memory so Undo can restore it without re-fetching.
let lastRemoved: CartRow | null = null;

export default function CartClient({ initialItems }: { initialItems: CartRow[] }) {
  const router = useRouter();
  const [items, setItems] = useState(initialItems);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(
    () => new Set(initialItems.map((i) => i.id))
  );
  const [busy, setBusy] = useState(false);
  const toast = useToast();

  const isAllSelected = items.length > 0 && selectedIds.size === items.length;
  const selectedItems = items.filter((i) => selectedIds.has(i.id));
  const selectedTotal = selectedItems.reduce((s, i) => s + i.price * i.quantity, 0);

  function toggleItem(id: number) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    if (isAllSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(items.map((i) => i.id)));
    }
  }

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

  async function remove(id: number) {
    const removed = items.find((i) => i.id === id);
    setBusy(true);
    setItems((list) => list.filter((i) => i.id !== id));
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
    await fetch(`/api/cart/${id}`, { method: 'DELETE' });
    setBusy(false);
    lastRemoved = removed ?? null;
    router.refresh();
    if (removed) {
      toast.success('Removed from cart', { label: 'Undo', onClick: undoRemove });
    }
  }

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
      {/* Select All Bar */}
      <div className="card flex items-center justify-between p-4 bg-brand-50/60 border border-brand-200/80">
        <label className="flex items-center gap-3 cursor-pointer text-sm font-semibold text-stone-800 select-none">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-stone-300 text-brand-600 focus:ring-brand-500 cursor-pointer accent-brand-600"
            checked={isAllSelected}
            onChange={toggleAll}
          />
          <span>Select All Items ({items.length})</span>
        </label>
        <span className="text-xs font-medium text-stone-500">
          {selectedIds.size} of {items.length} item{items.length === 1 ? '' : 's'} marked for checkout
        </span>
      </div>

      {/* Cart Items List */}
      <div className="space-y-3">
        {items.map((i) => {
          const isSelected = selectedIds.has(i.id);
          return (
            <div
              key={i.id}
              className={`card flex items-center gap-4 p-4 transition border ${
                isSelected ? 'border-brand-300 bg-white shadow-xs' : 'border-stone-200 bg-stone-50/50 opacity-80'
              }`}
            >
              <input
                type="checkbox"
                aria-label={`Select ${i.name}`}
                className="h-4 w-4 rounded border-stone-300 text-brand-600 focus:ring-brand-500 cursor-pointer accent-brand-600 shrink-0"
                checked={isSelected}
                onChange={() => toggleItem(i.id)}
              />

              <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-brand-100 text-3xl shrink-0">
                {i.purchase_type === 'workshop' ? '🧑‍🏫' : '🧶'}
              </div>

              <div className="flex-1 min-w-0">
                <p className="font-semibold text-stone-800 truncate">{i.name}</p>
                <p className="text-xs text-stone-500 mt-0.5">
                  {i.variant ? `${i.variant} · ` : ''}
                  {i.purchase_type === 'workshop' ? (
                    <span className="badge bg-leaf-500/10 text-leaf-700 font-medium">Workshop booking</span>
                  ) : (
                    'Handcrafted Product'
                  )}
                </p>
                <p className="text-xs text-stone-400 mt-0.5">₱{i.price.toFixed(2)} each</p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  className="btn-outline px-2 py-1 text-xs"
                  disabled={busy}
                  onClick={() => updateQty(i.id, Math.max(1, i.quantity - 1))}
                >
                  −
                </button>
                <span className="w-8 text-center text-sm font-semibold">{i.quantity}</span>
                <button
                  className="btn-outline px-2 py-1 text-xs"
                  disabled={busy}
                  onClick={() => updateQty(i.id, i.quantity + 1)}
                >
                  +
                </button>
              </div>

              <div className="w-24 text-right font-bold text-brand-700">
                ₱{(i.price * i.quantity).toFixed(2)}
              </div>

              <button
                className="text-stone-400 hover:text-red-600 p-1"
                aria-label="Remove"
                onClick={() => remove(i.id)}
              >
                ✕
              </button>
            </div>
          );
        })}
      </div>

      {/* Checkout Summary Bar */}
      <div className="card flex flex-wrap items-center justify-between gap-4 p-5 sticky bottom-4 shadow-lg border-2 border-brand-200 bg-white">
        <div>
          <p className="text-xs text-stone-500 uppercase tracking-wider font-semibold">
            Selected Subtotal ({selectedItems.length} item{selectedItems.length === 1 ? '' : 's'})
          </p>
          <p className="text-2xl font-bold text-brand-700">₱{selectedTotal.toFixed(2)}</p>
          {selectedIds.size === 0 && (
            <p className="text-xs text-amber-600 font-medium mt-0.5">
              ⚠️ Please check at least 1 item above to proceed.
            </p>
          )}
        </div>

        {selectedItems.length > 0 ? (
          <Link
            className="btn-primary px-6 py-2.5 text-base font-bold shadow-md"
            href={`/checkout?items=${Array.from(selectedIds).join(',')}`}
          >
            Proceed to checkout ({selectedItems.length}) →
          </Link>
        ) : (
          <button
            type="button"
            disabled
            className="btn-primary px-6 py-2.5 text-base font-semibold opacity-50 cursor-not-allowed"
          >
            Select items to checkout →
          </button>
        )}
      </div>
    </div>
  );
}
