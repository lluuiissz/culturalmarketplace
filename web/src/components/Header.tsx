
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
    { href: '/artisans', label: 'Artisans' },
  ];

  const mobileLinks = [
    ...desktopLinks,
    ...(session?.role === 'customer'
      ? [
          {
            href: '/cart',
            label: count > 0
              ? `🧺 Artisan Basket (${count})`
              : '🧺 Artisan Basket',
          },
          { href: '/customer/account/dashboard', label: 'Patron Account' },
        ]
      : []),
    ...(session?.role === 'artisan'
      ? [{ href: '/artisan/dashboard', label: 'Artisan Atelier' }]
      : []),
    ...(session?.role === 'admin'
      ? [{ href: '/admin/dashboard', label: 'Curator Admin' }]
      : []),
  ];

  const searchForm = (
    <form
      action="/customer/browse"
      method="get"
      role="search"
      className="flex w-full items-center gap-1.5"
    >
      <div className="relative min-w-0 flex-1">
        <span
          aria-hidden
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-stone-400"
        >
          🔍
        </span>

        <Suspense
          fallback={
            <input
              type="search"
              name="q"
              placeholder="Search..."
              aria-label="Search traditional crafts"
              className="header-search-input"
            />
          }
        >
          <SearchBox />
        </Suspense>
      </div>

      <button
  type="submit"
  className="flex min-h-[36px] items-center justify-center rounded-lg border border-crimson-600 bg-white px-3 py-1.5 text-sm font-medium text-charcoal-800 transition hover:bg-crimson-50"
>
  Search
</button>
    </form>
  );

  return (
    <header className="sticky top-0 z-40 w-full border-b border-stone-200 bg-white shadow-sm">

      {/* MAIN HEADER ROW */}
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-3 sm:px-4">

        {/* LOGO + BRAND NAME + MOBILE MENU */}
        <div className="flex min-w-0 shrink-0 items-center gap-2">

          <MobileMenu
            links={mobileLinks}
            loggedIn={Boolean(session)}
            name={session?.name ?? null}
            avatar={user?.profile_picture ?? null}
          />

          {/* LOGO */}
          <Link
            href="/"
            className="flex shrink-0 items-center"
            aria-label="Cultural Marketplace — home"
          >
            <img
              src="/images/cultural-marketplace-logo.png"
              alt="Cultural Marketplace Logo"
              className="h-9 w-auto max-w-[65px] object-contain sm:h-10 sm:max-w-[280px]"
            />
          </Link>

          {/* BRAND NAME BESIDE LOGO */}
<div className="flex min-w-0 shrink flex-col justify-center leading-tight">
  <h1 className="whitespace-nowrap text-[13px] font-extrabold tracking-tight sm:text-[17px]">
    <span className="text-[#8B0000]">Cultural</span>{' '}
    <span className="text-[#FFA500]">Marketplace</span>
  </h1>

  <p className="max-w-[190px] text-[8px] font-bold leading-tight text-[#B00000] sm:max-w-none sm:whitespace-nowrap sm:text-[9px]">
    Agusan del Sur Indigenous Crafts and Experiences
  </p>
</div>

        </div>
        {/* END LOGO + BRAND NAME */}

        {/* DESKTOP SEARCH */}
        <div className="hidden w-[235px] shrink-0 xl:block">
          {searchForm}
        </div>

        {/* DESKTOP NAVIGATION */}
        <nav className="hidden items-center gap-4 text-sm font-medium text-charcoal-800 xl:flex">
          {desktopLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              prefetch={true}
              className="whitespace-nowrap transition-colors hover:text-crimson-600"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* USER ACTIONS */}
        <div className="flex shrink-0 items-center gap-2">

          {/* CUSTOMER BASKET */}
          {session?.role === 'customer' && (
            <Link
              href="/cart"
              prefetch={false}
              aria-label={`Artisan Basket${count > 0 ? `, ${count} items` : ''}`}
              className="flex min-h-[38px] items-center justify-center gap-1.5 rounded-lg border border-stone-300 px-2.5 text-xs font-semibold text-charcoal-900 transition hover:bg-ochre-50"
            >
              <span aria-hidden>🧺</span>
              <span className="hidden sm:inline">Basket</span>
              {count > 0 && (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-crimson-600 px-1 text-[11px] font-bold text-white">
                  {count}
                </span>
              )}
            </Link>
          )}

          {/* SIGNED-IN USER */}
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
                title={`Signed in as ${session.name}`}
                className="flex min-h-[38px] items-center gap-2 rounded-lg border border-stone-300 px-2 py-1 transition hover:bg-ochre-50"
              >
                {user?.profile_picture ? (
                  <img
                    src={user.profile_picture}
                    alt={session.name}
                    className="h-7 w-7 rounded-full border border-ochre-300 object-cover"
                  />
                ) : (
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-charcoal-900 text-[11px] font-bold text-ochre-300">
                    {session.name.slice(0, 2).toUpperCase()}
                  </span>
                )}

                <span className="hidden max-w-[110px] truncate text-xs font-semibold text-charcoal-900 md:inline">
                  {session.name.split(' ')[0]}
                </span>
              </Link>

              <form
                action="/api/auth/logout"
                method="post"
                className="hidden xl:block"
              >
                <button
                  type="submit"
                  className="rounded-lg border border-stone-300 bg-white px-3 py-2 text-xs font-semibold text-charcoal-700 transition hover:border-crimson-400 hover:text-crimson-700"
                >
                  Log out
                </button>
              </form>
            </div>
          ) : (
            /* GUEST ACTION BUTTONS */
            <div className="hidden items-center gap-2 md:flex">
              <Link
                href="/auth/login"
                className="flex min-h-[36px] items-center justify-center rounded-lg border border-crimson-600 bg-white px-3 py-1.5 text-sm font-medium text-charcoal-800 transition hover:bg-crimson-50"
              >
                Sign In
              </Link>

              <Link
                href="/auth/register"
                className="flex min-h-[36px] items-center justify-center whitespace-nowrap rounded-lg bg-crimson-700 px-3.5 py-1.5 text-sm font-bold text-white transition hover:bg-crimson-800"
              >
                Join Gathering
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* TABLET AND MOBILE SEARCH */}
      <div className="space-y-2 border-t border-stone-100 bg-white px-3 pb-3 pt-2 xl:hidden">

        {/* GUEST BUTTONS ON MOBILE */}
        {!session && (
          <div className="flex gap-2 md:hidden">
            <Link
              href="/auth/login"
              className="flex min-h-[38px] flex-1 items-center justify-center rounded-lg border border-crimson-600 bg-white px-3 py-2 text-xs font-semibold text-charcoal-900 transition hover:bg-crimson-50"
            >
              Sign In
            </Link>

            <Link
              href="/auth/register"
              className="flex min-h-[38px] flex-1 items-center justify-center rounded-lg bg-crimson-700 px-3 py-2 text-xs font-bold text-white transition hover:bg-crimson-800"
            >
              Join Gathering
            </Link>
          </div>
        )}

        {searchForm}
      </div>

      {/* INDIGENOUS GEOMETRIC BORDER */}
      <div className="weave-header-border" aria-hidden="true" />

    </header>
  );
}
