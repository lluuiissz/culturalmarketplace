import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ProductCard from '@/components/ProductCard';
import { listActiveProducts, listCategories } from '@/lib/db';

export const dynamic = 'force-dynamic';

export default async function BrowsePage({ searchParams }: { searchParams: Promise<{ category?: string; q?: string }> }) {
  const params = await searchParams;
  const [products, categories] = await Promise.all([
    listActiveProducts({ category: params.category, search: params.q }),
    listCategories('product'),
  ]);

  return (
    <>
      <Header />
      <main className="mx-auto max-w-6xl px-4 py-10">
        <h1 className="font-serif text-3xl font-bold text-brand-900">Browse crafts</h1>
        {/* Search lives in the header (one box per screen); this form only filters. */}
        <form className="mt-4 flex flex-wrap items-center gap-2" action="/customer/browse">
          {params.q ? <input type="hidden" name="q" value={params.q} /> : null}
          <label className="text-sm font-medium text-stone-600">Filter by category</label>
          <select name="category" defaultValue={params.category ?? ''} className="input max-w-[200px]">
            <option value="">All categories</option>
            {categories.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
          </select>
          <button className="btn-outline" type="submit">Apply</button>
          {(params.q || params.category) && (
            <a href="/customer/browse" className="text-sm font-medium text-stone-400 hover:text-stone-600">Clear filters</a>
          )}
        </form>
        {params.q && <p className="mt-2 text-sm text-stone-500">Results for <b>“{params.q}”</b></p>}

        <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {products.map((p, i) => <ProductCard key={p.id} product={p} priority={i < 4} />)}
        </div>
        {products.length === 0 && <p className="mt-10 text-center text-stone-500">No crafts found. Try a different search.</p>}
      </main>
      <Footer />
    </>
  );
}
