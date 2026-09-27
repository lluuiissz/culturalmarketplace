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
      <main className="mx-auto max-w-3xl px-4 py-10">
        <h1 className="font-serif text-3xl font-bold text-brand-900">Session calendar</h1>
        <div className="mt-6 space-y-3">
          {sessions.map((s, i) => (
            <div key={i} className="card flex items-center gap-4 p-4">
              <div className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-lg bg-brand-500 text-white">
                <span className="text-lg font-bold">{s.date.slice(8)}</span>
                <span className="text-[10px] uppercase">{new Date(s.date + 'T00:00:00').toLocaleString('en', { month: 'short' })}</span>
              </div>
              <div>
                <p className="font-semibold text-stone-800">{s.product}</p>
                <p className="text-sm text-stone-500">🕐 {s.time_start}–{s.time_end}{s.location ? ` · 📍 ${s.location}` : ''}</p>
              </div>
            </div>
          ))}
          {sessions.length === 0 && <p className="text-stone-500">No scheduled sessions. Add dates under Experiences.</p>}
        </div>
      </main>
    </>
  );
}
