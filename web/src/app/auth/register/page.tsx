import Link from 'next/link';
import WeaveDivider from '@/components/WeaveDivider';
import AuthBackdrop from '@/components/AuthBackdrop';
import CraftShowcase from '@/components/CraftShowcase';
import CustomerRegisterForm from './CustomerRegisterForm';

// Logo and brand header (moved here from the form so it sits above the heading)
function BrandHeader() {
  return (
    <div className="mb-6 flex w-full flex-col items-center text-center sm:mb-8">
      <img
        src="/images/cultural-marketplace-logo.png"
        alt="Cultural Marketplace Logo"
        className="mb-1 h-12 w-auto max-w-[160px] object-contain sm:h-20 sm:max-w-[180px]"
      />

      <h1 className="text-xl font-extrabold tracking-tight sm:text-2xl">
        <span className="text-[#8B0000]">Cultural</span>{' '}
        <span className="text-[#FFA500]">Marketplace</span>
      </h1>

      <p className="mt-1 max-w-[280px] text-xs leading-relaxed text-[#B00000] sm:text-sm">
        Agusan del Sur Indigenous Crafts and Experiences
      </p>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-canvas px-3 py-8 sm:px-6 sm:py-12">

      {/* Decorative background (behind the card) */}
      <AuthBackdrop />

      {/* Craft photos / illustrations on both sides (wide screens only) */}
      <CraftShowcase side="left" />
      <CraftShowcase side="right" />

      {/* Registration Card */}
      <div className="relative w-full max-w-xl overflow-hidden rounded-2xl border border-abaca-200/90 bg-white/95 p-4 shadow-sm sm:rounded-3xl sm:p-7 md:p-9">

        {/* Decorative Top Border */}
        <WeaveDivider pattern="kalinga"
          className="absolute left-0 right-0 top-0 opacity-30"
        />

        {/* Logo and Brand Name */}
        <BrandHeader />

        {/* Page Heading */}
        <div className="text-center">
          <h2 className="font-sculpted text-2xl font-bold text-charcoal-900 sm:text-3xl">
            Join the Gathering
          </h2>

          <p className="mx-auto mt-2 max-w-md text-xs leading-relaxed text-stone-500 sm:text-sm">
            Create your patron account to support Indigenous artisans,
            collect authentic crafts, and participate in living cultural
            workshops.
          </p>
        </div>

        {/* Registration Form */}
        <div className="mt-1 w-full min-w-0 sm:mt-2">
          <CustomerRegisterForm />
        </div>

        {/* Sign In Link */}
        <p className="mt-6 text-center text-xs leading-relaxed text-stone-500 sm:text-sm">
          Already part of the gathering?{' '}
          <Link
            className="font-bold text-crimson-700 transition hover:underline"
            href="/auth/login"
          >
            Sign in
          </Link>
        </p>

        {/* Return to Storefront */}
        <div className="mt-5 border-t border-abaca-200 pt-4 text-center">
          <Link
            href="/"
            className="text-xs font-semibold text-stone-500 transition hover:text-charcoal-900 sm:text-sm"
          >
            ← Return to Storefront
          </Link>
        </div>

      </div>
    </main>
  );
}
