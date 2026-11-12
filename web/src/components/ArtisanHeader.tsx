import Link from 'next/link';
import WeaveDivider from '@/components/WeaveDivider';

type Step = 'details' | 'verify' | 'done';

/**
 * Top section of the artisan registration page, styled like the login card:
 * logo + brand name row, full-width weave band, then heading, description
 * and the progress steps.
 */
export default function ArtisanHeader({ step }: { step: Step }) {
  return (
    <div className="overflow-hidden rounded-[2rem] border border-stone-300 bg-white">
      {/* Logo and Brand Name (links back to the storefront) */}
      <Link
        href="/"
        aria-label="Cultural Marketplace — home"
        className="flex flex-wrap items-center justify-center gap-3 px-6 py-4 sm:py-5"
      >
        <img
          src="/images/cultural-marketplace-logo.png"
          alt="Cultural Marketplace Logo"
          className="h-10 w-auto max-w-[110px] object-contain sm:h-12 sm:max-w-[130px]"
        />

        <div className="flex min-w-0 flex-col leading-tight">
          <p className="text-xl font-extrabold tracking-tight sm:text-[28px]">
            <span className="text-[#8B0000]">Cultural</span>{' '}
            <span className="text-[#FFA500]">Marketplace</span>
          </p>

          <p className="mt-0.5 text-[10px] font-bold text-[#B00000] sm:text-[11px]">
            Agusan del Sur Indigenous Crafts and Experiences
          </p>
        </div>
      </Link>

      {/* Full-width weave band under the header */}
      <WeaveDivider pattern="kalinga" />

      {/* Body */}
      <div className="px-5 pb-7 pt-6 text-center sm:px-9 sm:pb-8 sm:pt-8">
        <h1 className="font-sculpted text-2xl font-bold text-charcoal-900 sm:text-3xl">
          Register as an Artisan
        </h1>

        <p className="mx-auto mt-3 max-w-md font-sans text-xs leading-relaxed text-stone-500 sm:text-sm">
          Join our community of Indigenous artisans in Agusan del Sur. Share
              your traditional crafts, showcase your skills, and offer cultural
              workshops to people who want to learn about your heritage.
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
            1. Personal Information
          </span>
          <span className="text-stone-300">→</span>
          <span
            className={`badge ${
              step === 'verify'
                ? 'bg-crimson-600 font-bold text-white'
                : 'bg-stone-100 text-stone-400'
            }`}
          >
            2. Identity &amp; Craft Verification
          </span>
          <span className="text-stone-300">→</span>
          <span
            className={`badge ${
              step === 'done'
                ? 'bg-ochre-700 font-bold text-white'
                : 'bg-stone-100 text-stone-400'
            }`}
          >
            3. Application Review
          </span>
        </div>
      </div>
    </div>
  );
}
