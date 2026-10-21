import Link from 'next/link';
import WeaveDivider from '@/components/WeaveDivider';
import CustomerRegisterForm from './CustomerRegisterForm';

export default function RegisterPage() {
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
