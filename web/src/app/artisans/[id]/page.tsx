import { notFound } from 'next/navigation';
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
        <div className="card flex flex-col items-start gap-6 p-8 sm:flex-row">
          <div className="flex h-24 w-24 items-center justify-center rounded-full bg-brand-100 text-4xl">🧑‍🎨</div>
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="font-serif text-3xl font-bold text-brand-900">{artisan.name}</h1>
              {artisan.verification_status === 'approved' && <span className="badge bg-leaf-500/10 text-leaf-700">✔ Verified</span>}
            </div>
            <p className="mt-1 text-stone-500">{artisan.business_name ?? 'Independent artisan'} · {artisan.craft_type}</p>
            <p className="mt-1 text-sm text-stone-500">📍 {artisan.location}</p>
            <p className="mt-3 max-w-2xl text-stone-600">{artisan.bio}</p>
          </div>
        </div>

        <h2 className="mt-10 font-serif text-2xl font-bold text-brand-900">Crafts by {artisan.name}</h2>
        <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {products.map((p, i) => <ProductCard key={p.id} product={p} priority={i < 4} />)}
        </div>
        {products.length === 0 && <p className="mt-6 text-stone-500">No active listings right now.</p>}
      </main>
      <Footer />
    </>
  );
}
