import Link from 'next/link';
import { Suspense } from 'react';
import { getSession } from '@/lib/auth';
import { getCart } from '@/lib/db';
import MobileMenu from './MobileMenu';
import SearchBox from './SearchBox';

export default async function Header() {
  const session = await getSession();
  const cart = session?.role === 'customer' ? await getCart(session.id) : [];
  const count = cart.reduce((s, i) => s + i.quantity, 0);

  const links = [
    { href: '/', label: 'Home' },
    { href: '/customer/browse', label: 'Browse crafts' },
    { href: '/artisans', label: 'Artisans' },
    ...(session?.role === 'customer' ? [{ href: '/customer/account/dashboard', label: 'My account' }] : []),
    ...(session?.role === 'artisan' ? [{ href: '/artisan/dashboard', label: 'Artisan portal' }] : []),
    ...(session?.role === 'admin' ? [{ href: '/admin/dashboard', label: 'Admin' }] : []),
  ];

  const searchForm = (
    <form action="/customer/browse" method="get" role="search" className="flex w-full items-center gap-2">
      <div className="relative flex-1">
        <span aria-hidden className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-sm text-stone-400">🔍</span>
        <Suspense fallback={
          <input type="search" name="q" placeholder="Search crafts, e.g. woven basket…" aria-label="Search crafts"
            className="input w-full rounded-full" style={{ paddingLeft: '2.25rem' }} />
        }>
          <SearchBox />
        </Suspense>
      </div>
      <button type="submit" className="btn-outline shrink-0">Search</button>
    </form>
  );

  return (
    <header className="sticky top-0 z-40 border-b border-brand-100 bg-white/95 backdrop-blur">
      {/* Row 1: logo (left) · nav (right) — standard, predictable layout */}
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-2 px-4 sm:gap-4">
        <Link href="/" className="shrink-0 font-serif text-xl font-bold text-brand-900" aria-label="Cultural Marketplace — home">
          <span aria-hidden>🧶</span>{' '}<span className="hidden min-[440px]:inline">Cultural </span>Marketplace
        </Link>
        {/* Desktop: global search sits at the very top, center */}
        <div className="hidden min-w-0 flex-1 justify-center px-4 lg:flex">{searchForm}</div>
        <div className="flex items-center gap-2">
          <nav className="hidden items-center gap-5 text-sm font-medium text-stone-600 md:flex">
            {links.map((l) => (
              <Link key={l.href} className="hover:text-brand-700" href={l.href}>{l.label}</Link>
            ))}
          </nav>
          {session?.role === 'customer' && (
            <Link href="/cart" className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-sm font-medium hover:bg-brand-50" aria-label={`Cart, ${count} item${count === 1 ? '' : 's'}`}>
              <span aria-hidden className="text-xl leading-none">🛒</span>
              <span className="hidden sm:inline">Cart</span>
              {count > 0 && (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-600 px-1 text-[11px] font-bold text-white">
                  {count}
                </span>
              )}
            </Link>
          )}
          {session ? (
            // Desktop keeps the visible Log out; mobile moves it into the menu
            // (the header row is too narrow for logo + cart + logout + menu).
            <form action="/api/auth/logout" method="post" className="hidden md:block">
              <button className="btn-outline" type="submit">Log out</button>
            </form>
          ) : (
            <>
              <Link href="/auth/login" className="btn-outline hidden md:inline-flex">Sign in</Link>
              <Link href="/auth/register" className="btn-primary hidden md:inline-flex">Join</Link>
            </>
          )}
          <MobileMenu links={links} loggedIn={Boolean(session)} name={session?.name ?? null} />
        </div>
      </div>
      {/* Mobile: search stays at the very top as its own row */}
      <div className="border-t border-brand-50 px-4 pb-3 pt-2 md:hidden">{searchForm}</div>
    </header>
  );
}
