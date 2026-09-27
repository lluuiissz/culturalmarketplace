import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ProductCard from '@/components/ProductCard';
import { listActiveProducts, listApprovedArtisans, getSettings, listCategories } from '@/lib/db';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const [products, artisans, settings, categories] = await Promise.all([
    listActiveProducts(), listApprovedArtisans(), getSettings(), listCategories('product'),
  ]);
  const featured = products.slice(0, 8);

  return (
    <>
      <Header />
      <section className="border-b border-brand-100 bg-gradient-to-b from-brand-100/70 to-brand-50">
        <div className="mx-auto max-w-6xl px-4 py-16 text-center">
          <h1 className="font-serif text-4xl font-bold text-brand-900 md:text-5xl">
            {settings.homepage_banner_title ?? 'Discover Authentic Indigenous Crafts & Experiences'}
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-stone-600">
            {settings.homepage_banner_subtitle ?? 'Supporting Agusan del Sur Artisans and Preserving Cultural Heritage'}
          </p>
          <div className="mt-8 flex justify-center gap-3">
            <Link href="/customer/browse" className="btn-primary">Shop crafts</Link>
            <Link href="/artisans" className="btn-outline">Meet the artisans</Link>
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-6xl px-4 py-12">
        <div className="flex flex-wrap gap-2">
          {categories.map((c) => (
            <Link key={c.id} href={`/customer/browse?category=${encodeURIComponent(c.name)}`} className="badge bg-white px-3 py-1.5 text-stone-600 shadow-sm hover:bg-brand-50">
              {c.name}
            </Link>
          ))}
        </div>

        <h2 className="mt-10 font-serif text-2xl font-bold text-brand-900">Featured crafts</h2>
        <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {featured.map((p, i) => <ProductCard key={p.id} product={p} priority={i < 4} />)}
        </div>

        <section className="card mt-12 p-8 text-center">
          <h2 className="font-serif text-2xl font-bold text-brand-900">Verify authenticity with NFC</h2>
          <p className="mx-auto mt-2 max-w-xl text-stone-600">
            Every tagged craft carries an NFC chip. Tap it with your phone to confirm it&apos;s a genuine artisan-made piece.
          </p>
          <p className="mt-3 text-sm text-stone-400">Demo: visit <code className="rounded bg-stone-100 px-1.5 py-0.5">/verify/35:F3:D4:33:79</code></p>
        </section>
      </main>
      <Footer />
    </>
  );
}
