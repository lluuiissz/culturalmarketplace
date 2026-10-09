import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { listArtisanProducts, listBookings } from '@/lib/db';
import ExperiencesClient from './ExperiencesClient';

export const dynamic = 'force-dynamic';

export default async function ArtisanExperiencesPage() {
  const session = await getSession();
  if (!session || session.role !== 'artisan') redirect('/auth/login?next=/artisan/experiences');

  const [products, bookings] = await Promise.all([
    listArtisanProducts(session.id),
    listBookings(session.id),
  ]);

  const tutorials = products.filter((p) => p.has_tutorial);

  const bookingsByProduct = new Map<number, number>();
  for (const b of bookings) {
    if (b.status !== 'cancelled') {
      bookingsByProduct.set(b.product_id, (bookingsByProduct.get(b.product_id) ?? 0) + b.quantity);
    }
  }

  return (
    <>
      <main className="mx-auto max-w-4xl px-4 py-10 space-y-6">
        <div>
          <h1 className="font-serif text-3xl font-bold text-brand-900">Experiences & workshops</h1>
          <p className="mt-1 text-sm text-stone-500">
            Manage your live cultural crafting sessions, venue locations, and schedule dates.
          </p>
        </div>

        {/* Quick Navigation Sub-bar */}
        <div className="flex flex-wrap items-center gap-2 border-b border-stone-200 pb-3 text-xs">
          <Link
            href="/artisan/experiences"
            className="rounded-lg bg-brand-600 px-3.5 py-1.5 font-bold text-white shadow-xs"
          >
            🎓 Workshops List
          </Link>
          <Link
            href="/artisan/experiences/calendar"
            className="rounded-lg bg-stone-100 px-3.5 py-1.5 font-semibold text-stone-600 hover:bg-stone-200 transition"
          >
            📅 Session Calendar
          </Link>
          <Link
            href="/artisan/bookings"
            className="rounded-lg bg-stone-100 px-3.5 py-1.5 font-semibold text-stone-600 hover:bg-stone-200 transition"
          >
            🎟️ Bookings & Attendance ({bookings.length})
          </Link>
        </div>

        <ExperiencesClient
          initial={tutorials.map((p) => ({
            id: p.id,
            name: p.name,
            price: Number(p.tutorial_price ?? p.price),
            fee_type: p.tutorial_fee_type ?? (Number(p.tutorial_price) === 0 ? 'free' : 'paid'),
            capacity: p.tutorial_capacity,
            booked_count: bookingsByProduct.get(p.id) ?? 0,
            status: p.tutorial_status ?? 'accept_bookings',
            location: p.tutorial_location ?? null,
            lat: p.tutorial_lat ?? null,
            lng: p.tutorial_lng ?? null,
            dates: p.tutorial_dates ?? [],
          }))}
        />

        {tutorials.length === 0 && (
          <div className="card p-8 text-center text-stone-500 bg-stone-50 border border-stone-200">
            <span className="text-3xl">🌿</span>
            <p className="mt-2 font-medium text-stone-700">No bookable workshops yet</p>
            <p className="text-xs text-stone-400 mt-1">
              Enable &ldquo;Offer a live workshop&rdquo; when adding or editing a craft product to make it available for bookings.
            </p>
            <Link href="/artisan/products/new" className="btn-primary mt-3 inline-block px-4 py-2 text-xs">
              + Create Bookable Craft
            </Link>
          </div>
        )}
      </main>
    </>
  );
}
