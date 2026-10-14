'use client';

import Link from 'next/link';
import { useState, useMemo } from 'react';

export interface BookingRow {
  order_item_id: number;
  order_id: number;
  product_id: number;
  product: string;
  customer: string;
  customer_phone: string | null;
  attendee: string | null;
  attendee_contact: string | null;
  attendee_for?: string | null;
  session_date: string | null;
  session_time: string | null;
  session_location: string | null;
  selected_variant: string | null;
  purchase_type: string;
  order_notes: string | null;
  quantity: number;
  price: number;
  status: string;
  ticket: string | null;
}

export default function BookingsClient({ initial }: { initial: BookingRow[] }) {
  const [rows, setRows] = useState(initial);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'attended' | 'cancelled_or_noshow'>('all');
  const [busyId, setBusyId] = useState<number | null>(null);

  async function setStatus(id: number, status: string) {
    setBusyId(id);
    try {
      await fetch('/api/artisan/orders/status-booking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order_item_id: id, status }),
      });
      setRows((rs) => rs.map((r) => (r.order_item_id === id ? { ...r, status } : r)));
    } catch {
      // ignore
    } finally {
      setBusyId(null);
    }
  }

  // Filter & Search logic
  const filtered = useMemo(() => {
    return rows.filter((r) => {
      // 1. Status Filter
      if (statusFilter === 'pending' && r.status !== 'pending' && r.status !== 'confirmed') return false;
      if (statusFilter === 'attended' && r.status !== 'attended') return false;
      if (statusFilter === 'cancelled_or_noshow' && r.status !== 'cancelled' && r.status !== 'no_show') return false;

      // 2. Query search: ticket code, attendee, customer, product, variant, location
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      const inTicket = (r.ticket ?? '').toLowerCase().includes(q);
      const inAttendee = (r.attendee ?? '').toLowerCase().includes(q);
      const inCustomer = (r.customer ?? '').toLowerCase().includes(q);
      const inProduct = (r.product ?? '').toLowerCase().includes(q);
      const inVariant = (r.selected_variant ?? '').toLowerCase().includes(q);
      const inLocation = (r.session_location ?? '').toLowerCase().includes(q);
      return inTicket || inAttendee || inCustomer || inProduct || inVariant || inLocation;
    });
  }, [rows, search, statusFilter]);

  const counts = useMemo(() => {
    return {
      all: rows.length,
      pending: rows.filter((r) => r.status === 'pending' || r.status === 'confirmed').length,
      attended: rows.filter((r) => r.status === 'attended').length,
      cancelled: rows.filter((r) => r.status === 'cancelled' || r.status === 'no_show').length,
    };
  }, [rows]);

  function handlePrintRoster() {
    window.print();
  }

  return (
    <div className="mt-6 space-y-5">
      {/* Search & Actions Header (Screen Only) */}
      <div className="print:hidden space-y-4">
        {/* Row 1: Search Box + Print Button */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1">
            <span aria-hidden className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-stone-400">
              🔍
            </span>
            <input
              type="search"
              placeholder="Search by ticket code (e.g. TKT...), attendee name, or customer…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input w-full rounded-xl pl-9 text-sm border-stone-200 bg-white"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-stone-400 hover:text-stone-700"
              >
                Clear
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrintRoster}
              className="btn-outline flex items-center gap-1.5 px-3 py-2 text-xs font-semibold shrink-0"
              title="Print session roster for offline attendance check"
            >
              <span>🖨️</span>
              <span>Print Attendance Roster</span>
            </button>
          </div>
        </div>

        {/* Row 2: Status Filter Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <button
            type="button"
            onClick={() => setStatusFilter('all')}
            className={`rounded-lg px-3 py-1.5 font-medium transition ${
              statusFilter === 'all'
                ? 'bg-brand-600 text-white shadow-xs'
                : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
            }`}
          >
            All Bookings ({counts.all})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('pending')}
            className={`rounded-lg px-3 py-1.5 font-medium transition ${
              statusFilter === 'pending'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
            }`}
          >
            ⏳ Upcoming / Pending ({counts.pending})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('attended')}
            className={`rounded-lg px-3 py-1.5 font-medium transition ${
              statusFilter === 'attended'
                ? 'bg-leaf-600 text-white shadow-xs'
                : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
            }`}
          >
            ✅ Checked In / Attended ({counts.attended})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('cancelled_or_noshow')}
            className={`rounded-lg px-3 py-1.5 font-medium transition ${
              statusFilter === 'cancelled_or_noshow'
                ? 'bg-red-600 text-white shadow-xs'
                : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
            }`}
          >
            ❌ Cancelled / Absent ({counts.cancelled})
          </button>
        </div>
      </div>

      {/* Printable Sheet View (Hidden on Screen, Shown when Printing) */}
      <div className="hidden print:block mb-6">
        <div className="border-b-2 border-stone-800 pb-3">
          <h1 className="text-xl font-bold font-serif">🧶 Cultural Marketplace — Workshop Attendance Roster</h1>
          <p className="text-xs text-stone-600 mt-1">Official Artisan Session Sign-in Sheet · Agusan del Sur</p>
          <p className="text-xs text-stone-500">Date Printed: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
        </div>
        <table className="w-full mt-4 text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-stone-300 font-bold uppercase text-stone-700">
              <th className="py-2">Ticket #</th>
              <th className="py-2">Attendee Name</th>
              <th className="py-2">Workshop / Craft</th>
              <th className="py-2">Session Date & Time</th>
              <th className="py-2">Variant / Notes</th>
              <th className="py-2 text-center">Status</th>
              <th className="py-2 text-center">Sign-in</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-200">
            {filtered.map((b) => (
              <tr key={b.order_item_id} className="align-middle">
                <td className="py-2 font-mono font-bold">{b.ticket || `OID-${b.order_item_id}`}</td>
                <td className="py-2 font-semibold">
                  {b.attendee || b.customer}
                  {b.attendee_for === 'others' && <span className="block text-[10px] text-amber-800 font-normal">Guest / Group</span>}
                  {b.attendee && b.attendee !== b.customer && <span className="block text-[10px] text-stone-500">by {b.customer}</span>}
                </td>
                <td className="py-2">{b.product} × {b.quantity}</td>
                <td className="py-2">{b.session_date} {b.session_time}</td>
                <td className="py-2 text-[10px]">{b.selected_variant || 'Standard'}</td>
                <td className="py-2 text-center uppercase font-bold text-[10px]">{b.status}</td>
                <td className="py-2 text-center border-b border-stone-300 w-24">[ &nbsp; &nbsp; &nbsp; &nbsp; ]</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Screen Cards List */}
      <div className="print:hidden space-y-3.5">
        {filtered.map((b) => {
          const isAttended = b.status === 'attended';
          const isCancelled = b.status === 'cancelled';
          const isNoShow = b.status === 'no_show';
          const isBundle = b.purchase_type === 'bundle';
          const isBusy = busyId === b.order_item_id;

          return (
            <div
              key={b.order_item_id}
              className={`card flex flex-col md:flex-row md:items-start justify-between gap-4 p-4 border transition ${
                isAttended
                  ? 'border-leaf-300 bg-leaf-50/20'
                  : isCancelled || isNoShow
                  ? 'border-stone-200 bg-stone-50/70 opacity-80'
                  : 'border-stone-200 bg-white hover:border-brand-300 shadow-xs'
              }`}
            >
              {/* Left Column: Workshop & Attendee Information */}
              <div className="space-y-2 flex-1">
                {/* Header row: Product Title & Ticket Badge */}
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-semibold text-stone-900 text-base">
                    {b.product}
                  </h3>
                  <span className="text-xs font-semibold text-stone-500">× {b.quantity}</span>

                  {isBundle && (
                    <span className="badge bg-amber-100 text-amber-800 text-[11px] font-bold">
                      ✨ Craft + Workshop Bundle
                    </span>
                  )}

                  {b.ticket && (
                    <span className="rounded-md bg-brand-100 px-2 py-0.5 font-mono text-xs font-bold text-brand-800 border border-brand-200">
                      🎟️ {b.ticket}
                    </span>
                  )}
                </div>

                {/* Attendee & Contact Details */}
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-stone-700">
                  <span className="font-bold text-stone-900 flex items-center gap-1">
                    <span>👤 Attendee:</span>
                    <span className="underline decoration-stone-300">{b.attendee || b.customer}</span>
                  </span>
                  {b.attendee_for === 'others' && (
                    <span className="rounded-full bg-amber-50 border border-amber-200 px-2 py-0.5 text-[10px] font-semibold text-amber-800">
                      Guest / Group
                    </span>
                  )}
                  {b.attendee && b.attendee !== b.customer && (
                    <span className="text-stone-500">
                      (Booked by {b.customer})
                    </span>
                  )}
                  {b.attendee_contact && (
                    <a
                      href={`tel:${b.attendee_contact}`}
                      className="text-brand-700 font-medium hover:underline flex items-center gap-1"
                    >
                      <span>📞</span>
                      <span>{b.attendee_contact}</span>
                    </a>
                  )}
                </div>

                {/* Scheduled Session Date & Location */}
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-stone-600 bg-stone-50/90 rounded-lg p-2.5 border border-stone-200">
                  {b.session_date && (
                    <span className="font-medium text-stone-800 flex items-center gap-1">
                      <span>📅</span>
                      <span>{b.session_date}</span>
                      {b.session_time && <span className="text-stone-500 font-normal">({b.session_time})</span>}
                    </span>
                  )}
                  {b.session_location && (
                    <span className="flex items-center gap-1 text-leaf-800 font-medium truncate max-w-md">
                      <span>📍</span>
                      <span>{b.session_location}</span>
                    </span>
                  )}
                </div>

                {/* Craft Variant (If Bundle or customized craft) */}
                {b.selected_variant && (
                  <p className="text-xs text-amber-900 bg-amber-50 rounded px-2 py-1 inline-block border border-amber-200">
                    🎨 <b>Craft Variant to Prepare:</b> {b.selected_variant}
                  </p>
                )}

                {/* Special Request / Customer Notes */}
                {b.order_notes && (
                  <p className="text-xs text-stone-600 italic bg-stone-50/60 rounded px-2 py-1 border border-stone-200">
                    💬 <b>Note from Customer:</b> &ldquo;{b.order_notes}&rdquo;
                  </p>
                )}
              </div>

              {/* Right Column: Status & Action Buttons */}
              <div className="flex flex-row md:flex-col items-center md:items-end justify-between md:justify-start gap-2.5 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-stone-100">
                {/* Status Badge */}
                <span
                  className={`badge uppercase font-bold text-[10px] tracking-wider px-2.5 py-1 ${
                    isAttended
                      ? 'bg-leaf-100 text-leaf-800 border border-leaf-300'
                      : isCancelled
                      ? 'bg-red-100 text-red-800'
                      : isNoShow
                      ? 'bg-stone-200 text-stone-800'
                      : 'bg-amber-100 text-amber-800 border border-amber-300'
                  }`}
                >
                  {isAttended ? '✓ Checked In (Attended)' : b.status.replace(/_/g, ' ')}
                </span>

                {/* Interactive Action Buttons */}
                <div className="flex flex-wrap items-center gap-1.5">
                  {!isAttended && !isCancelled && (
                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={() => setStatus(b.order_item_id, 'attended')}
                      className="btn-primary text-xs px-3 py-1.5 font-bold shadow-xs bg-leaf-600 hover:bg-leaf-700 text-white"
                      title="Mark attendee as checked in and present at the workshop"
                    >
                      {isBusy ? 'Checking in…' : '✅ Check In (Present)'}
                    </button>
                  )}

                  {isAttended && (
                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={() => setStatus(b.order_item_id, 'pending')}
                      className="btn-outline text-[11px] px-2.5 py-1 text-stone-500 hover:text-stone-700"
                      title="Undo check-in"
                    >
                      Undo
                    </button>
                  )}

                  {!isCancelled && !isAttended && (
                    <>
                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() => setStatus(b.order_item_id, 'no_show')}
                        className="btn-outline text-xs px-2.5 py-1.5 text-stone-600 hover:bg-stone-100"
                        title="Mark as absent / did not show up"
                      >
                        No-show
                      </button>
                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() => setStatus(b.order_item_id, 'cancelled')}
                        className="btn-outline text-xs px-2.5 py-1.5 text-red-600 border-red-200 hover:bg-red-50"
                        title="Cancel this booking"
                      >
                        Cancel
                      </button>
                    </>
                  )}

                  <Link
                    href={`/artisan/tutorial-attendees/${b.product_id}`}
                    className="btn-outline text-xs px-2.5 py-1.5 text-stone-700"
                  >
                    👥 Roster
                  </Link>
                </div>
              </div>
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div className="card p-8 text-center text-stone-500 bg-stone-50 border border-stone-200">
            <span className="text-3xl">🔍</span>
            <p className="mt-2 font-medium text-stone-700">No matching workshop bookings found</p>
            {search ? (
              <p className="text-xs text-stone-500 mt-1">
                No tickets or attendees match &ldquo;{search}&rdquo;. Try another name or clear your search.
              </p>
            ) : (
              <p className="text-xs text-stone-500 mt-1">
                You do not have any bookings in this status tab.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
