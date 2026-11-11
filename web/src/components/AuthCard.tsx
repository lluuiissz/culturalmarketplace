import Link from 'next/link';
import type { ReactNode } from 'react';
import WeaveDivider from '@/components/WeaveDivider';

/**
 * Card used by the forgot-password / reset-password pages:
 * weave border, logo + brand name, title, description, content,
 * and a "Back to Sign in" link.
 */
export default function AuthCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-abaca-200/90 bg-white/95 p-6 shadow-sm sm:rounded-3xl sm:p-8">
      <WeaveDivider pattern="kalinga" className="absolute left-0 right-0 top-0 opacity-30" />

      {/* Logo and Brand Name */}
      <div className="mb-6 flex w-full flex-col items-center text-center">
        <img
          src="/images/cultural-marketplace-logo.png"
          alt="Cultural Marketplace Logo"
          className="mb-1 h-16 w-auto max-w-[160px] object-contain"
        />
        <p className="text-xl font-extrabold tracking-tight">
          <span className="text-[#8B0000]">Cultural</span>{' '}
          <span className="text-[#FFA500]">Marketplace</span>
        </p>
        <p className="mt-1 max-w-[280px] text-xs leading-relaxed text-[#B00000]">
          Agusan del Sur Indigenous Crafts and Experiences
        </p>
      </div>

      {/* Heading */}
      <div className="text-center">
        <h1 className="font-sculpted text-2xl font-bold text-charcoal-900">{title}</h1>
        <p className="mx-auto mt-2 max-w-sm text-xs leading-relaxed text-stone-500 sm:text-sm">{subtitle}</p>
      </div>

      <div className="mt-6">{children}</div>

      <div className="mt-6 border-t border-abaca-200 pt-4 text-center">
        <Link
          href="/auth/login"
          className="text-xs font-semibold text-stone-500 transition hover:text-charcoal-900 sm:text-sm"
        >
          ← Back to Sign in
        </Link>
      </div>
    </div>
  );
}
