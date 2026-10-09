import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { listArtisanProducts } from '@/lib/db';

export const dynamic = 'force-dynamic';

export default async function ArtisanCalendarPage() {
  const session = await getSession();
  if (!session || session.role !== 'artisan') redirect('/auth/login?next=/artisan/experiences/calendar');

  const products = await listArtisanProducts(session.id);
  const sessions = products
    .filter((p) => p.has_tutorial && p.tutorial_dates?.length)
    .flatMap((p) => p.tutorial_dates!.map((d) => ({ product: p.name, ...d })))
    .sort((a, b) => a.date.localeCompare(b.date));

  return (
    <>
      <main className="mx-auto max-w-4xl px-4 py-10 space-y-6">
        <div>
          <h1 className="font-serif text-3xl font-bold text-brand-900">Session calendar</h1>
          <p className="mt-1 text-sm text-stone-500">
            View upcoming scheduled cultural craft workshop sessions in chronological order.
          </p>
        </div>

        {/* Quick Navigation Sub-bar */}
        <div className="flex flex-wrap items-center gap-2 border-b border-stone-200 pb-3 text-xs">
          <Link
            href="/artisan/experiences"
            className="rounded-lg bg-stone-100 px-3.5 py-1.5 font-semibold text-stone-600 hover:bg-stone-200 transition"
          >
            🎓 Workshops List
          </Link>
          <Link
            href="/artisan/experiences/calendar"
            className="rounded-lg bg-brand-600 px-3.5 py-1.5 font-bold text-white shadow-xs"
          >
            📅 Session Calendar ({sessions.length})
          </Link>
          <Link
            href="/artisan/bookings"
            className="rounded-lg bg-stone-100 px-3.5 py-1.5 font-semibold text-stone-600 hover:bg-stone-200 transition"
          >
            🎟️ Bookings & Attendance
          </Link>
        </div>

        <div className="mt-6 space-y-3">
          {sessions.map((s, i) => (
            <div key={i} className="card flex items-center gap-4 p-4 border border-stone-200 bg-white shadow-xs">
              <div className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-xl bg-brand-600 text-white shadow-xs">
                <span className="text-lg font-bold">{s.date.slice(8)}</span>
                <span className="text-[10px] uppercase font-semibold">
                  {new Date(s.date + 'T00:00:00').toLocaleString('en', { month: 'short' })}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-stone-800 text-base">{s.product}</p>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-stone-500 mt-0.5">
                  <span>🕐 {s.time_start}–{s.time_end}</span>
                  {s.location && (
                    <span className="flex items-center gap-1 text-stone-700">
                      <span>📍</span>
                      <span className="truncate max-w-sm">{s.location}</span>
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
          {sessions.length === 0 && (
            <div className="card p-8 text-center text-stone-500 bg-stone-50 border border-stone-200">
              <span className="text-3xl">📅</span>
              <p className="mt-2 font-medium text-stone-700">No scheduled sessions</p>
              <p className="text-xs text-stone-400 mt-1">
                Add dates under the Workshops List to make sessions appear on your calendar.
              </p>
              <Link href="/artisan/experiences" className="btn-primary mt-3 inline-block px-4 py-2 text-xs">
                Go to Workshops List
              </Link>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
