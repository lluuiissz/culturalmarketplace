import Link from 'next/link';
import { Suspense } from 'react';
import { getSession } from '@/lib/auth';
import { getCartCount, getUser } from '@/lib/db';
import MobileMenu from './MobileMenu';
import SearchBox from './SearchBox';

export default async function Header() {
  const session = await getSession();
  const [count, user] = await Promise.all([
    session?.role === 'customer' ? getCartCount(session.id) : 0,
    session ? getUser(session.id) : null,
  ]);

  const desktopLinks = [
    { href: '/', label: 'Home' },
    { href: '/customer/browse', label: 'Discover Crafts' },
    { href: '/artisans', label: 'Master Artisans' },
  ];

  const mobileLinks = [
    { href: '/', label: 'Home' },
    { href: '/customer/browse', label: 'Discover Crafts' },
    { href: '/artisans', label: 'Master Artisans' },
    ...(session?.role === 'customer' ? [{ href: '/customer/account/dashboard', label: 'My Account' }] : []),
    ...(session?.role === 'artisan' ? [{ href: '/artisan/dashboard', label: 'Artisan Atelier' }] : []),
    ...(session?.role === 'admin' ? [{ href: '/admin/dashboard', label: 'Curator Admin' }] : []),
  ];

  const searchForm = (
    <form action="/customer/browse" method="get" role="search" className="flex w-full items-center gap-1.5">
      <div className="relative flex-1 min-w-0">
        <span aria-hidden className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-ochre-700/60">🔍</span>
        <Suspense fallback={
          <input
            type="search"
            name="q"
            placeholder="Search traditional crafts…"
            aria-label="Search traditional crafts"
            className="w-full rounded-full border border-abaca-300 bg-white/95 text-xs sm:text-sm pl-9 pr-3 py-1.5 text-charcoal-900 shadow-2xs"
          />
        }>
          <SearchBox />
        </Suspense>
      </div>
      <button type="submit" className="btn-outline shrink-0 py-1.5 px-3 text-xs font-semibold whitespace-nowrap">
        Search
      </button>
    </form>
  );

  return (
    <header className="sticky top-0 z-40 border-b border-abaca-200/90 bg-white/95 backdrop-blur-md shadow-xs">
      {/* Row 1: Logo & Nav & User Actions */}
      <div className="mx-auto flex h-18 max-w-6xl items-center justify-between gap-2.5 px-3 sm:px-4 sm:gap-6">
        {/* Left side: Hamburger menu (mobile only) + Logo */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <MobileMenu
            links={mobileLinks}
            loggedIn={Boolean(session)}
            name={session?.name ?? null}
            avatar={user?.profile_picture ?? null}
          />

          <Link href="/" className="shrink-0 flex items-center gap-2 sm:gap-2.5 group min-w-0" aria-label="Cultural Marketplace — home">
            <div className="flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-ochre-500 to-crimson-700 text-white shadow-xs group-hover:scale-105 transition-transform">
              <span className="text-lg sm:text-xl">☀️</span>
            </div>
            <div className="min-w-0">
              <span className="block font-sculpted text-sm sm:text-lg font-bold text-charcoal-900 group-hover:text-crimson-700 transition-colors leading-tight truncate">
                Cultural Marketplace
              </span>
              <span className="block text-[9px] sm:text-[10px] font-sans font-semibold tracking-wider sm:tracking-widest uppercase text-ochre-700 truncate">
                Agusan del Sur Heritage
              </span>
            </div>
          </Link>
        </div>

        {/* Desktop: global search sits at the center with dedicated space */}
        <div className="hidden min-w-[220px] max-w-xs xl:max-w-sm flex-1 justify-center px-3 lg:flex">{searchForm}</div>

        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <nav className="hidden items-center gap-4 xl:gap-6 text-sm font-medium text-charcoal-800 md:flex">
            {desktopLinks.map((l) => (
              <Link key={l.href} className="transition-colors hover:text-crimson-600 font-medium whitespace-nowrap shrink-0" href={l.href} prefetch={true}>
                {l.label}
              </Link>
            ))}
          </nav>

          {(session?.role === 'customer' || !session) && (
            <Link
              href="/cart"
              prefetch={false}
              className="flex min-h-[44px] min-w-[44px] items-center justify-center gap-1.5 rounded-xl border border-abaca-200 bg-canvas/80 px-2.5 sm:px-3 py-2 text-xs sm:text-sm font-medium text-charcoal-900 transition hover:bg-ochre-50 hover:border-ochre-400"
              aria-label={`Artisan Basket${count > 0 ? `, ${count} items` : ''}`}
            >
              <span aria-hidden className="text-base leading-none">🧺</span>
              <span className="hidden sm:inline font-semibold">Basket</span>
              {count > 0 && (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-crimson-600 px-1 text-[11px] font-bold text-white shadow-xs">
                  {count}
                </span>
              )}
            </Link>
          )}

          {session ? (
            <div className="flex items-center gap-2">
              <Link
                href={
                  session.role === 'customer'
                    ? '/customer/account/dashboard'
                    : session.role === 'artisan'
                    ? '/artisan/dashboard'
                    : '/admin/dashboard'
                }
                className="flex min-h-[44px] items-center gap-1.5 sm:gap-2 rounded-full py-1 pl-1 pr-2 sm:pr-3 hover:bg-ochre-50/70 border border-abaca-300 transition"
                title={`Signed in as ${session.name}`}
              >
                {user?.profile_picture ? (
                  <img
                    src={user.profile_picture}
                    alt={session.name}
                    className="h-7 w-7 rounded-full object-cover border border-ochre-300"
                  />
                ) : (
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-charcoal-900 text-[11px] font-bold text-ochre-300">
                    {session.name.slice(0, 2).toUpperCase()}
                  </span>
                )}
                <span className="hidden md:inline text-xs font-semibold text-charcoal-900 max-w-[110px] truncate">
                  {session.name.split(' ')[0]}
                </span>
              </Link>
              <form action="/api/auth/logout" method="post" className="hidden md:block">
                <button className="min-h-[44px] rounded-xl border border-abaca-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-stone-600 transition hover:border-red-300 hover:text-red-700" type="submit">
                  Log out
                </button>
              </form>
            </div>
          ) : (
            /* Desktop only: Sign in & Join Gathering are in Row 1 on desktop (hidden on mobile to prevent overlap) */
            <div className="hidden md:flex items-center gap-2">
              <Link href="/auth/login" className="btn-outline min-h-[38px] flex items-center py-1.5 px-3.5 text-xs font-semibold">
                Sign in
              </Link>
              <Link href="/auth/register" className="btn-primary min-h-[38px] flex items-center py-1.5 px-3.5 text-xs font-bold">
                Join Gathering
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Row 2 (Mobile only): Search bar + Guest Action Buttons */}
      <div className="border-t border-abaca-200/60 bg-canvas/60 px-3.5 pb-3 pt-2 md:hidden space-y-2">
        {searchForm}

        {/* If guest (not signed in), place Sign In and Join Gathering clearly below search without any overlap */}
        {!session && (
          <div className="flex items-center gap-2 pt-0.5">
            <Link
              href="/auth/login"
              className="flex-1 min-h-[40px] flex items-center justify-center rounded-xl border border-abaca-300 bg-white px-3 py-2 text-xs font-semibold text-charcoal-900 shadow-2xs hover:bg-ochre-50 active:bg-ochre-100 transition"
            >
              Sign in
            </Link>
            <Link
              href="/auth/register"
              className="flex-1 min-h-[40px] flex items-center justify-center rounded-xl bg-crimson-600 px-3 py-2 text-xs font-bold text-white shadow-xs hover:bg-crimson-700 active:bg-crimson-800 transition"
            >
              Join Gathering
            </Link>
          </div>
        )}
      </div>

      {/* Bottom subtle geometric accent */}
      <div className="weave-divider-diamond opacity-25 h-1" />
    </header>
  );
}
