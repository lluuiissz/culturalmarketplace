import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ProductCard from '@/components/ProductCard';
import WeaveDivider from '@/components/WeaveDivider';
import { listActiveProducts, listCategories } from '@/lib/db';

export const dynamic = 'force-dynamic';

const QUICK_SEARCHES = ['Basket', 'Woven Textile', 'Beadwork', 'Woodcarving', 'Abaca'];

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

  const visibleCategories = categories.filter(
    (c) => c.name.toLowerCase() !== 'other'
  );

  return (
    <div className="min-h-screen flex flex-col bg-canvas">
      <Header />
      <WeaveDivider pattern="kalinga" />

      <main className="mx-auto max-w-6xl px-4 py-10 flex-1 w-full">
        {/* Page Header */}
        <div className="border-b border-abaca-200 pb-6">
          <div className="flex items-center gap-2 text-xs text-stone-500 mb-1">
            <Link href="/" className="hover:text-crimson-700">Home</Link>
            <span>/</span>
            <span className="font-semibold text-charcoal-900">Discover the Craft</span>
          </div>

          <h1 className="font-sculpted text-3xl sm:text-4xl font-bold text-charcoal-900">
            Discover Original Handicrafts the Craft
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
                className="input h-9 !w-56 rounded-xl border-abaca-300 !py-0 px-3 !text-xs"
              >
                <option value="">All Cultural Categories</option>
                {visibleCategories.map((c) => (
                  <option key={c.id} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
              <button
                className="btn-secondary h-9 rounded-xl !px-4 !py-0 !text-xs font-semibold"
                type="submit"
              >
                Apply
              </button>

              {(activeQ || activeCategory) && (
                <Link
                  href="/customer/browse"
                  className="inline-flex h-9 items-center rounded-xl border border-stone-200 bg-stone-50 px-3 text-xs font-medium text-stone-600 transition hover:bg-stone-100"
                >
                  ✕ Reset Filters
                </Link>
              )}
            </form>

            {products.length > 0 && (
              <div className="text-xs font-medium text-stone-500">
                Showing <span className="font-bold text-charcoal-900">{products.length}</span> Authentic Crafts
              </div>
            )}
          </div>

          {/* Browse by craft chips */}
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-ochre-700">
              Browse by craft:
            </span>
            {visibleCategories.map((c) => (
              <Link
                key={c.id}
                href={`/customer/browse?category=${encodeURIComponent(c.name)}`}
                className={`rounded-full border px-3 py-1 text-xs font-medium transition ${activeCategory === c.name
                  ? 'border-crimson-700 bg-crimson-700 text-white'
                  : 'border-abaca-300 bg-white text-charcoal-800 hover:border-ochre-400 hover:bg-ochre-50'
                  }`}
              >
                {c.name}
              </Link>
            ))}
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
          <div className="mx-auto my-14 max-w-lg rounded-3xl border border-dashed border-abaca-300 bg-white/70 p-10 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-ochre-300 bg-ochre-50">
              <svg viewBox="0 0 48 48" fill="none" className="h-9 w-9" aria-hidden="true">
                <path d="M24 3 45 24 24 45 3 24Z" stroke="#9E2A2B" strokeWidth="2" strokeLinejoin="round" />
                <path d="M24 12 36 24 24 36 12 24Z" stroke="#C5832B" strokeWidth="2" strokeLinejoin="round" />
                <path d="M24 19 29 24 24 29 19 24Z" fill="#9E2A2B" />
              </svg>
            </div>

            <h3 className="font-sculpted text-lg font-bold text-charcoal-900">
              No matching traditional crafts
            </h3>
            <p className="mt-2 text-xs leading-relaxed text-stone-500">
              We couldn&apos;t find any pieces matching your current filters. Try one of
              these popular crafts instead:
            </p>

            <div className="mt-4 flex flex-wrap justify-center gap-2">
              {QUICK_SEARCHES.map((t) => (
                <Link
                  key={t}
                  href={`/customer/browse?q=${encodeURIComponent(t)}`}
                  className="rounded-full border border-ochre-300 bg-ochre-50 px-3 py-1 text-xs font-medium text-ochre-800 transition hover:bg-ochre-100"
                >
                  {t}
                </Link>
              ))}
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <Link href="/customer/browse" className="btn-primary px-4 py-2 text-xs font-semibold">
                View All Artisans Crafts
              </Link>
              <Link href="/artisans" className="btn-outline px-4 py-2 text-xs font-semibold">
                Meet the Artisans
              </Link>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
