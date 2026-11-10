import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import WeaveDivider from '@/components/WeaveDivider';
import AuthBackdrop from '@/components/AuthBackdrop';
import CraftShowcase from '@/components/CraftShowcase';
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
    <main className="relative flex min-h-screen flex-col items-center overflow-hidden bg-canvas px-4">

      {/* Decorative background (behind everything) */}
      <AuthBackdrop />

      {/* Craft photos / illustrations on both sides (wide screens only).
          224 = half of the login card width (max-w-md = 448px) */}
      <CraftShowcase side="left" cardHalfWidth={224} />
      <CraftShowcase side="right" cardHalfWidth={224} />

      {/* TOP: LOGO + BRAND NAME */}
      <div className="relative w-full max-w-md pt-8 sm:pt-12">
        <div className="flex items-center justify-center gap-4">
          <Link
            href="/"
            className="flex shrink-0 items-center"
            aria-label="Cultural Marketplace — home"
          >
            <img
              src="/images/cultural-marketplace-logo.png"
              alt="Cultural Marketplace Logo"
              className="h-14 w-auto max-w-[115px] object-contain sm:h-16 sm:max-w-[130px]"
            />
          </Link>

          {/* BRAND NAME */}
          <div className="flex min-w-0 flex-col justify-center leading-tight">
            <h1 className="whitespace-nowrap text-base font-extrabold tracking-tight sm:text-xl">
              <span className="text-[#8B0000]">Cultural</span>
              {' '}
              <span className="text-[#FFA500]">Marketplace</span>
            </h1>

            <p className="mt-1 max-w-[230px] text-[9px] font-bold leading-relaxed text-[#B00000] sm:text-[10px]">
              Agusan del Sur Indigenous Crafts and Experiences
            </p>
          </div>
        </div>
      </div>

      {/* MIDDLE: LOGIN CARD */}
      <div className="relative w-full max-w-md py-8">
        <div className="relative overflow-hidden rounded-3xl border border-abaca-200/90 bg-white/95 p-8 shadow-sm">

          {/* KALINGA WEAVE DIVIDER */}
          <WeaveDivider
            pattern="kalinga"
            className="absolute left-0 right-0 top-0 opacity-75"
          />

          <h2 className="pt-2 font-sculpted text-2xl font-bold text-charcoal-900">
            Welcome to the Gathering
          </h2>

          <p className="mt-1 text-xs text-stone-500">
            Sign in to access your patron orders, workshop passes, or artisan atelier.
          </p>

          <div className="mt-6">
            <LoginForm />
          </div>

          <p className="mt-6 text-center text-xs text-stone-500">
            New patron?{' '}
            <Link
              className="font-bold text-crimson-700 hover:underline"
              href="/auth/register"
            >
              Join the Gathering
            </Link>
            {' · '}
            <Link
              className="font-bold text-ochre-700 hover:underline"
              href="/auth/register-artisan"
            >
              Enroll as Artisan
            </Link>
          </p>

          {/* DEMO ACCOUNTS */}
          <div className="mt-6 rounded-2xl border border-abaca-200 bg-canvas p-3.5 text-xs text-stone-600">
            <p className="text-[11px] font-bold uppercase tracking-wider text-ochre-800">
              Demo Test Accounts (password: demo1234)
            </p>

            <p className="mt-1 break-words font-mono text-[11px] text-stone-600">
              customer@demo.local · artisan@demo.local · admin@demo.local
            </p>
          </div>
        </div>
      </div>

      {/* BOTTOM: RETURN TO STOREFRONT */}
      <div className="relative mt-auto pb-8 pt-2 text-center">
        <Link
          href="/"
          className="text-xs font-semibold text-stone-500 transition hover:text-charcoal-900"
        >
          ← Return to Storefront
        </Link>
      </div>

    </main>
  );
}
