import Link from 'next/link';
import WeaveDivider from '@/components/WeaveDivider';

type Step = 'details' | 'verify' | 'done';

/**
 * Top section of the artisan registration page:
 * back link, then a card with logo + brand name, heading, description
 * and the progress steps.
 */
export default function ArtisanHeader({ step }: { step: Step }) {
  return (
    <>
      <div className="mb-3">
        <Link
            href="/"
            className="text-xs font-semibold text-stone-500 transition hover:text-charcoal-900 sm:text-sm"
          >
            ← Return to Storefront
          </Link>
      </div>

      <div className="relative overflow-hidden rounded-2xl border border-abaca-200/90 bg-white/95 p-4 text-center shadow-sm sm:rounded-3xl sm:p-7 md:p-9">
        {/* Decorative Top Border */}
        <WeaveDivider
          pattern="kalinga"
          className="absolute left-0 right-0 top-0 opacity-30"
        />

        {/* Logo and Brand Name */}
        <div className="mb-6 flex w-full flex-col items-center sm:mb-8">
          <img
            src="/images/cultural-marketplace-logo.png"
            alt="Cultural Marketplace Logo"
            className="mb-1 h-16 w-auto max-w-[160px] object-contain sm:h-20 sm:max-w-[180px]"
          />

          <p className="text-xl font-extrabold tracking-tight sm:text-2xl">
            <span className="text-[#8B0000]">Cultural</span>{' '}
            <span className="text-[#FFA500]">Marketplace</span>
          </p>

          <p className="mt-1 max-w-[280px] text-xs leading-relaxed text-[#B00000] sm:text-sm">
            Agusan del Sur Indigenous Crafts and Experiences
          </p>
        </div>

        {/* Heading */}
        <h1 className="font-sculpted text-2xl font-bold text-charcoal-900 sm:text-3xl">
          Enroll as a Master Artisan
        </h1>
        <p className="mx-auto mt-2 max-w-md font-sans text-xs leading-relaxed text-stone-600 sm:text-sm">
          Join the cultural custodians of Agusan del Sur. Showcase your living
          heritage, traditional weaves, and hands-on workshops with patrons
          worldwide.
        </p>

        {/* Progress Steps */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-2 text-xs">
          <span
            className={`badge ${
              step === 'details'
                ? 'bg-crimson-600 font-bold text-white'
                : 'bg-ochre-100 text-ochre-800'
            }`}
          >
            1. Lineage &amp; ID
          </span>
          <span className="text-stone-300">→</span>
          <span
            className={`badge ${
              step === 'verify'
                ? 'bg-crimson-600 font-bold text-white'
                : 'bg-stone-100 text-stone-400'
            }`}
          >
            2. Biometrics &amp; Craft
          </span>
          <span className="text-stone-300">→</span>
          <span
            className={`badge ${
              step === 'done'
                ? 'bg-ochre-700 font-bold text-white'
                : 'bg-stone-100 text-stone-400'
            }`}
          >
            3. Curated Review
          </span>
        </div>
      </div>
    </>
  );
}
