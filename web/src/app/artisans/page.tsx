import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { listApprovedArtisans } from '@/lib/db';
import WeaveDivider from '@/components/WeaveDivider';

export const dynamic = 'force-dynamic';

export default async function ArtisansPage() {
  const artisans = await listApprovedArtisans();

  return (
    <div className="min-h-screen flex flex-col bg-canvas">
      <Header />

      <WeaveDivider pattern="kalinga" />

<main className="mx-auto max-w-6xl px-4 py-8 flex-1 w-full">
        {/* Page Heading */}
        <div className="border-b border-abaca-200 pb-6">
          <h1 className="font-sculpted text-xl sm:text-2xl font-bold text-charcoal-900">
            Local Artisans &amp; Lineage
          </h1>

          <p className="mt-1 max-w-xl text-xs leading-relaxed text-stone-600">
            Meet the Indigenous Masters, traditional weavers, and cultural
            custodians preserving generations of ancestral craftsmanship
            across Agusan del Sur.
          </p>
        </div>

        {/* Artisans Grid */}
        <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {artisans.map((a) => (
            <Link
              key={a.id}
              href={`/artisans/${a.id}`}
              prefetch={true}
              className="group flex h-full flex-col rounded-2xl border border-abaca-200 bg-white p-4 shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:border-ochre-400 hover:shadow-md"
            >
              {/* Photo + badge + names */}
              <div className="flex items-center gap-3">
                {a.profile_picture ? (
                  <img
                    src={a.profile_picture}
                    alt={a.name}
                    className="h-20 w-[72px] shrink-0 rounded-full border border-abaca-300 object-cover"
                  />
                ) : (
                  <div className="flex h-20 w-[72px] shrink-0 items-center justify-center rounded-full border border-abaca-300 bg-gradient-to-br from-charcoal-900 to-crimson-800 text-lg font-bold text-ochre-300">
                    {a.name.slice(0, 2).toUpperCase()}
                  </div>
                )}

                <div className="min-w-0 flex-1">
                  <span className="inline-block rounded bg-[#9E0000] px-2 py-0.5 text-[9px] font-semibold text-white">
                    Verified Artisan
                  </span>

                  <h2 className="mt-1 truncate font-sculpted text-base font-bold leading-tight text-charcoal-900 transition-colors group-hover:text-crimson-700">
                    {a.business_name || a.name}
                  </h2>

                  {a.business_name && (
                    <p className="truncate text-[11px] text-stone-500">
                      by: {a.name}
                    </p>
                  )}
                </div>
              </div>

              {/* Location */}
              {a.location && (
                <span className="mt-3 inline-block max-w-full self-start truncate rounded border border-ochre-200 bg-ochre-50 px-2 py-0.5 text-[10px] font-medium text-ochre-800">
                  {a.location}
                </span>
              )}

              {/* Short bio */}
              <p className="mt-3 line-clamp-2 text-[11px] leading-relaxed text-stone-600">
                {a.bio ||
                  'Local weaver from Agusan del Sur preserving traditional techniques.'}
              </p>
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
              New Artisans craftspeople are currently undergoing authentication and verification.
            </p>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
