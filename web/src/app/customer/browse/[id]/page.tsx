import Link from 'next/link';
import { notFound } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { getProduct, getArtisan } from '@/lib/db';
import { getSession } from '@/lib/auth';
import ProductDetailClient from './ProductDetailClient';
import ProductGallery from './ProductGallery';
import ExperienceMap from './ExperienceMap';

export const dynamic = 'force-dynamic';

export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const productId = Number(id);
  if (!Number.isFinite(productId)) notFound();

  const [product, session] = await Promise.all([getProduct(productId), getSession()]);
  if (!product || product.status !== 'active') notFound();

  const artisan = await getArtisan(product.artisan_id);

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
                by <Link className="font-semibold text-brand-600 hover:underline" href={`/artisans/${artisan.id}`} prefetch={true}>{artisan.name}</Link>
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
              <section className="card mt-6 overflow-hidden border-2 border-brand-200 shadow-sm">
                <div className="bg-gradient-to-r from-brand-100/80 to-brand-50 p-4 border-b border-brand-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">🌿</span>
                    <div>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-brand-700">Available Cultural Experience</span>
                      <h2 className="font-serif text-lg font-bold text-brand-900 leading-tight">
                        {product.tutorial_title ?? 'Hands-On Cultural Workshop'}
                      </h2>
                    </div>
                  </div>
                  {product.tutorial_fee_type === 'free' ? (
                    <span className="badge bg-leaf-500 text-white font-bold">FREE</span>
                  ) : product.tutorial_price != null ? (
                    <span className="font-bold text-brand-800 bg-white/80 px-2.5 py-1 rounded-md text-sm border border-brand-200">
                      ₱{Number(product.tutorial_price).toFixed(2)} / person
                    </span>
                  ) : null}
                </div>

                <div className="p-5 space-y-4">
                  <p className="text-sm text-stone-600 whitespace-pre-line leading-relaxed">
                    {product.tutorial_description || 'Join this live cultural workshop and learn traditional crafting techniques firsthand from the artisan.'}
                  </p>

                  {product.tutorial_capacity != null && (
                    <p className="text-xs text-stone-500">
                      👥 Max capacity: <span className="font-semibold text-stone-700">{product.tutorial_capacity} attendees</span> per session
                    </p>
                  )}

                  {product.tutorial_dates && product.tutorial_dates.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-stone-700 uppercase tracking-wider mb-2">
                        📅 Scheduled Sessions
                      </p>
                      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                        {product.tutorial_dates.map((d, i) => (
                          <div key={i} className="rounded-lg border border-stone-200 bg-stone-50 p-2.5 text-xs text-stone-700">
                            <p className="font-bold text-stone-800">
                              {d.date}
                            </p>
                            <p className="text-stone-500 mt-0.5">
                              🕒 {d.time_start} – {d.time_end}
                            </p>
                            {d.location && (
                              <p className="text-stone-500 mt-0.5 truncate">
                                📍 {d.location}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Pinned Venue Map */}
                  <div className="pt-1">
                    <ExperienceMap
                      lat={product.tutorial_lat ?? (product.tutorial_dates?.[0]?.lat ? Number(product.tutorial_dates[0].lat) : null)}
                      lng={product.tutorial_lng ?? (product.tutorial_dates?.[0]?.lng ? Number(product.tutorial_dates[0].lng) : null)}
                      locationName={product.tutorial_location || product.tutorial_dates?.[0]?.location}
                      artisanPhone={artisan?.phone}
                    />
                  </div>
                </div>
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
