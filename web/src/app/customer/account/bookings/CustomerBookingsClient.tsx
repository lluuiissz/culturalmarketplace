'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import type { CustomerBooking } from '@/lib/db';
import ExperienceMap from '@/app/customer/browse/[id]/ExperienceMap';

export default function CustomerBookingsClient({
  initial,
  customerName,
}: {
  initial: CustomerBooking[];
  customerName: string;
}) {
  const [bookings, setBookings] = useState<CustomerBooking[]>(initial);
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'attended' | 'cancelled'>('all');
  const [search, setSearch] = useState('');
  const [expandedMapId, setExpandedMapId] = useState<number | null>(null);
  const [cancellingItem, setCancellingItem] = useState<CustomerBooking | null>(null);
  const [cancelReason, setCancelReason] = useState('Schedule conflict / Cannot attend workshop');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionMsg, setActionMsg] = useState<{ text: string; error?: boolean } | null>(null);

  const upcomingCount = bookings.filter(
    (b) => b.status !== 'cancelled' && b.status !== 'attended' && b.order_status !== 'cancelled'
  ).length;
  const attendedCount = bookings.filter((b) => b.status === 'attended').length;
  const cancelledCount = bookings.filter(
    (b) => b.status === 'cancelled' || b.order_status === 'cancelled'
  ).length;

  const filtered = bookings.filter((b) => {
    const isCancelled = b.status === 'cancelled' || b.order_status === 'cancelled';
    const isAttended = b.status === 'attended';
    const isUpcoming = !isCancelled && !isAttended;

    if (filter === 'upcoming' && !isUpcoming) return false;
    if (filter === 'attended' && !isAttended) return false;
    if (filter === 'cancelled' && !isCancelled) return false;

    if (search.trim()) {
      const q = search.toLowerCase();
      const matchName = b.product_name.toLowerCase().includes(q);
      const matchArtisan = b.artisan_name.toLowerCase().includes(q);
      const matchTicket = (b.ticket_code ?? '').toLowerCase().includes(q);
      const matchVenue = (b.venue_location ?? '').toLowerCase().includes(q);
      if (!matchName && !matchArtisan && !matchTicket && !matchVenue) return false;
    }

    return true;
  });

  async function handleConfirmCancel() {
    if (!cancellingItem) return;
    setIsSubmitting(true);
    setActionMsg(null);

    try {
      const res = await fetch('/api/orders/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order_id: cancellingItem.order_id, reason: cancelReason }),
      });
      const data = await res.json();
      if (!res.ok || data.status !== 'success') {
        throw new Error(data.message || 'Failed to cancel booking');
      }

      setBookings((prev) =>
        prev.map((b) =>
          b.order_id === cancellingItem.order_id
            ? { ...b, status: 'cancelled', order_status: 'cancelled' }
            : b
        )
      );
      setActionMsg({ text: `Booking for ${cancellingItem.product_name} was successfully cancelled.` });
      setCancellingItem(null);
    } catch (e: unknown) {
      setActionMsg({ text: (e as Error).message || 'Failed to cancel booking', error: true });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Toast Notice */}
      {actionMsg && (
        <div
          className={`rounded-xl p-4 text-sm font-medium border flex items-center justify-between shadow-xs ${
            actionMsg.error
              ? 'bg-red-50 text-red-800 border-red-200'
              : 'bg-leaf-50 text-leaf-800 border-leaf-200'
          }`}
        >
          <span>{actionMsg.text}</span>
          <button
            type="button"
            className="text-stone-400 hover:text-stone-700 font-bold ml-2"
            onClick={() => setActionMsg(null)}
          >
            ✕
          </button>
        </div>
      )}

      {/* Overview Metric Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="card p-4 border border-stone-200 bg-white">
          <p className="text-xs uppercase font-semibold tracking-wider text-stone-500">All Bookings</p>
          <p className="mt-1 font-serif text-2xl font-bold text-brand-900">{bookings.length}</p>
        </div>
        <div className="card p-4 border border-leaf-200 bg-leaf-50/50">
          <p className="text-xs uppercase font-semibold tracking-wider text-leaf-700">Upcoming / Confirmed</p>
          <p className="mt-1 font-serif text-2xl font-bold text-leaf-800">{upcomingCount}</p>
        </div>
        <div className="card p-4 border border-stone-200 bg-white">
          <p className="text-xs uppercase font-semibold tracking-wider text-stone-500">Attended</p>
          <p className="mt-1 font-serif text-2xl font-bold text-stone-700">{attendedCount}</p>
        </div>
        <div className="card p-4 border border-stone-200 bg-white">
          <p className="text-xs uppercase font-semibold tracking-wider text-stone-500">Cancelled</p>
          <p className="mt-1 font-serif text-2xl font-bold text-stone-500">{cancelledCount}</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-1.5 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setFilter('all')}
            className={`rounded-lg px-3 py-1.5 transition ${
              filter === 'all'
                ? 'bg-brand-600 text-white shadow-xs'
                : 'bg-white text-stone-600 border border-stone-200 hover:bg-stone-50'
            }`}
          >
            All ({bookings.length})
          </button>
          <button
            type="button"
            onClick={() => setFilter('upcoming')}
            className={`rounded-lg px-3 py-1.5 transition ${
              filter === 'upcoming'
                ? 'bg-leaf-700 text-white shadow-xs'
                : 'bg-white text-stone-600 border border-stone-200 hover:bg-stone-50'
            }`}
          >
            🌿 Upcoming ({upcomingCount})
          </button>
          <button
            type="button"
            onClick={() => setFilter('attended')}
            className={`rounded-lg px-3 py-1.5 transition ${
              filter === 'attended'
                ? 'bg-brand-600 text-white shadow-xs'
                : 'bg-white text-stone-600 border border-stone-200 hover:bg-stone-50'
            }`}
          >
            ✓ Attended ({attendedCount})
          </button>
          <button
            type="button"
            onClick={() => setFilter('cancelled')}
            className={`rounded-lg px-3 py-1.5 transition ${
              filter === 'cancelled'
                ? 'bg-stone-700 text-white shadow-xs'
                : 'bg-white text-stone-600 border border-stone-200 hover:bg-stone-50'
            }`}
          >
            Cancelled ({cancelledCount})
          </button>
        </div>

        <div className="relative w-full sm:w-64">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs text-stone-400">
            🔍
          </span>
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tickets, workshops, venues…"
            className="input w-full pl-8 py-1.5 text-xs rounded-lg border-stone-300"
          />
        </div>
      </div>

      {/* Bookings Pass List */}
      <div className="space-y-4">
        {filtered.map((b) => {
          const isCancelled = b.status === 'cancelled' || b.order_status === 'cancelled';
          const isAttended = b.status === 'attended';
          const isMapOpen = expandedMapId === b.order_item_id;
          const venueLocation = b.selected_session?.location || b.venue_location || 'Artisan Workshop Studio';
          const venueLat = b.venue_lat ?? 8.5085;
          const venueLng = b.venue_lng ?? 125.9789;
          const canCancel = (b.order_status === 'pending' || b.order_status === 'awaiting_payment') && !isCancelled && !isAttended;

          return (
            <div
              key={b.order_item_id}
              className={`rounded-2xl border transition-all overflow-hidden ${
                isCancelled
                  ? 'border-stone-200 bg-stone-50/70 opacity-75'
                  : 'border-leaf-300/80 bg-white shadow-xs hover:border-leaf-400 hover:shadow-md'
              }`}
            >
              {/* Top Banner (Ticket Header) */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-100 bg-gradient-to-r from-stone-50 to-white px-5 py-3.5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-serif font-bold text-stone-800 text-sm">
                    Order #{b.order_id}
                  </span>
                  {b.ticket_code && (
                    <span className="rounded-md bg-brand-600 px-2.5 py-0.5 font-mono text-xs font-bold text-white shadow-xs">
                      🎟️ {b.ticket_code}
                    </span>
                  )}
                  {b.purchase_type === 'bundle' && (
                    <span className="badge bg-amber-100 text-amber-800 text-[10px] font-bold">
                      ✨ Craft + Workshop Bundle
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`badge uppercase font-bold text-[10px] tracking-wider px-2.5 py-1 ${
                      isAttended
                        ? 'bg-blue-100 text-blue-800'
                        : isCancelled
                        ? 'bg-red-100 text-red-700'
                        : 'bg-leaf-100 text-leaf-800 border border-leaf-200'
                    }`}
                  >
                    {isCancelled ? 'Cancelled' : isAttended ? 'Attended ✓' : 'Confirmed Booking'}
                  </span>

                  <span className="text-xs font-bold text-stone-700 font-mono">
                    ₱{Number(b.price * b.quantity).toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Main Ticket Pass Body */}
              <div className="p-5 space-y-4">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                  {/* Workshop Thumbnail */}
                  <div className="h-24 w-24 shrink-0 overflow-hidden rounded-xl border border-stone-200 bg-stone-100 relative">
                    {b.image_path ? (
                      <Image
                        src={b.image_path}
                        alt={b.product_name}
                        fill
                        className="object-cover"
                        sizes="96px"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-3xl">
                        🧺
                      </div>
                    )}
                  </div>

                  {/* Workshop & Attendee Metadata */}
                  <div className="flex-1 space-y-2">
                    <div>
                      <h3 className="font-serif text-lg font-bold text-stone-900 leading-snug">
                        {b.product_name}
                      </h3>
                      <p className="text-xs text-stone-600 flex items-center gap-1.5 mt-0.5">
                        <span>🧑‍🎨 Conducted by:</span>
                        <span className="font-semibold text-brand-700">{b.artisan_name}</span>
                        {b.artisan_phone && (
                          <span className="text-stone-400">· 📞 {b.artisan_phone}</span>
                        )}
                      </p>
                    </div>

                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 text-xs">
                      {/* Session Date & Time */}
                      <div className="rounded-lg bg-leaf-50/70 p-2.5 border border-leaf-200/60">
                        <p className="font-bold text-leaf-900 flex items-center gap-1">
                          <span>📅 Scheduled Session</span>
                        </p>
                        <p className="mt-0.5 text-stone-700 font-medium">
                          {b.selected_session?.date || 'Schedule to be confirmed'}
                        </p>
                        {b.selected_session?.time_start && (
                          <p className="text-[11px] text-stone-500">
                            {b.selected_session.time_start} – {b.selected_session.time_end}
                          </p>
                        )}
                      </div>

                      {/* Studio Venue */}
                      <div className="rounded-lg bg-stone-50 p-2.5 border border-stone-200">
                        <p className="font-bold text-stone-800 flex items-center gap-1">
                          <span>📍 Studio Venue</span>
                        </p>
                        <p className="mt-0.5 text-stone-700 line-clamp-1 font-medium">
                          {venueLocation}
                        </p>
                        <p className="text-[11px] text-stone-500">Agusan del Sur, Philippines</p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-stone-600 pt-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-stone-500">👤 Attendee(s): </span>
                        {b.attendee_name && b.attendee_name.includes(',') ? (
                          <span className="inline-flex flex-wrap gap-1 align-middle">
                            {b.attendee_name.split(',').map((name, idx) => (
                              <span key={idx} className="rounded bg-stone-100 border border-stone-200 px-1.5 py-0.2 font-semibold text-stone-800 text-[11px]">
                                {name.trim()}
                              </span>
                            ))}
                          </span>
                        ) : (
                          <span className="font-semibold text-stone-800">
                            {b.attendee_name || customerName}
                          </span>
                        )}
                        {b.attendee_for === 'others' && (
                          <span className="rounded bg-leaf-100 text-leaf-800 text-[10px] font-bold px-1.5 py-0.5 border border-leaf-200">
                            Guest / Group
                          </span>
                        )}
                        {b.attendee_contact && <span className="text-stone-400"> ({b.attendee_contact})</span>}
                      </div>
                      {b.selected_variant && (
                        <p>
                          🎨 Variant:{' '}
                          <span className="font-semibold text-stone-800">{b.selected_variant}</span>
                        </p>
                      )}
                      <p>
                        🎟️ Passes:{' '}
                        <span className="font-semibold text-stone-800">{b.quantity} seat(s)</span>
                      </p>
                    </div>
                  </div>
                </div>

                {/* Interactive Venue Pathfinding Drawer */}
                {isMapOpen && (
                  <div className="rounded-xl border-2 border-leaf-600/30 bg-white p-4 shadow-sm space-y-3 animate-in fade-in duration-200">
                    <div className="flex items-center justify-between border-b border-stone-100 pb-2">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xl">🧭</span>
                        <div>
                          <p className="text-xs font-bold text-brand-900 uppercase tracking-wide">
                            Live Venue Navigation & Pathfinding
                          </p>
                          <p className="text-[11px] text-stone-500">
                            Trace road route, get directions, or open in Google Maps & Waze.
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setExpandedMapId(null)}
                        className="text-xs font-bold text-stone-400 hover:text-stone-700 px-2 py-1"
                      >
                        ✕ Close Map
                      </button>
                    </div>

                    <ExperienceMap
                      lat={venueLat}
                      lng={venueLng}
                      locationName={venueLocation}
                      artisanPhone={b.artisan_phone}
                    />
                  </div>
                )}

                {/* Bottom Action Bar */}
                <div className="flex flex-wrap items-center justify-between gap-2 border-t border-stone-100 pt-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setExpandedMapId(isMapOpen ? null : b.order_item_id)}
                      className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition shadow-xs ${
                        isMapOpen
                          ? 'bg-leaf-800 text-white'
                          : 'bg-leaf-600 text-white hover:bg-leaf-700'
                      }`}
                    >
                      <span>🧭</span>
                      <span>{isMapOpen ? 'Hide Venue Map' : 'Find Venue & Pathfinding'}</span>
                    </button>

                    <Link
                      href={`/order/receipt/${b.order_id}#ticket-${b.order_item_id}`}
                      className="btn-outline px-3 py-1.5 text-xs font-semibold flex items-center gap-1 hover:bg-stone-50"
                    >
                      <span>🧾</span>
                      <span>Official Receipt & Ticket</span>
                    </Link>

                    <Link
                      href={`/customer/account/messages`}
                      className="btn-outline px-3 py-1.5 text-xs font-semibold flex items-center gap-1 hover:bg-stone-50 text-stone-600"
                    >
                      <span>💬</span>
                      <span>Message Artisan</span>
                    </Link>
                  </div>

                  {canCancel && (
                    <button
                      type="button"
                      onClick={() => setCancellingItem(b)}
                      className="text-xs font-semibold text-red-600 hover:text-red-700 hover:underline px-2 py-1"
                    >
                      Cancel Reservation
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div className="card p-12 text-center border border-dashed border-stone-300 bg-white">
            <span className="text-4xl">🧺</span>
            <h3 className="mt-3 font-serif text-lg font-bold text-brand-900">
              {search.trim() ? 'No bookings match your search' : 'No workshop bookings yet'}
            </h3>
            <p className="mt-1 text-xs text-stone-500 max-w-md mx-auto">
              Learn authentic indigenous crafts directly from Agusan del Sur master artisans.
              Book a live cultural weaving, wood carving, or beadwork masterclass.
            </p>
            <div className="mt-5">
              <Link href="/customer/browse" className="btn-primary text-xs px-4 py-2">
                Explore Cultural Workshops & Experiences →
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Cancellation Modal */}
      {cancellingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl space-y-4">
            <h3 className="font-serif text-lg font-bold text-stone-900">
              Cancel Workshop Reservation
            </h3>
            <p className="text-xs text-stone-600">
              Are you sure you want to cancel your booking for{' '}
              <b>{cancellingItem.product_name}</b> (Order #{cancellingItem.order_id})?
            </p>

            <div>
              <label className="text-xs font-semibold text-stone-700">Reason for cancellation:</label>
              <select
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="input mt-1 w-full text-xs"
              >
                <option value="Schedule conflict / Cannot attend workshop">Schedule conflict / Cannot attend workshop</option>
                <option value="Booked by mistake">Booked by mistake</option>
                <option value="Emergency circumstances">Emergency circumstances</option>
                <option value="Want to re-book a different session date">Want to re-book a different session date</option>
                <option value="Other reasons">Other reasons</option>
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setCancellingItem(null)}
                disabled={isSubmitting}
                className="btn-outline text-xs px-3 py-1.5"
              >
                Keep Booking
              </button>
              <button
                type="button"
                onClick={handleConfirmCancel}
                disabled={isSubmitting}
                className="btn-primary text-xs px-4 py-1.5 bg-red-600 hover:bg-red-700 border-none"
              >
                {isSubmitting ? 'Cancelling…' : 'Confirm Cancellation'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
