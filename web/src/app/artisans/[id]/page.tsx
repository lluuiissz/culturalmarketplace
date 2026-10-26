import { notFound } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ProductCard from '@/components/ProductCard';
import WeaveDivider from '@/components/WeaveDivider';
import { getArtisan, listActiveProducts } from '@/lib/db';

export const dynamic = 'force-dynamic';

export default async function ArtisanProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const artisan = await getArtisan(Number(id));
  if (!artisan) notFound();
  const products = await listActiveProducts({ artisanId: artisan.id });

  return (
    <div className="min-h-screen flex flex-col bg-canvas">
      <Header />

      <main className="mx-auto max-w-6xl px-4 py-8 flex-1 w-full">
        {/* Breadcrumb Navigation */}
        <div className="mb-6 flex items-center gap-2 text-xs text-stone-500">
          <Link href="/artisans" className="hover:text-crimson-700">
            ← Master Artisans
          </Link>
          <span>/</span>
          <span className="font-semibold text-charcoal-900">{artisan.name}</span>
        </div>

        {/* Master Artisan Atelier Header Card */}
        <div className="rounded-3xl border border-abaca-200/90 bg-white/95 p-6 sm:p-10 shadow-xs relative overflow-hidden">
          <WeaveDivider pattern="diamond" className="absolute top-0 left-0 right-0 opacity-25" />

          <div className="flex flex-col items-start gap-6 sm:flex-row sm:items-center pt-2">
            {artisan.profile_picture ? (
              <img
                src={artisan.profile_picture}
                alt={artisan.name}
                className="h-28 w-28 sm:h-36 sm:w-36 rounded-3xl object-cover border-4 border-ochre-300 shadow-md bg-stone-100"
              />
            ) : (
              <div className="flex h-28 w-28 sm:h-36 sm:w-36 items-center justify-center rounded-3xl bg-gradient-to-br from-charcoal-950 to-crimson-800 text-3xl font-sculpted font-bold text-ochre-300 shadow-md border-4 border-ochre-300">
                {artisan.name.slice(0, 2).toUpperCase()}
              </div>
            )}

            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="font-sculpted text-2xl sm:text-4xl font-bold text-charcoal-900">
                  {artisan.name}
                </h1>
                {artisan.verification_status === 'approved' && (
                  <span className="badge bg-ochre-100 text-ochre-900 border border-ochre-300 text-xs font-bold">
                    ✔ Verified Cultural Custodian
                  </span>
                )}
              </div>

              <p className="mt-1 text-sm font-semibold text-ochre-700">
                {artisan.business_name ?? 'Independent Cultural Workshop'}
              </p>

              <div className="mt-3 flex flex-wrap gap-2 text-xs">
                {artisan.craft_type && (
                  <span className="rounded-xl bg-abaca-100/70 px-3 py-1 font-semibold text-charcoal-900 border border-abaca-200">
                    🧵 Specialty: {artisan.craft_type}
                  </span>
                )}
                {artisan.location && (
                  <span className="rounded-xl bg-ochre-50 px-3 py-1 font-semibold text-ochre-800 border border-ochre-200">
                    📍 {artisan.location}
                  </span>
                )}
                {artisan.phone && (
                  <span className="rounded-xl bg-white px-3 py-1 font-medium text-stone-600 border border-abaca-200">
                    📞 {artisan.phone}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="mt-8 border-t border-abaca-100 pt-6">
            <h2 className="font-sculpted text-xs font-bold uppercase tracking-wider text-ochre-700">
              Artisan Lineage & Heritage Story
            </h2>
            <p className="mt-2 text-sm sm:text-base leading-relaxed text-stone-700 whitespace-pre-line font-sans">
              {artisan.bio ||
                'This master artisan is dedicated to preserving indigenous craftsmanship, passing traditional techniques down through generations in Agusan del Sur.'}
            </p>
          </div>
        </div>

        {/* Crafts by Artisan */}
        <div className="mt-12">
          <div className="flex items-center justify-between border-b border-abaca-200 pb-3">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-ochre-600 block">
                Artisan Catalog
              </span>
              <h2 className="font-sculpted text-2xl font-bold text-charcoal-900">
                Crafts & Living Workshops
              </h2>
            </div>
            <span className="text-xs text-stone-500 font-medium">
              {products.length} {products.length === 1 ? 'creation' : 'creations'}
            </span>
          </div>

          <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {products.map((p, i) => (
              <ProductCard key={p.id} product={p} priority={i < 4} />
            ))}
          </div>

          {products.length === 0 && (
            <div className="mt-8 rounded-3xl border border-dashed border-abaca-300 bg-white/60 p-10 text-center text-stone-500 max-w-md mx-auto">
              <p className="text-3xl mb-2">🧺</p>
              <p className="font-medium text-xs">No active craft listings currently available from this artisan atelier.</p>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
