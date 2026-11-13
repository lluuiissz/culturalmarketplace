import Link from 'next/link';
import { notFound } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import WeaveDivider from '@/components/WeaveDivider';
import { getSession } from '@/lib/auth';
import ProductDetailClient from './ProductDetailClient';
import ProductGallery from './ProductGallery';
import ExperienceMap from './ExperienceMap';
import { getProduct, getArtisan, listProductReviews } from '@/lib/db';
import ReviewList from './ReviewList';

export const dynamic = 'force-dynamic';

export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const productId = Number(id);
  if (!Number.isFinite(productId)) notFound();

  const [product, session] = await Promise.all([getProduct(productId), getSession()]);
  if (!product || product.status !== 'active') notFound();

  const [artisan, reviews] = await Promise.all([
  getArtisan(product.artisan_id),
  listProductReviews(product.id),
]);
const productReviews = reviews.filter((r) => r.purchase_type !== 'workshop');
const workshopReviews = reviews.filter((r) => r.purchase_type === 'workshop');

  const lat =
    product.tutorial_lat ??
    (product.tutorial_dates?.[0]?.lat ? Number(product.tutorial_dates[0].lat) : null);
  const lng =
    product.tutorial_lng ??
    (product.tutorial_dates?.[0]?.lng ? Number(product.tutorial_dates[0].lng) : null);

  return (
    <div className="flex min-h-screen flex-col bg-[#FCF9F4]">
      <Header />
      <WeaveDivider pattern="kalinga" />

      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-6">
        {/* ===== MAIN PRODUCT CARD ===== */}
        <section className="rounded-2xl border border-[#D6D0C9] bg-white p-5 shadow-sm">
          <div className="grid gap-5 md:grid-cols-[340px_1fr]">
            {/* LEFT: main image + thumbnails */}
            <ProductGallery
              main={product.image_path}
              gallery={product.product_gallery}
              name={product.name}
              hasTutorial={product.has_tutorial}
            />

            {/* RIGHT: name, price, stock, workshop box */}
            <div className="min-w-0">
              <h1 className="font-serif text-lg font-bold text-[#3D3028]">{product.name}</h1>
              <p className="text-sm font-bold text-[#8B0000]">
                ₱{Number(product.price).toFixed(2)}
              </p>
              <p className="mt-2 text-xs font-medium text-[#B07A00]">
                {product.stock_quantity > 0 ? `${product.stock_quantity} available` : 'Made to order'}
              </p>

              {product.has_tutorial && (
                <div className="mt-3 flex items-center gap-3 rounded-xl border border-[#E3E3E3] bg-[#F8F8F8] p-3">
                  {/* Map shortcut tile */}
                  <a
                    href="#workshop-map"
                    className="flex h-24 w-24 shrink-0 flex-col items-center justify-center gap-1 rounded-xl border border-[#D6D0C9] bg-white text-center transition hover:bg-[#FFF5E4]"
                  >
                  <span className="text-2xl">🗺️</span>
                  <span className="text-[10px] font-semibold text-[#9A681D]">View map</span>
                  </a>

                  {/* Workshop info */}
                  <div className="min-w-0 flex-1 text-center">
                    <p className="text-sm font-bold text-[#8B0000]">Workshop Available!</p>

                    {product.tutorial_dates && product.tutorial_dates.length > 0 && (
                      <ul className="mt-1 space-y-0.5 text-[10px] text-[#71675F]">
                        {product.tutorial_dates.slice(0, 3).map((d, i) => (
                          <li key={i} className="truncate">
                            📅 {d.date}
                            {d.location ? ` | ${d.location}` : ''}
                          </li>
                        ))}
                      </ul>
                    )}

                    <a
                      href="#workshop-booking"
                      className="mt-2 inline-block rounded-md border border-[#D6B56D] bg-white px-5 py-0.5 text-[10px] font-medium text-[#9A681D] transition hover:bg-[#FFF5E4]"
                    >
                      Full details
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* DESCRIPTION */}
          <div className="mt-4">
            <p className="text-xs font-bold text-[#3D3028]">Description:</p>
            <p className="mt-0.5 whitespace-pre-line text-xs leading-snug text-[#5A5048]">
              {product.description}
            </p>
          </div>

          {/* ARTISAN + REPORT */}
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-gray-300 pt-3">
            {artisan ? (
              <div className="flex items-center gap-2.5">
                {artisan.profile_picture ? (
                  <img
                    src={artisan.profile_picture}
                    alt={artisan.name}
                    className="h-9 w-9 rounded-full border border-[#D8C8B5] object-cover"
                  />
                ) : (
                  <div className="flex h-9 w-9 items-center justify-center rounded-full border border-[#D8C8B5] bg-white text-sm font-bold text-[#8B0000]">
                    {artisan.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="min-w-0 leading-tight">
                  <p className="text-[9px] text-[#71675F]">Handcrafted by</p>
                  <Link
                    href={`/artisans/${artisan.id}`}
                    className="block truncate text-sm font-bold text-[#3D3028] hover:text-[#8B0000]"
                  >
                    {artisan.name}
                  </Link>
                </div>
              </div>
            ) : (
              <div />
            )}

            <Link
              href="/customer/account/report"
              className="rounded-md border border-[#E89A9A] bg-[#FBD5D5] px-10 py-1 text-[10px] font-medium text-[#B00000] transition hover:bg-[#F8C2C2]"
            >
              Report this product
            </Link>
          </div>
        </section>

{/* ===== WORKSHOP VENUE MAP ===== */}
{product.has_tutorial && (
  <section
    id="workshop-map"
    className="mt-6 scroll-mt-24 rounded-xl border border-[#D6D0C9] bg-white p-4 shadow-sm"
  >
    <h2 className="border-b border-[#D6D0C9] pb-1 font-serif text-base font-bold text-[#3D3028]">
      Workshop Venue
    </h2>
    {(product.tutorial_location || product.tutorial_dates?.[0]?.location) && (
      <p className="mt-2 text-xs text-[#71675F]">
        📍 {product.tutorial_location || product.tutorial_dates?.[0]?.location}
      </p>
    )}
    <div className="mt-3">
      <ExperienceMap
        lat={lat}
        lng={lng}
        locationName={product.tutorial_location || product.tutorial_dates?.[0]?.location}
        artisanPhone={artisan?.phone}
      />
    </div>
  </section>
)}


        {/* ===== BOOKING / ORDER PANEL (logic unchanged) ===== */}
        <ProductDetailClient product={product} loggedIn={session?.role === 'customer'} />

        {/* ===== FEEDBACK + WORKSHOP EXPERIENCE ===== */}
        <div className="mt-6 grid gap-5 md:grid-cols-2">
          {/* Product feedback = ratings */}
          <section className="min-h-[220px] rounded-xl border border-[#D6D0C9] bg-white p-4 shadow-sm">
            <h2 className="border-b border-[#D6D0C9] pb-1 font-serif text-base font-bold text-[#3D3028]">
              Product feedback
            </h2>
            {/* TODO: render product ratings here */}
            <ReviewList reviews={productReviews} empty="No ratings yet." />
          </section>

          {/* Workshop Experience = comments from past attendees */}
          <section className="min-h-[220px] rounded-xl border border-[#D6D0C9] bg-white p-4 shadow-sm">
            <h2 className="border-b border-[#D6D0C9] pb-1 font-serif text-base font-bold text-[#3D3028]">
              Workshop Experience
            </h2>
            {/* TODO: render attendee comments here */}
            <ReviewList reviews={workshopReviews} empty="No workshop comments yet." />
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}