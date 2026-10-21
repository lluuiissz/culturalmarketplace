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
    <div className="min-h-screen flex flex-col bg-canvas">
      <Header />

      <main className="mx-auto max-w-6xl px-4 py-8 flex-1 w-full">
        {/* Breadcrumb Navigation */}
        <div className="mb-6 flex items-center gap-2 text-xs text-stone-500">
          <Link href="/" className="hover:text-crimson-700">Home</Link>
          <span>/</span>
          <Link href="/customer/browse" className="hover:text-crimson-700">Discover the Craft</Link>
          <span>/</span>
          <span className="font-semibold text-charcoal-900 truncate max-w-[200px] sm:max-w-md">{product.name}</span>
        </div>

        <div className="grid gap-10 md:grid-cols-2">
          {/* Left Column: Gallery & Variation Preview */}
          <div>
            <div className="rounded-3xl border border-abaca-200/90 bg-white p-3 shadow-xs">
              <ProductGallery
                main={product.image_path}
                gallery={product.product_gallery}
                name={product.name}
                hasTutorial={product.has_tutorial}
              />
            </div>

            {product.variations_data?.length ? (
              <div className="mt-3 rounded-xl border border-abaca-200 bg-white/80 p-3 text-xs text-stone-600">
                <span className="font-bold text-ochre-700 block uppercase tracking-wider text-[10px]">
                  Cultural Variations Available
                </span>
                <p className="mt-0.5">{product.variations_data.map((v) => `${v.typeLabel}: ${v.name}`).join(' · ')}</p>
              </div>
            ) : null}
          </div>

          {/* Right Column: Cultural Details & Purchase Actions */}
          <div className="space-y-6">
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-2">
                {product.category && (
                  <span className="badge bg-ochre-50 text-ochre-700 border border-ochre-200 text-[11px] font-semibold">
                    {product.category}
                  </span>
                )}
                {product.has_tutorial && (
                  <span className="badge bg-forest-50 text-forest-700 border border-forest-200 text-[11px] font-semibold">
                    🌿 Workshop Included
                  </span>
                )}
              </div>

              <h1 className="font-sculpted text-2xl sm:text-3xl font-bold text-charcoal-900 leading-tight">
                {product.name}
              </h1>

              {artisan && (
                <div className="mt-3 flex items-center gap-3 rounded-2xl border border-abaca-200 bg-white/90 p-3 shadow-2xs">
                  {artisan.profile_picture ? (
                    <img
                      src={artisan.profile_picture}
                      alt={artisan.name}
                      className="h-10 w-10 rounded-full object-cover border border-ochre-300"
                    />
                  ) : (
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-charcoal-900 text-xs font-bold text-ochre-300">
                      {artisan.name.slice(0, 2).toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] uppercase tracking-wider text-ochre-700 font-bold">Handcrafted by Master Custodian</p>
                    <Link
                      href={`/artisans/${artisan.id}`}
                      className="font-bold text-sm text-charcoal-900 hover:text-crimson-700 truncate block"
                    >
                      {artisan.name}
                    </Link>
                    {artisan.location && (
                      <p className="text-[11px] text-stone-500 truncate">📍 {artisan.location}</p>
                    )}
                  </div>
                </div>
              )}

              {/* Price & Stock */}
              <div className="mt-5 flex items-baseline gap-3">
                <span className="text-3xl font-bold text-crimson-700">
                  ₱{Number(product.price).toFixed(2)}
                </span>
                <span className="text-xs text-stone-500 font-medium">
                  {product.stock_quantity > 0 ? `${product.stock_quantity} available in artisan studio` : 'Made to order'}
                </span>
              </div>

              {/* Description */}
              <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-stone-600 font-sans">
                {product.description}
              </p>

              {/* Cultural Materials */}
              {product.materials_used && (
                <div className="mt-4 rounded-xl border border-ochre-200/80 bg-ochre-50/60 p-3 text-xs text-charcoal-900">
                  <span className="font-bold text-ochre-800 block text-[10px] uppercase tracking-wider">
                    🌿 Authentic Cultural Materials
                  </span>
                  <p className="mt-0.5 font-medium">{product.materials_used}</p>
                </div>
              )}

              {/* NFC Verification Seal */}
              {product.nfc_tag_id && (
                <div className="mt-3 flex items-center gap-2 text-xs font-semibold text-forest-700 bg-forest-50 border border-forest-200/80 rounded-xl px-3 py-2">
                  <span>✔</span>
                  <span>Sacred Seal of Authenticity: NFC Verified Genuine Artisan Work</span>
                </div>
              )}
            </div>

            {/* Cultural Workshop Experience Module */}
            {product.has_tutorial && (
              <section className="rounded-2xl border-2 border-forest-200 bg-gradient-to-br from-forest-50/50 via-white to-canvas p-5 shadow-xs space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-forest-100 pb-3">
                  <div className="flex items-center gap-2.5">
                    <span className="text-2xl">🌿</span>
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-forest-700 block">
                        Living Cultural Experience
                      </span>
                      <h2 className="font-sculpted text-lg font-bold text-charcoal-900 leading-tight">
                        {product.tutorial_title ?? 'Hands-On Cultural Workshop'}
                      </h2>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {product.tutorial_fee_type === 'free' ? (
                      <span className="badge bg-forest-700 text-white font-bold text-xs py-1 px-2.5">
                        FREE PASS
                      </span>
                    ) : product.tutorial_price != null ? (
                      <span className="font-bold text-forest-800 bg-white px-2.5 py-1 rounded-lg text-xs border border-forest-200 shadow-2xs">
                        ₱{Number(product.tutorial_price).toFixed(2)} / person
                      </span>
                    ) : null}
                    <a
                      href="#workshop-booking"
                      className="btn bg-forest-700 hover:bg-forest-800 text-white text-xs font-bold px-3.5 py-2 rounded-xl shadow-xs transition inline-flex items-center gap-1.5"
                    >
                      <span>🌿</span>
                      <span>Book Workshop</span>
                      <span>↓</span>
                    </a>
                  </div>
                </div>

                <p className="text-xs text-stone-600 whitespace-pre-line leading-relaxed">
                  {product.tutorial_description ||
                    'Learn ancient crafting techniques directly from the master artisan in a live cultural workshop.'}
                </p>

                {product.tutorial_capacity != null && (
                  <p className="text-xs text-stone-500">
                    👥 Session Capacity: <span className="font-semibold text-stone-700">{product.tutorial_capacity} attendees</span>
                  </p>
                )}

                {product.tutorial_dates && product.tutorial_dates.length > 0 && (
                  <div>
                    <p className="text-[11px] font-bold text-ochre-800 uppercase tracking-wider mb-2">
                      📅 Scheduled Sessions
                    </p>
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                      {product.tutorial_dates.map((d, i) => (
                        <div key={i} className="flex items-center justify-between gap-2 rounded-xl border border-abaca-200 bg-white p-3 text-xs text-stone-700 shadow-2xs">
                          <div className="min-w-0 flex-1">
                            <p className="font-bold text-charcoal-900">📅 {d.date}</p>
                            <p className="text-stone-500 text-[11px]">🕒 {d.time_start} – {d.time_end}</p>
                            {d.location && <p className="text-stone-500 text-[11px] truncate">📍 {d.location}</p>}
                          </div>
                          <a
                            href={`#session-${i}`}
                            className="rounded-lg border border-forest-300 bg-forest-50 px-2.5 py-1.5 text-[11px] font-bold text-forest-800 hover:bg-forest-700 hover:text-white transition shrink-0 shadow-2xs whitespace-nowrap"
                          >
                            Book Date →
                          </a>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Map Venue */}
                <div className="pt-1">
                  <ExperienceMap
                    lat={product.tutorial_lat ?? (product.tutorial_dates?.[0]?.lat ? Number(product.tutorial_dates[0].lat) : null)}
                    lng={product.tutorial_lng ?? (product.tutorial_dates?.[0]?.lng ? Number(product.tutorial_dates[0].lng) : null)}
                    locationName={product.tutorial_location || product.tutorial_dates?.[0]?.location}
                    artisanPhone={artisan?.phone}
                  />
                </div>

                {/* Direct Booking CTA Banner */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-forest-100">
                  <div className="text-xs text-forest-900">
                    <span className="font-bold block">Reserve your hands-on masterclass seat</span>
                    <span className="text-[11px] text-stone-500">Live instruction by master custodian in Agusan del Sur</span>
                  </div>
                  <a
                    href="#workshop-booking"
                    className="btn bg-forest-700 hover:bg-forest-800 text-white font-bold text-xs py-2 px-4 rounded-xl shadow-xs transition inline-flex items-center gap-1.5"
                  >
                    <span>🌿</span>
                    <span>Book Workshop Session Now</span>
                    <span>→</span>
                  </a>
                </div>
              </section>
            )}

            {/* Client Interactive Variation, Attendee & Cart Actions */}
            <ProductDetailClient product={product} loggedIn={session?.role === 'customer'} />
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
