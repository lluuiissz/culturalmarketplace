import { notFound } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ProductCard from '@/components/ProductCard';
import { getArtisan, listActiveProducts } from '@/lib/db';

export const dynamic = 'force-dynamic';

export default async function ArtisanProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const artisan = await getArtisan(Number(id));
  if (!artisan) notFound();
  const products = await listActiveProducts({ artisanId: artisan.id });

  return (
    <>
      <Header />
      <main className="mx-auto max-w-6xl px-4 py-10">
        <div className="mb-6 flex items-center gap-2 text-xs text-stone-500">
          <Link href="/artisans" className="hover:text-brand-700 hover:underline">
            ← All Artisans
          </Link>
          <span>/</span>
          <span className="font-medium text-stone-800">{artisan.name}</span>
        </div>

        <div className="card overflow-hidden p-6 sm:p-8 bg-gradient-to-br from-white via-stone-50/50 to-brand-50/30 border border-stone-200">
          <div className="flex flex-col items-start gap-6 sm:flex-row sm:items-center">
            {artisan.profile_picture ? (
              <img
                src={artisan.profile_picture}
                alt={artisan.name}
                className="h-28 w-28 sm:h-36 sm:w-36 rounded-3xl object-cover border-4 border-white shadow-md bg-stone-100"
              />
            ) : (
              <div className="flex h-28 w-28 sm:h-36 sm:w-36 items-center justify-center rounded-3xl bg-gradient-to-br from-brand-800 to-amber-700 text-3xl font-serif font-bold text-white shadow-md border-4 border-white">
                {artisan.name.slice(0, 2).toUpperCase()}
              </div>
            )}

            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="font-serif text-2xl sm:text-3xl font-bold text-brand-900">{artisan.name}</h1>
                {artisan.verification_status === 'approved' && (
                  <span className="badge bg-leaf-500/10 text-leaf-700 text-xs font-semibold">
                    ✔ Verified Master Artisan
                  </span>
                )}
              </div>

              <p className="mt-1 text-sm font-semibold text-brand-700">
                {artisan.business_name ?? 'Independent Cultural Master'}
              </p>

              <div className="mt-3 flex flex-wrap gap-2 text-xs">
                {artisan.craft_type && (
                  <span className="rounded-lg bg-stone-100 px-2.5 py-1 font-medium text-stone-800 border border-stone-200">
                    🧵 Specialty: {artisan.craft_type}
                  </span>
                )}
                {artisan.location && (
                  <span className="rounded-lg bg-amber-50 px-2.5 py-1 font-medium text-amber-900 border border-amber-200">
                    📍 {artisan.location}
                  </span>
                )}
                {artisan.phone && (
                  <span className="rounded-lg bg-white px-2.5 py-1 font-medium text-stone-600 border border-stone-200">
                    📞 {artisan.phone}
                  </span>
                )}
                {artisan.email && (
                  <span className="rounded-lg bg-white px-2.5 py-1 font-medium text-stone-600 border border-stone-200">
                    ✉️ {artisan.email}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="mt-6 border-t border-stone-200 pt-5">
            <h2 className="font-serif text-sm font-bold uppercase tracking-wider text-stone-500">
              Artisan Biography & Heritage Story
            </h2>
            <p className="mt-2 text-sm sm:text-base leading-relaxed text-stone-700 whitespace-pre-line">
              {artisan.bio || 'This master artisan is dedicated to preserving indigenous craftsmanship, passing traditional techniques down through generations in Agusan del Sur.'}
            </p>
          </div>
        </div>

        <div className="mt-10">
          <div className="flex items-center justify-between">
            <h2 className="font-serif text-2xl font-bold text-brand-900">
              Crafts & Workshops by {artisan.name}
            </h2>
            <span className="text-xs text-stone-500 font-medium">
              {products.length} {products.length === 1 ? 'item' : 'items'} available
            </span>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {products.map((p, i) => <ProductCard key={p.id} product={p} priority={i < 4} />)}
          </div>
          {products.length === 0 && (
            <div className="mt-6 rounded-xl border border-stone-200 bg-stone-50 p-8 text-center text-stone-500">
              <p>No active craft listings currently available from this artisan.</p>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
