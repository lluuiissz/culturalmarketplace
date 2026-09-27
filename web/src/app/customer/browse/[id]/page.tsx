import { notFound } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { getProduct, getArtisan } from '@/lib/db';
import { getSession } from '@/lib/auth';
import ProductDetailClient from './ProductDetailClient';
import ProductGallery from './ProductGallery';

export const dynamic = 'force-dynamic';

export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const productId = Number(id);
  if (!Number.isFinite(productId)) notFound();

  const product = await getProduct(productId);
  if (!product || product.status !== 'active') notFound();

  const [artisan, session] = await Promise.all([getArtisan(product.artisan_id), getSession()]);

  return (
    <>
      <Header />
      <main className="mx-auto max-w-6xl px-4 py-10">
        <div className="grid gap-10 md:grid-cols-2">
          <div>
            <ProductGallery main={product.image_path} gallery={product.product_gallery} name={product.name} hasTutorial={product.has_tutorial} />
            {product.variations_data?.length ? (
              <p className="mt-3 text-sm text-stone-500">
                Variants available: {product.variations_data.map((v) => v.name).join(' · ')}
              </p>
            ) : null}
          </div>
          <div>
            <h1 className="font-serif text-3xl font-bold text-brand-900">{product.name}</h1>
            {artisan && (
              <p className="mt-2 text-sm text-stone-500">
                by <a className="font-semibold text-brand-600 hover:underline" href={`/artisans/${artisan.id}`}>{artisan.name}</a>
                {artisan.location ? ` · ${artisan.location}` : ''}
              </p>
            )}
            <p className="mt-4 text-3xl font-bold text-brand-700">₱{Number(product.price).toFixed(2)}</p>
            <p className="mt-4 whitespace-pre-line text-stone-600">{product.description}</p>
            {product.materials_used && <p className="mt-2 text-sm text-stone-500">Materials: {product.materials_used}</p>}
            {product.nfc_tag_id && (
              <p className="mt-2 text-sm text-leaf-700">✔ NFC-verified authentic craft</p>
            )}

            {product.has_tutorial && (
              <section className="card mt-6 p-5">
                <h2 className="font-serif text-lg font-bold text-brand-900">
                  🧑‍🏫 {product.tutorial_title ?? 'Workshop experience'}
                </h2>
                <p className="mt-2 text-sm text-stone-600">{product.tutorial_description}</p>
                {product.tutorial_dates?.map((d, i) => (
                  <p key={i} className="mt-2 text-sm text-stone-500">
                    📅 {d.date} · {d.time_start}–{d.time_end} {d.location ? `· ${d.location}` : ''}
                  </p>
                ))}
                {product.tutorial_price != null && (
                  <p className="mt-2 text-sm font-semibold text-brand-700">
                    Workshop fee: ₱{Number(product.tutorial_price).toFixed(2)}{product.tutorial_fee_type === 'free' ? ' (free)' : ''}
                  </p>
                )}
              </section>
            )}

            <ProductDetailClient product={product} loggedIn={session?.role === 'customer'} />
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
