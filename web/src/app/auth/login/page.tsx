import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import WeaveDivider from '@/components/WeaveDivider';
import LoginForm from './LoginForm';

export default async function LoginPage() {
  const session = await getSession();

  if (session) {
    redirect(
      session.role === 'admin'
        ? '/admin/dashboard'
        : session.role === 'artisan'
        ? '/artisan/dashboard'
        : '/customer/account/dashboard'
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-canvas px-3 py-8 sm:px-6 sm:py-12">
      {/* Login Card */}
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
        <div className="px-5 pb-7 pt-6 sm:px-9 sm:pb-8 sm:pt-8">

          {/* Page Heading */}
          <div className="text-center">
            <h2 className="font-sculpted text-2xl font-bold text-charcoal-900 sm:text-3xl">
              Welcome to our Community!
            </h2>

            <p className="mx-auto mt-3 max-w-md text-xs leading-relaxed text-stone-500 sm:text-sm">
              Explore authentic Indigenous crafts, learn about their cultural
              stories, and connect with local artisans. Sign in to access your
              account and enjoy all the features of our marketplace.
            </p>
          </div>

          {/* Login Form */}
          <div className="mt-5 w-full min-w-0 sm:mt-8">
            <LoginForm />
          </div>

          {/* Register Links */}
          <div className="mt-3 space-y-2 text-center text-xs leading-relaxed text-stone-500  sm:text-sm">
  <p>
    New to our marketplace?{' '}
    <Link className="text-stone-600 underline transition hover:text-crimson-700" href="/auth/register">
      Create a Buyer Account
    </Link>
  </p>
  <p>
    <Link className="text-stone-600 underline transition hover:text-crimson-700" href="/auth/register-artisan">
      Register as an Artisan
    </Link>
  </p>
</div>
        </div>
      </div>
    </main>
  );
}
