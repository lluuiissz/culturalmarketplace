import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { artisanAnalytics } from '@/lib/db';

export const dynamic = 'force-dynamic';

export default async function ArtisanAnalyticsPage() {
  const session = await getSession();
  if (!session || session.role !== 'artisan') redirect('/auth/login?next=/artisan/analytics');

  const stats = await artisanAnalytics(session.id);
  return (
    <>
      <main className="mx-auto max-w-4xl px-4 py-10">
        <h1 className="font-serif text-3xl font-bold text-brand-900">Analytics</h1>

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <div className="card p-5"><p className="text-sm text-stone-500">Total sales</p><p className="mt-1 text-2xl font-bold text-brand-700">₱{stats.totalSales.toFixed(2)}</p></div>
          <div className="card p-5"><p className="text-sm text-stone-500">Orders</p><p className="mt-1 text-2xl font-bold text-brand-700">{stats.totalOrders}</p></div>
          <div className="card p-5"><p className="text-sm text-stone-500">Average rating</p><p className="mt-1 text-2xl font-bold text-brand-700">{stats.avgRating != null ? `${stats.avgRating.toFixed(1)} ★` : '—'}</p></div>
          <div className="card p-5"><p className="text-sm text-stone-500">Products</p><p className="mt-1 text-2xl font-bold text-brand-700">{stats.productCount}</p></div>
          <div className="card p-5"><p className="text-sm text-stone-500">Bookings</p><p className="mt-1 text-2xl font-bold text-brand-700">{stats.bookingCount}</p></div>
          <div className="card p-5"><p className="text-sm text-stone-500">Pending bookings</p><p className="mt-1 text-2xl font-bold text-brand-700">{stats.pendingBookings}</p></div>
        </div>

        <div className="mt-8 grid gap-6 md:grid-cols-2">
          <div className="card p-5">
            <h2 className="font-serif text-lg font-bold text-brand-900">Top products</h2>
            <div className="mt-3 space-y-2 text-sm">
              {stats.topProducts.map((t) => (
                <div key={t.name} className="flex justify-between">
                  <span className="text-stone-600">{t.name} <span className="text-stone-400">×{t.qty}</span></span>
                  <span className="font-semibold text-brand-700">₱{t.revenue.toFixed(2)}</span>
                </div>
              ))}
              {stats.topProducts.length === 0 && <p className="text-stone-400">No sales yet.</p>}
            </div>
          </div>
          <div className="card p-5">
            <h2 className="font-serif text-lg font-bold text-brand-900">Recent reviews</h2>
            <div className="mt-3 space-y-2 text-sm">
              {stats.recentReviews.map((r, i) => (
                <div key={i}>
                  <p className="text-stone-600">{r.name} <span className="text-amber-500">{'★'.repeat(r.rating)}</span></p>
                  {r.comment && <p className="text-xs text-stone-500">“{r.comment}”</p>}
                </div>
              ))}
              {stats.recentReviews.length === 0 && <p className="text-stone-400">No reviews yet.</p>}
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
