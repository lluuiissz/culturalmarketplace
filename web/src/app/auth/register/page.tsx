import Link from 'next/link';
import WeaveDivider from '@/components/WeaveDivider';
import CustomerRegisterForm from './CustomerRegisterForm';

export default function RegisterPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-canvas px-4 py-12">
      {/* LOGO + BRAND NAME */}
  <div className="flex items-center justify-center gap-4">
    <Link
      href="/"
      className="flex shrink-0 items-center"
      aria-label="Cultural Marketplace — home"
    >
      <img
        src="/images/cultural-marketplace-logo.png"
        alt="Cultural Marketplace Logo"
        className="h-16 w-auto max-w-[130px] object-contain"
      />
    </Link>

    {/* BRAND NAME */}
    <div className="flex flex-col justify-center text-left leading-tight">
      <h1 className="whitespace-nowrap text-lg font-extrabold tracking-tight sm:text-xl">
        <span className="text-[#8B0000]">Cultural</span>
        {' '}
        <span className="text-[#FFA500]">Marketplace</span>
      </h1>

      <p className="mt-1 max-w-[190px] text-[9px] font-bold leading-relaxed text-[#B00000] sm:text-[10px]">
        Agusan del Sur Indigenous Crafts and Experiences
      </p>
    </div>

        <div className="rounded-3xl border border-abaca-200/90 bg-white/95 p-8 shadow-xs relative overflow-hidden">
          <WeaveDivider pattern="diamond" className="absolute top-0 left-0 right-0 opacity-30" />

          <h1 className="font-sculpted text-2xl font-bold text-charcoal-900 pt-2">
            Join the Gathering
          </h1>
          <p className="mt-1 text-xs text-stone-500 leading-relaxed">
            Create your patron account to support indigenous artisans, collect authentic crafts, and participate in living cultural workshops.
          </p>

          <div className="mt-6">
            <CustomerRegisterForm />
          </div>

          <p className="mt-6 text-center text-xs text-stone-500">
            Already part of the gathering?{' '}
            <Link className="font-bold text-crimson-700 hover:underline" href="/auth/login">
              Sign in
            </Link>
          </p>
        </div>

        <div className="mt-6 text-center">
          <Link href="/" className="text-xs font-semibold text-stone-500 hover:text-charcoal-900 transition">
            ← Return to Storefront
          </Link>
        </div>
      </div>
    </main>
  );
}
