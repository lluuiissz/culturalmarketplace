'use client';

import Link from 'next/link';
import { useState } from 'react';

export interface ExperienceRow {
  id: number;
  name: string;
  price: number;
  fee_type: string;
  capacity: number | null;
  booked_count: number;
  status: string;
  location: string | null;
  lat: number | null;
  lng: number | null;
  dates: Array<{ date: string; time_start: string; time_end: string; location?: string }>;
}

export default function ExperiencesClient({ initial }: { initial: ExperienceRow[] }) {
  const [rows, setRows] = useState(initial);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [saveStatus, setSaveStatus] = useState<Record<number, { type: 'success' | 'error'; message: string }>>({});

  async function saveDates(id: number, dates: ExperienceRow['dates']) {
    setBusyId(id);
    setSaveStatus((s) => ({ ...s, [id]: { type: 'success', message: '' } }));

    try {
      const res = await fetch('/api/artisan/tutorial-dates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product_id: id, dates }),
      });
      const data = await res.json();
      if (res.ok && data.status === 'success') {
        setSaveStatus((s) => ({
          ...s,
          [id]: { type: 'success', message: '✓ Session schedule saved successfully!' },
        }));
      } else {
        setSaveStatus((s) => ({
          ...s,
          [id]: { type: 'error', message: data.message ?? 'Failed to save session dates.' },
        }));
      }
    } catch {
      setSaveStatus((s) => ({
        ...s,
        [id]: { type: 'error', message: 'Network error while saving dates.' },
      }));
    } finally {
      setBusyId(null);
    }
  }

  function updateRowDates(id: number, dates: ExperienceRow['dates']) {
    setRows((rs) => rs.map((r) => (r.id === id ? { ...r, dates } : r)));
  }

  function addSession(row: ExperienceRow) {
    const newSession = {
      date: new Date().toISOString().split('T')[0],
      time_start: '09:00',
      time_end: '11:00',
      location: row.location ?? '',
    };
    updateRowDates(row.id, [...row.dates, newSession]);
  }

  return (
    <div className="space-y-6">
      {rows.map((r) => {
        const isFree = r.fee_type === 'free' || r.price === 0;
        const isBusy = busyId === r.id;
        const statusMsg = saveStatus[r.id];
        const isFull = r.capacity !== null && r.booked_count >= r.capacity;
        const seatsLeft = r.capacity !== null ? Math.max(0, r.capacity - r.booked_count) : null;

        return (
          <div key={r.id} className="card p-5 border border-stone-200 bg-white shadow-xs space-y-4">
            {/* Top Row: Title, Fee & Status Badges, Action Links */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-100 pb-3">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-serif text-lg font-bold text-stone-900">
                    {r.name}
                  </h2>
                  {isFree ? (
                    <span className="rounded-full bg-ochre-100 px-2.5 py-0.5 text-xs font-bold text-ochre-900 border border-ochre-300">
                      ✨ FREE Workshop
                    </span>
                  ) : (
                    <span className="rounded-full bg-stone-100 px-2.5 py-0.5 text-xs font-bold text-stone-800 border border-stone-200">
                      ₱{r.price.toFixed(2)} / attendee
                    </span>
                  )}
                  <span className="rounded-full bg-brand-50 px-2 py-0.5 text-[11px] font-semibold text-brand-700 border border-brand-200 capitalize">
                    {r.status.replace(/_/g, ' ')}
                  </span>
                </div>

                {/* Sub details: Capacity & Venue */}
                <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-stone-600">
                  {/* Booked / Capacity badge */}
                  <div className="flex items-center gap-1.5 font-medium">
                    <span>👥</span>
                    <span>
                      <b>{r.booked_count}</b> / {r.capacity ?? '∞'} seats reserved
                    </span>
                    {r.capacity !== null && (
                      <span
                        className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${
                          isFull
                            ? 'bg-crimson-100 text-crimson-800 border border-crimson-200'
                            : 'bg-ochre-100 text-ochre-900 border border-ochre-300'
                        }`}
                      >
                        {isFull ? 'Sold Out' : `${seatsLeft} seats left`}
                      </span>
                    )}
                  </div>

                  {/* Studio / Venue Location */}
                  {r.location ? (
                    <div className="flex items-center gap-1 text-stone-700">
                      <span>📍</span>
                      <span className="truncate max-w-xs">{r.location}</span>
                    </div>
                  ) : (
                    <Link
                      href={`/artisan/products/${r.id}/edit`}
                      className="text-ochre-800 font-medium hover:underline flex items-center gap-1"
                    >
                      <span>⚠️</span>
                      <span>No studio venue pinned</span>
                    </Link>
                  )}

                  {/* Pinned Coordinates */}
                  {r.lat !== null && r.lng !== null && (
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${r.lat},${r.lng}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-brand-600 hover:underline flex items-center gap-1"
                    >
                      <span>🗺️</span>
                      <span>Pinned on Map</span>
                    </a>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-1.5 shrink-0">
                <Link
                  href={`/artisan/tutorial-attendees/${r.id}`}
                  className="btn-outline px-3 py-1.5 text-xs font-semibold"
                  title="View attendee roster for this specific workshop"
                >
                  👥 Attendees ({r.booked_count})
                </Link>
                <Link
                  href={`/artisan/products/${r.id}/edit`}
                  className="btn-outline px-3 py-1.5 text-xs font-semibold"
                  title="Edit craft and workshop details"
                >
                  ✏️ Edit
                </Link>
                <Link
                  href={`/customer/browse/${r.id}`}
                  className="btn-outline px-2.5 py-1.5 text-xs text-stone-500 hover:text-stone-800"
                  title="View customer facing product page"
                  target="_blank"
                >
                  👁️ View
                </Link>
              </div>
            </div>

            {/* Scheduled Sessions Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold uppercase tracking-wider text-stone-500">
                  Scheduled Dates & Times ({r.dates.length} sessions)
                </p>
                <button
                  type="button"
                  onClick={() => addSession(r)}
                  className="text-xs font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1"
                >
                  <span>+</span> Add Session Date
                </button>
              </div>

              {r.dates.length === 0 ? (
                <div className="rounded-lg border border-dashed border-stone-200 p-4 text-center text-xs text-stone-500">
                  <p>No upcoming session slots scheduled for this workshop yet.</p>
                  <p className="mt-1 text-stone-400">
                    Add dates so customers can select their preferred schedule upon booking.
                  </p>
                  <button
                    type="button"
                    onClick={() => addSession(r)}
                    className="btn-outline mt-2.5 px-3 py-1 text-xs"
                  >
                    + Add First Session
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  {r.dates.map((d, i) => (
                    <div
                      key={i}
                      className="flex flex-col sm:flex-row sm:items-center gap-2 rounded-lg bg-stone-50 p-2.5 text-xs border border-stone-200"
                    >
                      <div className="flex items-center gap-2">
                        <label className="text-stone-500 font-medium shrink-0">Date:</label>
                        <input
                          type="date"
                          className="input w-36 py-1 px-2 text-xs"
                          value={d.date}
                          onChange={(e) =>
                            updateRowDates(
                              r.id,
                              r.dates.map((x, xi) => (xi === i ? { ...x, date: e.target.value } : x))
                            )
                          }
                        />
                      </div>

                      <div className="flex items-center gap-1.5">
                        <label className="text-stone-500 font-medium shrink-0">Time:</label>
                        <input
                          type="time"
                          className="input w-28 py-1 px-2 text-xs"
                          value={d.time_start}
                          onChange={(e) =>
                            updateRowDates(
                              r.id,
                              r.dates.map((x, xi) => (xi === i ? { ...x, time_start: e.target.value } : x))
                            )
                          }
                        />
                        <span className="text-stone-400">to</span>
                        <input
                          type="time"
                          className="input w-28 py-1 px-2 text-xs"
                          value={d.time_end}
                          onChange={(e) =>
                            updateRowDates(
                              r.id,
                              r.dates.map((x, xi) => (xi === i ? { ...x, time_end: e.target.value } : x))
                            )
                          }
                        />
                      </div>

                      <div className="flex items-center gap-2 flex-1 min-w-[180px]">
                        <label className="text-stone-500 font-medium shrink-0">Venue:</label>
                        <input
                          className="input flex-1 py-1 px-2 text-xs"
                          placeholder={r.location || 'Studio address / Room'}
                          value={d.location ?? ''}
                          onChange={(e) =>
                            updateRowDates(
                              r.id,
                              r.dates.map((x, xi) => (xi === i ? { ...x, location: e.target.value } : x))
                            )
                          }
                        />
                      </div>

                      <button
                        type="button"
                        className="text-stone-400 hover:text-red-600 p-1 rounded transition self-end sm:self-auto"
                        title="Remove session"
                        aria-label="Remove session"
                        onClick={() => updateRowDates(r.id, r.dates.filter((_, xi) => xi !== i))}
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Bottom Actions & Status Feedback */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-stone-100">
              <div>
                {statusMsg?.message && (
                  <p
                    className={`text-xs font-semibold ${
                      statusMsg.type === 'success' ? 'text-ochre-800' : 'text-crimson-600'
                    }`}
                  >
                    {statusMsg.message}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="btn-outline px-3 py-1.5 text-xs font-semibold"
                  onClick={() => addSession(r)}
                >
                  + Add another session
                </button>
                <button
                  type="button"
                  className="btn-primary px-4 py-1.5 text-xs font-bold"
                  disabled={isBusy}
                  onClick={() => saveDates(r.id, r.dates)}
                >
                  {isBusy ? 'Saving...' : 'Save Sessions'}
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
