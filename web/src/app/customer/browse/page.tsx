import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ProductCard from '@/components/ProductCard';
import WeaveDivider from '@/components/WeaveDivider';
import { listActiveProducts, listCategories } from '@/lib/db';

export const dynamic = 'force-dynamic';

export default async function BrowsePage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; q?: string }>;
}) {
  const params = await searchParams;
  const [products, categories] = await Promise.all([
    listActiveProducts({ category: params.category, search: params.q }),
    listCategories('product'),
  ]);

  const activeCategory = params.category;
  const activeQ = params.q;

  return (
    <div className="min-h-screen flex flex-col bg-canvas">
      <Header />

      <main className="mx-auto max-w-6xl px-4 py-10 flex-1 w-full">
        {/* Page Header */}
        <div className="border-b border-abaca-200 pb-6">
          <div className="flex items-center gap-2 text-xs text-stone-500 mb-1">
            <Link href="/" className="hover:text-crimson-700">Home</Link>
            <span>/</span>
            <span className="font-semibold text-charcoal-900">Discover the Craft</span>
          </div>

          <h1 className="font-sculpted text-3xl sm:text-4xl font-bold text-charcoal-900">
            Discover the Craft
          </h1>
          <p className="mt-1.5 text-sm text-stone-600 max-w-2xl">
            Explore authentic handwoven textiles, traditional woodcarvings, basketry, and living workshop experiences from Agusan del Sur master craftspeople.
          </p>

          {/* Filter Toolbar */}
          <div className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-abaca-200/90 bg-white/90 p-4 shadow-2xs">
            <form className="flex flex-wrap items-center gap-2.5" action="/customer/browse">
              {activeQ ? <input type="hidden" name="q" value={activeQ} /> : null}
              <label htmlFor="cat-select" className="text-xs font-bold uppercase tracking-wider text-ochre-700">
                Category:
              </label>
              <select
                id="cat-select"
                name="category"
                defaultValue={activeCategory ?? ''}
                className="input max-w-[220px] text-xs py-1.5 px-3 rounded-xl border-abaca-300"
              >
                <option value="">All Cultural Categories</option>
                {categories
                  .filter((c) => c.name.toLowerCase() !== 'other')
                  .map((c) => (
                    <option key={c.id} value={c.name}>
                      {c.name}
                    </option>
                  ))}
              </select>
              <button className="btn-secondary py-1.5 px-3.5 text-xs font-semibold rounded-xl" type="submit">
                Apply
              </button>

              {(activeQ || activeCategory) && (
                <Link
                  href="/customer/browse"
                  className="rounded-xl border border-stone-200 bg-stone-50 px-3 py-1.5 text-xs font-medium text-stone-600 hover:bg-stone-100 transition"
                >
                  ✕ Reset Filters
                </Link>
              )}
            </form>

            <div className="text-xs font-medium text-stone-500">
              Showing <span className="font-bold text-charcoal-900">{products.length}</span> authentic crafts
            </div>
          </div>

          {activeQ && (
            <p className="mt-3 text-xs text-ochre-800">
              Searching traditional patterns matching <b>“{activeQ}”</b>
            </p>
          )}
        </div>

        {/* Product Grid */}
        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {products.map((p, i) => (
            <ProductCard key={p.id} product={p} priority={i < 4} />
          ))}
        </div>

        {/* Empty State */}
        {products.length === 0 && (
          <div className="my-16 rounded-3xl border border-dashed border-abaca-300 bg-white/60 p-12 text-center max-w-md mx-auto">
            <div className="text-4xl mb-3">🧺</div>
            <h3 className="font-sculpted text-lg font-bold text-charcoal-900">
              No matching traditional crafts
            </h3>
            <p className="mt-2 text-xs text-stone-500 leading-relaxed">
              We couldn&apos;t find any pieces matching your current filters. Try searching for other materials like abaca, pine, or woven textiles.
            </p>
            <Link href="/customer/browse" className="btn-primary mt-5 text-xs px-4 py-2 font-semibold">
              View All Master Crafts
            </Link>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
