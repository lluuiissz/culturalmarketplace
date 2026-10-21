import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import WeaveDivider from '@/components/WeaveDivider';
import { listApprovedArtisans } from '@/lib/db';

export const dynamic = 'force-dynamic';

export default async function ArtisansPage() {
  const artisans = await listApprovedArtisans();

  return (
    <div className="min-h-screen flex flex-col bg-canvas">
      <Header />

      <main className="mx-auto max-w-6xl px-4 py-10 flex-1 w-full">
        {/* Header Banner */}
        <div className="mb-10">
          <div className="inline-flex items-center gap-2 rounded-full bg-white px-3.5 py-1 text-xs font-semibold text-ochre-800 border border-ochre-300 shadow-2xs mb-3">
            <span>🌿</span>
            <span>Cultural Custodians of Agusan del Sur</span>
          </div>

          <h1 className="font-sculpted text-3xl sm:text-4xl lg:text-5xl font-bold text-charcoal-900 leading-tight">
            Master Artisans & Lineage
          </h1>

          <p className="mt-2 max-w-2xl text-sm sm:text-base text-stone-600 leading-relaxed font-sans">
            Meet the indigenous masters, traditional weavers, and cultural custodians preserving generations of ancestral craftsmanship across Agusan del Sur.
          </p>

          <WeaveDivider pattern="diamond" className="mt-6 opacity-40" />
        </div>

        {/* Artisans Grid */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {artisans.map((a) => (
            <Link
              key={a.id}
              href={`/artisans/${a.id}`}
              prefetch={true}
              className="group flex flex-col justify-between rounded-3xl border border-abaca-200/90 bg-white/95 p-6 shadow-xs transition-all duration-200 hover:-translate-y-1 hover:border-ochre-400 hover:shadow-md"
            >
              <div>
                <div className="flex items-start gap-4">
                  {a.profile_picture ? (
                    <img
                      src={a.profile_picture}
                      alt={a.name}
                      className="h-16 w-16 flex-shrink-0 rounded-2xl object-cover border-2 border-ochre-300 shadow-xs"
                    />
                  ) : (
                    <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-charcoal-900 to-crimson-800 text-lg font-bold text-ochre-300 shadow-xs border-2 border-ochre-400/40">
                      {a.name.slice(0, 2).toUpperCase()}
                    </div>
                  )}

                  <div className="min-w-0 flex-1">
                    <span className="badge bg-forest-50 text-forest-700 border border-forest-200 text-[10px] font-bold">
                      ✔ Verified Master
                    </span>
                    <h2 className="mt-1 font-sculpted text-lg font-bold text-charcoal-900 group-hover:text-crimson-700 transition-colors truncate">
                      {a.name}
                    </h2>
                    <p className="text-xs font-semibold text-ochre-700 truncate">
                      {a.business_name ?? 'Independent Cultural Workshop'}
                    </p>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-1.5 text-xs">
                  {a.craft_type && (
                    <span className="rounded-lg bg-abaca-100/70 px-2.5 py-0.5 text-[11px] font-semibold text-charcoal-900 border border-abaca-200">
                      🧵 {a.craft_type}
                    </span>
                  )}
                  {a.location && (
                    <span className="rounded-lg bg-ochre-50 px-2.5 py-0.5 text-[11px] font-semibold text-ochre-800 border border-ochre-200">
                      📍 {a.location}
                    </span>
                  )}
                </div>

                <p className="mt-3.5 text-xs leading-relaxed text-stone-600 line-clamp-3">
                  {a.bio || 'Cultural master practicing traditional craftsmanship and ancestral techniques in Agusan del Sur.'}
                </p>
              </div>

              <div className="mt-6 border-t border-abaca-100 pt-3 flex items-center justify-between">
                <span className="text-xs font-bold text-crimson-700 group-hover:underline flex items-center gap-1">
                  <span>Explore Atelier & Works</span>
                  <span>→</span>
                </span>
                <span className="text-[11px] text-stone-400 font-medium">Sacred Lineage</span>
              </div>
            </Link>
          ))}
        </div>

        {artisans.length === 0 && (
          <div className="my-16 rounded-3xl border border-dashed border-abaca-300 bg-white/60 p-12 text-center max-w-md mx-auto">
            <p className="text-4xl mb-3">🌿</p>
            <h3 className="font-sculpted text-lg font-bold text-charcoal-900">
              No registered artisans yet
            </h3>
            <p className="mt-2 text-xs text-stone-500">
              New master craftspeople are currently undergoing authentication and verification.
            </p>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
