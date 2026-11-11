
import Link from 'next/link';
import WeaveDivider from '@/components/WeaveDivider';

type Step = 'details' | 'verify' | 'done';

export default function ArtisanHeader({ step }: { step: Step }) {
  return (
    <>
      {/* Return to Storefront */}
      <div className="mb-3 text-center">
        <Link
          href="/"
          className="text-xs font-semibold text-stone-500 transition hover:text-charcoal-900 sm:text-sm"
        >
          ← Return to Storefront
        </Link>
      </div>

      {/* Artisan Registration Header Card */}
      <div className="w-full overflow-hidden rounded-[2rem] border border-stone-300 bg-white">

        {/* Logo and Brand Name - Same as Login Page */}
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
            <h1 className="text-xl font-extrabold tracking-tight sm:text-[28px]">
              <span className="text-[#8B0000]">Cultural</span>{' '}
              <span className="text-[#FFA500]">Marketplace</span>
            </h1>

            <p className="mt-0.5 text-[10px] font-bold text-[#B00000] sm:text-[11px]">
              Agusan del Sur Indigenous Crafts and Experiences
            </p>
          </div>
        </Link>

        {/* Full-width Weave Divider - Same as Login Page */}
        <WeaveDivider pattern="kalinga" />

        {/* Artisan Registration Header Body */}
        <div className="px-5 pb-7 pt-6 sm:px-9 sm:pb-8 sm:pt-8">

          {/* Page Heading */}
          <div className="text-center">
            <h1 className="font-sculpted text-2xl font-bold text-charcoal-900 sm:text-3xl">
              Register as an Artisan
            </h1>

            <p className="mx-auto mt-3 max-w-md text-xs leading-relaxed text-stone-500 sm:text-sm">
              Join our community of Indigenous artisans in Agusan del Sur. Share
              your traditional crafts, showcase your skills, and offer cultural
              workshops to people who want to learn about your heritage.
            </p>
          </div>

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
    </>
  );
}
