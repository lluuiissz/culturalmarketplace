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
    <main className="flex min-h-screen flex-col items-center justify-center bg-canvas px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <Link href="/" className="inline-flex items-center gap-2 group">
            <span className="text-2xl text-ochre-500">☀️</span>
            <span className="font-sculpted text-xl font-bold text-charcoal-900 group-hover:text-crimson-700 transition-colors">
              Cultural Marketplace
            </span>
          </Link>
          <p className="text-[11px] font-semibold uppercase tracking-widest text-ochre-700 mt-1">
            Agusan del Sur Heritage
          </p>
        </div>

        <div className="rounded-3xl border border-abaca-200/90 bg-white/95 p-8 shadow-xs relative overflow-hidden">
          <WeaveDivider pattern="diamond" className="absolute top-0 left-0 right-0 opacity-30" />

          <h1 className="font-sculpted text-2xl font-bold text-charcoal-900 pt-2">
            Welcome to the Gathering
          </h1>
          <p className="mt-1 text-xs text-stone-500">
            Sign in to access your patron orders, workshop passes, or artisan atelier.
          </p>

          <div className="mt-6">
            <LoginForm />
          </div>

          <p className="mt-6 text-center text-xs text-stone-500">
            New patron?{' '}
            <Link className="font-bold text-crimson-700 hover:underline" href="/auth/register">
              Join the Gathering
            </Link>
            {' · '}
            <Link className="font-bold text-ochre-700 hover:underline" href="/auth/register-artisan">
              Enroll as Artisan
            </Link>
          </p>

          <div className="mt-6 rounded-2xl bg-canvas p-3.5 text-xs text-stone-600 border border-abaca-200">
            <p className="font-bold text-charcoal-900 text-[11px] uppercase tracking-wider text-ochre-800">
              Demo Test Accounts (password: demo1234)
            </p>
            <p className="mt-1 font-mono text-[11px] text-stone-600">
              customer@demo.local · artisan@demo.local · admin@demo.local
            </p>
          </div>
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
