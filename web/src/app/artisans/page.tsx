import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { listApprovedArtisans } from '@/lib/db';

export const dynamic = 'force-dynamic';

export default async function ArtisansPage() {
  const artisans = await listApprovedArtisans();
  return (
    <>
      <Header />
      <main className="mx-auto max-w-6xl px-4 py-10">
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-800 border border-brand-200">
            🌿 Cultural Custodians of Agusan del Sur
          </div>
          <h1 className="mt-2 font-serif text-3xl font-bold text-brand-900 sm:text-4xl">Meet Our Master Artisans</h1>
          <p className="mt-2 max-w-2xl text-stone-600">
            Discover the verified indigenous masters, weavers, and craftspeople preserving centuries of cultural heritage and traditional artistry.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {artisans.map((a) => (
            <Link
              key={a.id}
              href={`/artisans/${a.id}`}
              prefetch={true}
              className="card group flex flex-col justify-between p-6 transition-all duration-200 hover:shadow-lg hover:border-brand-300"
            >
              <div>
                <div className="flex items-start gap-4">
                  {a.profile_picture ? (
                    <img
                      src={a.profile_picture}
                      alt={a.name}
                      className="h-16 w-16 flex-shrink-0 rounded-2xl object-cover border-2 border-brand-200 shadow-xs"
                    />
                  ) : (
                    <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-700 to-amber-700 text-lg font-bold text-white shadow-xs">
                      {a.name.slice(0, 2).toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <span className="badge bg-leaf-500/10 text-leaf-700 text-[11px] font-semibold">
                      ✔ Verified Master
                    </span>
                    <h2 className="mt-1 font-serif text-lg font-bold text-brand-900 group-hover:text-brand-700 truncate">
                      {a.name}
                    </h2>
                    <p className="text-xs font-medium text-stone-500 truncate">
                      {a.business_name ?? 'Independent Cultural Workshop'}
                    </p>
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap gap-1.5 text-xs">
                  {a.craft_type && (
                    <span className="rounded-md bg-stone-100 px-2 py-0.5 font-medium text-stone-700 border border-stone-200">
                      🧵 {a.craft_type}
                    </span>
                  )}
                  {a.location && (
                    <span className="rounded-md bg-amber-50 px-2 py-0.5 font-medium text-amber-800 border border-amber-200">
                      📍 {a.location}
                    </span>
                  )}
                </div>

                <p className="mt-3 text-sm text-stone-600 line-clamp-3 leading-relaxed">
                  {a.bio || 'Cultural master practicing traditional craftsmanship in Agusan del Sur.'}
                </p>
              </div>

              <div className="mt-5 border-t border-stone-100 pt-3 flex items-center justify-between">
                <span className="text-xs font-semibold text-brand-700 group-hover:underline">
                  View Full Profile & Crafts →
                </span>
                <span className="text-xs text-stone-400">Authentic Heritage</span>
              </div>
            </Link>
          ))}
        </div>

        {artisans.length === 0 && (
          <div className="mt-12 rounded-2xl border border-stone-200 bg-stone-50 p-12 text-center text-stone-500">
            <p className="text-3xl mb-2">🌿</p>
            <p className="font-medium">No verified artisans listed yet.</p>
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}
