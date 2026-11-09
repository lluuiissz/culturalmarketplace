
import Link from 'next/link';
import WeaveDivider from '@/components/WeaveDivider';
import CustomerRegisterForm from './CustomerRegisterForm';

export default function RegisterPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-canvas px-3 py-8 sm:px-6 sm:py-12">

      {/* Registration Card */}
      <div className="relative w-full max-w-xl overflow-hidden rounded-2xl border border-abaca-200/90 bg-white/95 p-4 shadow-sm sm:rounded-3xl sm:p-7 md:p-9">

        {/* Decorative Top Border */}
        <WeaveDivider pattern="kalinga"
          className="absolute left-0 right-0 top-0 opacity-30"
        />

        {/* Page Heading */}
        <div className="pt-4 text-center sm:pt-5">
          <h1 className="font-sculpted text-2xl font-bold text-charcoal-900 sm:text-3xl">
            Join the Gathering
          </h1>

          <p className="mx-auto mt-2 max-w-md text-xs leading-relaxed text-stone-500 sm:text-sm">
            Create your patron account to support Indigenous artisans,
            collect authentic crafts, and participate in living cultural
            workshops.
          </p>
        </div>

        {/* Registration Form - Includes Logo and Brand Name */}
        <div className="mt-5 w-full min-w-0 sm:mt-7">
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
