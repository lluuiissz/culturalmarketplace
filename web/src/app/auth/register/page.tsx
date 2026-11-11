import Link from 'next/link';
import WeaveDivider from '@/components/WeaveDivider';
import CustomerRegisterForm from './CustomerRegisterForm';

export default function RegisterPage() {
  return (
    <main className="relative flex min-h-screen items-center justify-center bg-canvas px-3 py-8 sm:px-6 sm:py-12">
      {/* Registration Card */}
      <div className="w-full max-w-xl overflow-hidden rounded-[2rem] border border-stone-300 bg-white">

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
            <h1 className="text-xl font-extrabold tracking-tight sm:text-[28px]">
              <span className="text-[#8B0000]">Cultural</span>{' '}
              <span className="text-[#FFA500]">Marketplace</span>
            </h1>

            <p className="mt-0.5 text-[10px] font-bold text-[#B00000] sm:text-[11px]">
              Agusan del Sur Indigenous Crafts and Experiences
            </p>
          </div>
        </Link>

        {/* Full-width weave band under the header */}
        <WeaveDivider pattern="kalinga" />

        {/* Body */}
        <div className="px-5 pb-7 pt-5 sm:px-9 sm:pb-8">

          {/* Page Heading */}
          <div className="text-center">
            <h2 className="font-sculpted text-2xl font-bold text-charcoal-900 sm:text-3xl">
              Join the Community
            </h2>

            <p className="mx-auto mt-2 max-w-md text-xs leading-relaxed text-stone-500 sm:text-sm">
              Create your patron account to support Indigenous artisans,
              collect authentic crafts, and participate in living cultural
              workshops.
            </p>
          </div>

          {/* Registration Form */}
          <div className="w-full min-w-0">
            <CustomerRegisterForm />
          </div>

          {/* Sign In Link */}
          <p className="mt-5 text-center text-xs leading-relaxed text-stone-500 sm:text-sm">
            Already have an account?{' '}
            <Link
              className="font-medium text-crimson-700 underline transition hover:text-crimson-800"
              href="/auth/login"
            >
              Log in
            </Link>
          </p>
        </div>
        
      </div>
            {/* RETURN TO STOREFRONT - BELOW REGISTRATION CARD */}
      <div className="absolute bottom-4 left-0 w-full text-center sm:bottom-6">
        <Link
          href="/"
          className="text-xs font-semibold text-stone-500 transition hover:text-charcoal-900 sm:text-sm"
        >
          ← Return to Storefront
        </Link>
      </div>
      
    </main>
  );
}
