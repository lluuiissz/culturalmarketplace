import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { listArtisanOrders } from '@/lib/db';

export const dynamic = 'force-dynamic';

export default async function ArtisanReviewsPage() {
  const session = await getSession();
  if (!session || session.role !== 'artisan') redirect('/auth/login?next=/artisan/reviews');

  const orders = await listArtisanOrders(session.id);
  const reviews = orders.filter((o) => o.review_rating != null);

  return (
    <>
      <main className="mx-auto max-w-2xl px-4 py-10">
        <h1 className="font-serif text-3xl font-bold text-brand-900">My reviews</h1>
        <div className="mt-6 space-y-3">
          {reviews.map((r) => (
            <div key={r.id} className="card p-4">
              <p className="font-semibold text-stone-800">
                {r.product_name}
                <span className="ml-2 text-amber-500">{'★'.repeat(r.review_rating ?? 0)}{'☆'.repeat(5 - (r.review_rating ?? 0))}</span>
              </p>
              {r.review_comment && <p className="mt-1 text-sm text-stone-600">“{r.review_comment}”</p>}
              <p className="mt-1 text-xs text-stone-400">{r.reviewed_at ? new Date(r.reviewed_at).toLocaleString() : ''}</p>
            </div>
          ))}
          {reviews.length === 0 && <p className="text-stone-500">No reviews yet.</p>}
        </div>
      </main>
    </>
  );
}
