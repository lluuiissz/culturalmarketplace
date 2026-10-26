'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export interface OrderItemRow {
  id: number;
  product_id?: number;
  name: string;
  qty: number;
  status: string;
  price: number;
  rating: number | null;
  tracking: string | null;
  courier: string | null;
  purchase_type?: string;
  ticket_code?: string | null;
  selected_session?: {
    date: string;
    time_start: string;
    time_end: string;
    location?: string;
  } | null;
  selected_variant?: string | null;
  attendee_name?: string | null;
}

export interface OrderRow {
  id: number;
  status: string;
  method: string;
  total: number;
  created_at: string;
  items: OrderItemRow[];
}

const SHIPMENT_STEPS = ['created', 'dropped_off', 'in_transit', 'delivered'] as const;

function TrackingCard({ tracking, courier, status }: { tracking: string; courier: string; status: string }) {
  const idx = SHIPMENT_STEPS.indexOf(status as (typeof SHIPMENT_STEPS)[number]);
  return (
    <div className="mt-3 rounded-xl bg-brand-50/60 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">
            {courier || 'J&T Express'} · tracking
          </p>
          <p className="font-mono text-lg font-bold text-brand-800">{tracking}</p>
        </div>
        <a
          className="btn-outline px-3 py-1 text-xs"
          target="_blank"
          rel="noopener noreferrer"
          href={`https://www.jtexpress.ph/track/${encodeURIComponent(tracking)}`}
        >
          Track on J&T ↗
        </a>
      </div>
      {idx >= 0 && (
        <ol className="mt-3 flex items-center">
          {SHIPMENT_STEPS.map((s, i) => (
            <li key={s} className="flex flex-1 items-center last:flex-none">
              <span
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
                  i <= idx ? 'bg-crimson-600 text-white' : 'bg-stone-200 text-stone-400'
                }`}
              >
                {i <= idx ? '✓' : i + 1}
              </span>
              {i < 3 && <span className={`h-0.5 flex-1 ${i < idx ? 'bg-crimson-600' : 'bg-stone-200'}`} />}
            </li>
          ))}
        </ol>
      )}
      <div className="mt-1 flex justify-between text-[10px] text-stone-500">
        <span>Booked</span>
        <span>Drop-off</span>
        <span>In transit</span>
        <span>Delivered</span>
      </div>
    </div>
  );
}

const CANCELLATION_REASONS = [
  'Ordered by mistake',
  'Schedule conflict / Cannot attend workshop',
  'Need to change delivery address',
  'Found an alternative craft item',
  'Decided to purchase later',
  'Other reasons',
];

export default function OrdersClient({ initial }: { initial: OrderRow[] }) {
  const router = useRouter();
  const [rows, setRows] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [reviewing, setReviewing] = useState<number | null>(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Cancellation Modal State
  const [cancellingOrder, setCancellingOrder] = useState<OrderRow | null>(null);
  const [cancelReason, setCancelReason] = useState(CANCELLATION_REASONS[0]);
  const [customReason, setCustomReason] = useState('');

  async function receive(itemId: number) {
    setBusy(true);
    await fetch(`/api/orders/item/${itemId}/receive`, { method: 'POST' });
    setRows((rs) =>
      rs.map((r) => ({
        ...r,
        items: r.items.map((i) => (i.id === itemId ? { ...i, status: 'received' } : i)),
      }))
    );
    setBusy(false);
    router.refresh();
  }

  async function submitReview(itemId: number) {
    setBusy(true);
    setMsg(null);
    const res = await fetch(`/api/orders/item/${itemId}/review`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rating, comment }),
    });
    const data = await res.json();
    setBusy(false);
    if (data.status === 'success') {
      setRows((rs) =>
        rs.map((r) => ({
          ...r,
          items: r.items.map((i) => (i.id === itemId ? { ...i, rating } : i)),
        }))
      );
      setReviewing(null);
      setComment('');
      setMsg({ type: 'success', text: 'Thank you! Your review has been submitted.' });
    } else {
      setMsg({ type: 'error', text: data.message ?? 'Review failed.' });
    }
  }

  async function handleConfirmCancel() {
    if (!cancellingOrder) return;
    setBusy(true);
    setMsg(null);
    const finalReason = cancelReason === 'Other reasons' && customReason.trim() ? customReason.trim() : cancelReason;

    try {
      const res = await fetch('/api/orders/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order_id: cancellingOrder.id, reason: finalReason }),
      });
      const data = await res.json();
      setBusy(false);

      if (data.status === 'success') {
        // Update local state to cancelled
        setRows((rs) =>
          rs.map((r) =>
            r.id === cancellingOrder.id
              ? {
                  ...r,
                  status: 'cancelled',
                  items: r.items.map((i) => ({ ...i, status: 'cancelled' })),
                }
              : r
          )
        );
        setCancellingOrder(null);
        setMsg({ type: 'success', text: `Order #${cancellingOrder.id} has been cancelled successfully.` });
      } else {
        setMsg({ type: 'error', text: data.message || 'Could not cancel order.' });
      }
    } catch {
      setBusy(false);
      setMsg({ type: 'error', text: 'Network error while attempting cancellation.' });
    }
  }

  return (
    <div className="mt-8 space-y-6">
      {msg && (
        <div
          className={`rounded-xl p-4 text-sm font-medium ${
            msg.type === 'success'
              ? 'bg-ochre-50 text-charcoal-900 border border-ochre-300'
              : 'bg-red-50 text-red-800 border border-red-300'
          }`}
        >
          {msg.type === 'success' ? '✅' : '⚠️'} {msg.text}
        </div>
      )}

      {rows.map((r) => {
        const canCancel = r.status === 'pending' || r.status === 'awaiting_payment';
        const hasWorkshop = r.items.some((i) => i.purchase_type === 'workshop' || i.ticket_code);

        return (
          <div
            key={r.id}
            className={`card p-5 border transition ${
              r.status === 'cancelled'
                ? 'border-stone-200 bg-stone-50/70 opacity-80'
                : 'border-stone-200 bg-white hover:border-brand-300 shadow-xs'
            }`}
          >
            {/* Order Header */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-100 pb-3.5">
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-bold text-stone-900 text-base">Order #{r.id}</p>
                  {hasWorkshop && (
                    <span className="badge bg-ochre-100 text-ochre-900 border border-ochre-300 text-[10px] font-bold">
                      🌿 Cultural Workshop
                    </span>
                  )}
                </div>
                <p className="text-xs text-stone-500 mt-0.5">
                  Placed on {new Date(r.created_at).toLocaleString()} · {r.method === 'gcash' ? '📱 GCash' : '💵 Cash on Delivery'} ·{' '}
                  <span className="font-bold text-stone-800">₱{r.total.toFixed(2)}</span>
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`badge uppercase font-bold text-[10px] tracking-wider px-2.5 py-1 ${
                    r.status === 'received' || r.status === 'completed'
                      ? 'bg-charcoal-900 text-ochre-300'
                      : r.status === 'shipped'
                      ? 'bg-ochre-100 text-ochre-800 border border-ochre-300'
                      : r.status === 'cancelled'
                      ? 'bg-red-100 text-red-700'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {r.status.replace(/_/g, ' ')}
                </span>

                <Link
                  href={`/order/receipt/${r.id}`}
                  className="btn-outline px-3 py-1.5 text-xs font-semibold flex items-center gap-1 hover:bg-stone-50"
                  title="View official printable receipt and ticket"
                >
                  <span>🧾</span>
                  <span>Receipt {hasWorkshop ? '& Ticket' : ''}</span>
                </Link>

                {canCancel && (
                  <button
                    type="button"
                    onClick={() => setCancellingOrder(r)}
                    className="btn-outline px-3 py-1.5 text-xs font-semibold text-red-600 border-red-200 hover:bg-red-50 transition"
                  >
                    ✕ Cancel {hasWorkshop ? 'Booking' : 'Order'}
                  </button>
                )}
              </div>
            </div>

            {/* Order Item List */}
            <div className="mt-3 divide-y divide-stone-100">
              {r.items.map((i) => {
                const isItemWorkshop = i.purchase_type === 'workshop';
                const isBundle = i.purchase_type === 'bundle';

                return (
                  <div key={i.id} className="py-3.5 space-y-2">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-sm font-semibold text-stone-800">
                            {i.name} × {i.qty}
                          </p>
                          {isBundle && (
                            <span className="badge bg-amber-100 text-amber-800 text-[10px] font-bold">
                              ✨ Craft + Workshop Bundle
                            </span>
                          )}
                          {i.ticket_code && (
                            <span className="rounded bg-brand-100 px-2 py-0.5 font-mono text-[11px] font-bold text-brand-800 border border-brand-200">
                              🎟️ {i.ticket_code}
                            </span>
                          )}
                        </div>

                        {/* Variant */}
                        {i.selected_variant && (
                          <p className="text-xs text-stone-600">
                            🎨 Variant: <span className="font-medium text-stone-800">{i.selected_variant}</span>
                          </p>
                        )}

                        {/* Attendee Details */}
                        {i.attendee_name && (
                          <p className="text-xs text-stone-600">
                            👤 Attendee: <span className="font-semibold text-stone-800">{i.attendee_name}</span>
                          </p>
                        )}

                        {/* Scheduled Workshop Session Info */}
                        {i.selected_session && (
                          <div className="rounded-lg bg-ochre-50/70 p-2.5 text-xs text-charcoal-900 border border-ochre-200 space-y-1">
                            <p className="font-semibold text-charcoal-900 flex items-center gap-1">
                              <span>📅 Scheduled Session:</span>
                              <span>{i.selected_session.date} ({i.selected_session.time_start}–{i.selected_session.time_end})</span>
                            </p>
                            {i.selected_session.location && (
                              <p className="text-stone-600 flex items-center gap-1">
                                <span>📍 Studio Venue:</span>
                                <span>{i.selected_session.location}</span>
                              </p>
                            )}
                            <div className="pt-0.5">
                              <Link
                                href={`/order/success/${r.id}#venue-guide`}
                                className="inline-flex items-center gap-1 text-[11px] font-semibold text-brand-700 hover:text-brand-900 hover:underline"
                              >
                                <span>🧭</span>
                                <span>Open Interactive Venue Pathfinding & GPS Guide →</span>
                              </Link>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col items-end gap-1.5">
                        <span className="text-sm font-bold text-brand-800 font-mono">
                          ₱{(i.price * i.qty).toFixed(2)}
                        </span>

                        {i.status === 'shipped' && (
                          <button
                            className="btn-outline px-3 py-1 text-xs"
                            disabled={busy}
                            onClick={() => receive(i.id)}
                          >
                            Mark received
                          </button>
                        )}

                        {i.status === 'received' && i.rating == null && (
                          <button
                            className="btn-outline px-3 py-1 text-xs"
                            onClick={() => {
                              setReviewing(i.id);
                              setRating(5);
                              setComment('');
                            }}
                          >
                            ★ Leave Review
                          </button>
                        )}

                        {i.rating != null && (
                          <span className="text-xs text-amber-500 font-medium">
                            {'★'.repeat(i.rating)}{'☆'.repeat(5 - i.rating)} Reviewed
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Tracking Card for Physical Parcels */}
                    {i.tracking && (
                      <TrackingCard
                        tracking={i.tracking}
                        courier={i.courier ?? 'J&T Express'}
                        status={i.status === 'received' ? 'delivered' : 'in_transit'}
                      />
                    )}

                    {/* Review Form */}
                    {reviewing === i.id && (
                      <div className="mt-3 space-y-2 rounded-xl bg-stone-50 p-4 border border-stone-200">
                        <p className="text-xs font-bold uppercase tracking-wider text-stone-700">Write Your Review:</p>
                        <div className="flex gap-1.5">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <button
                              key={s}
                              type="button"
                              className={`text-2xl transition ${s <= rating ? 'text-amber-500 scale-110' : 'text-stone-300'}`}
                              onClick={() => setRating(s)}
                            >
                              ★
                            </button>
                          ))}
                        </div>
                        <textarea
                          className="input h-20 text-xs w-full bg-white"
                          placeholder="Share your experience with this craft or workshop (optional)"
                          value={comment}
                          onChange={(e) => setComment(e.target.value)}
                        />
                        <div className="flex gap-2">
                          <button className="btn-primary px-4 py-1.5 text-xs font-bold" disabled={busy} onClick={() => submitReview(i.id)}>
                            Submit Review
                          </button>
                          <button className="btn-outline px-3 py-1.5 text-xs" onClick={() => setReviewing(null)}>
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {rows.length === 0 && (
        <div className="card p-10 text-center text-stone-500 space-y-2">
          <span className="text-4xl">🛍️</span>
          <p className="font-semibold text-stone-700">No orders placed yet</p>
          <p className="text-xs text-stone-400">Browse indigenous crafts and cultural workshops to place your first booking.</p>
          <Link href="/customer/browse" className="btn-primary mt-3 inline-block px-4 py-2 text-xs">
            Browse Crafts →
          </Link>
        </div>
      )}

      {/* Cancellation Confirmation Modal */}
      {cancellingOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
          <div className="card max-w-md w-full p-6 bg-white shadow-xl space-y-4">
            <div className="flex items-center gap-2">
              <span className="text-2xl">⚠️</span>
              <h3 className="font-serif text-lg font-bold text-stone-900">
                Cancel Order #{cancellingOrder.id}?
              </h3>
            </div>
            <p className="text-xs text-stone-600 leading-relaxed">
              Are you sure you want to cancel this order? Once cancelled, any reserved stock or workshop seats will be released back to other buyers.
            </p>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                Reason for cancellation:
              </label>
              <select
                className="input w-full text-xs bg-stone-50"
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
              >
                {CANCELLATION_REASONS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>

            {cancelReason === 'Other reasons' && (
              <textarea
                className="input w-full h-16 text-xs bg-stone-50"
                placeholder="Please describe your reason..."
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
              />
            )}

            <div className="flex justify-end gap-2 pt-2 border-t border-stone-100">
              <button
                type="button"
                className="btn-outline px-4 py-2 text-xs"
                disabled={busy}
                onClick={() => setCancellingOrder(null)}
              >
                Keep Order
              </button>
              <button
                type="button"
                className="btn-primary bg-red-600 hover:bg-red-700 text-white px-4 py-2 text-xs font-bold"
                disabled={busy}
                onClick={handleConfirmCancel}
              >
                {busy ? 'Cancelling…' : 'Yes, Cancel Order'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
