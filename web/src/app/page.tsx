import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ProductCard from '@/components/ProductCard';
import WeaveDivider from '@/components/WeaveDivider';
import { listActiveProducts, getSettings, listCategories } from '@/lib/db';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const [products, settings, categories] = await Promise.all([
    listActiveProducts(),
    getSettings(),
    listCategories('product'),
  ]);
  const featured = products.slice(0, 8);
  const workshopCrafts = products.filter((p) => p.has_tutorial).slice(0, 3);

  return (
    <div className="min-h-screen flex flex-col bg-canvas">
      <Header />

      {/* Hero Section */}
<section
  className="relative isolate overflow-hidden border-b border-abaca-200/80 bg-[#F5EBDD]"
  style={{
    backgroundImage: "url('/images/homepage-background.png')",
    backgroundSize: 'cover',
    backgroundPosition: 'center 70%',
    backgroundRepeat: 'no-repeat',
  }}
>
  {/* Cream gradient overlay for readable text */}
  <div
    className="absolute inset-0 z-0 bg-gradient-to-r from-[#F5EBDD]/70 via-[#F5EBDD]/30 to-[#F5EBDD]/5"
    aria-hidden="true"
  />

  {/* Top decorative weave border */}
  <div className="relative z-20">
    <WeaveDivider pattern="kalinga" />
  </div>

  {/* Hero Content */}
  <div className="relative z-10 mx-auto flex min-h-[410px] max-w-6xl items-center px-5 py-14 sm:min-h-[430px] sm:px-8 sm:py-16">
    <div className="max-w-[620px] text-left">

      <h1 className="font-sculpted max-w-[600px] text-4xl font-extrabold leading-[1.02] tracking-tight text-[#990000] drop-shadow-[0_1px_1px_rgba(255,255,255,0.35)] sm:text-5xl md:text-[3.4rem]">
        {settings.homepage_banner_title ??
          'Discover Authentic Indigenous Crafts & Experiences'}
      </h1>

      <p className="mt-4 max-w-xl font-sans text-sm font-medium leading-relaxed text-[#211B17] sm:text-base md:text-lg">
        {settings.homepage_banner_subtitle ??
          'Supporting Agusan del Sur Artisans and Preserving Cultural Heritage'}
      </p>

      {/* Hero Action Buttons */}
      <div className="mt-7 flex flex-wrap items-center justify-start gap-3">

        <Link
          href="/customer/browse"
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[#990000] bg-[#A50000] px-7 py-3 text-sm font-bold text-white shadow-md transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#850000] hover:shadow-lg"
        >
          Explore
          <span aria-hidden="true">→</span>
        </Link>

        <Link
          href="/artisans"
          className="inline-flex min-h-11 items-center justify-center rounded-xl border border-[#D9A400] bg-white px-6 py-3 text-sm font-bold text-[#C58300] shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#FFF8E7] hover:shadow-md"
        >
          Meet Artisans
        </Link>

        <Link
          href="/auth/register-artisan"
          className="inline-flex min-h-11 items-center justify-center rounded-xl border border-black bg-black px-6 py-3 text-sm font-bold text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#292929] hover:shadow-md"
        >
          Enroll as Artisan
        </Link>

      </div>
    </div>
  </div>

  {/* Bottom decorative weave border */}
  <div className="relative z-20">
    <WeaveDivider pattern="kalinga" />
  </div>
</section>
      

      <main className="mx-auto max-w-6xl px-4 py-12 flex-1 w-full">
        {/* Category Weave Pills */}
        <div className="mb-12">
  <div className="mb-3 flex items-center justify-between border-b border-stone-300 pb-3">
    <h2 className="font-sans text-xl font-extrabold tracking-tight text-[#44403C] sm:text-2xl">
      Traditional Craft Categories
    </h2>

    <Link
      href="/customer/browse"
      className="text-base font-medium text-[#990000] transition-colors hover:text-[#C5832B] hover:underline sm:text-lg"
    >
      View all crafts...
    </Link>
  </div>
          <div className="flex flex-wrap justify-center gap-3">
            {categories
              .filter((c) => c.name.toLowerCase() !== 'other')
              .map((c) => (
                <Link
                  key={c.id}
                  href={`/customer/browse?category=${encodeURIComponent(c.name)}`}
                  className="rounded-xl border border-[#DCC5A8] bg-white px-5 py-2.5 text-base font-medium text-[#211B17] transition hover:bg-[#FFF4E5]"
                >
                  {c.name}
                </Link>
              ))}
          </div>
        </div>

        {/* Featured Masterpieces */}
        <section className="mb-16">
          <div className="flex items-end justify-between border-b border-abaca-200 pb-3">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-ochre-600 block">
                Artisan Creations
              </span>
              <h2 className="font-sculpted text-2xl font-bold text-charcoal-900 sm:text-3xl">
                Featured Cultural Crafts
              </h2>
            </div>
            <Link href="/customer/browse" className="text-xs font-semibold text-crimson-700 hover:underline mb-1">
              Browse Full Catalog →
            </Link>
          </div>

          <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {featured.map((p, i) => (
              <ProductCard key={p.id} product={p} priority={i < 4} />
            ))}
          </div>
        </section>

        {/* Living Cultural Workshops Spotlight */}
        {workshopCrafts.length > 0 && (
          <section className="mb-16 rounded-3xl border border-ochre-300 bg-gradient-to-br from-ochre-50/50 via-white to-canvas p-6 sm:p-10 shadow-xs relative overflow-hidden">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-ochre-200/80 pb-6">
              <div>
                <span className="badge bg-charcoal-900 text-ochre-300 border border-ochre-500 font-bold text-xs py-1 px-3">
                  🌿 Living Cultural Workshops
                </span>
                <h2 className="mt-2 font-sculpted text-2xl sm:text-3xl font-bold text-charcoal-900">
                  Learn Directly from Indigenous Masters
                </h2>
                <p className="mt-1 text-sm text-stone-600 max-w-xl">
                  Participate in live hands-on tutorials. Weave, carve, and preserve ancestral skills guided step-by-step by master artisans.
                </p>
              </div>
              <Link href="/customer/browse" className="btn bg-crimson-600 text-white hover:bg-crimson-700 font-semibold text-xs px-5 py-2.5 shrink-0 shadow-xs">
                Explore All Workshops →
              </Link>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-3">
              {workshopCrafts.map((w) => (
                <div key={w.id} className="rounded-2xl border border-abaca-200 bg-white p-5 shadow-2xs flex flex-col justify-between hover:border-ochre-400 transition">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-ochre-800">Hands-on Experience</span>
                    <h3 className="font-sculpted text-base font-bold text-charcoal-900 mt-1 line-clamp-1">{w.tutorial_title || w.name}</h3>
                    <p className="text-xs text-stone-500 mt-1 line-clamp-2">{w.tutorial_description || w.description}</p>
                    {w.tutorial_location && (
                      <p className="text-[11px] text-stone-400 mt-2">📍 {w.tutorial_location}</p>
                    )}
                  </div>
                  <div className="mt-4 pt-3 border-t border-abaca-100 flex items-center justify-between">
                    <span className="text-xs font-bold text-charcoal-900 font-mono">
                      {w.tutorial_fee_type === 'free' ? 'FREE Workshop' : `₱${Number(w.tutorial_price ?? w.price).toFixed(2)} / attendee`}
                    </span>
                    <Link href={`/customer/browse/${w.id}`} className="text-xs font-semibold text-crimson-700 hover:underline">
                      Reserve Pass →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Sacred Seal of Authenticity NFC Section */}
        <section className="relative overflow-hidden rounded-3xl border border-ochre-300/80 bg-gradient-to-br from-white via-ecru/40 to-canvas p-8 sm:p-12 text-center shadow-xs">
          <div className="mx-auto max-w-2xl">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-ochre-500 to-crimson-600 text-3xl text-white shadow-sm mb-4">
              <span>🛡️</span>
            </div>
            <h2 className="font-sculpted text-2xl sm:text-3xl font-bold text-charcoal-900">
              Sacred Seal of Authenticity
            </h2>
            <p className="mt-3 text-sm sm:text-base text-stone-600 leading-relaxed font-sans">
              Every certified craft carries a cryptographically registered NFC chip. Tap it with any smartphone to instantly confirm its provenance, the master artisan behind it, and its ancestral lineage.
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <Link href="/verify/35:F3:D4:33:79" className="btn-secondary px-5 py-2.5 text-xs font-semibold">
                Test NFC Live Verification Demo
              </Link>
              <Link href="/artisans" className="btn-outline px-5 py-2.5 text-xs font-semibold">
                View Certified Master Registry
              </Link>
            </div>
            <p className="mt-4 text-xs text-stone-400">
              Demo Tag Code: <code className="rounded-md bg-abaca-100 px-2 py-0.5 font-mono text-charcoal-900 font-semibold">35:F3:D4:33:79</code>
            </p>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
