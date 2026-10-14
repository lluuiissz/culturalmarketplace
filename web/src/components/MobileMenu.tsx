'use client';

import Link from 'next/link';
import { useState } from 'react';

export interface NavLink { href: string; label: string }

// Mobile menu: hamburger + visible "Menu" label (never an icon alone).
// Auth actions live INSIDE the menu on mobile — the header row is too narrow
// for logo + cart + logout + menu without overflowing on small phones.
export default function MobileMenu({
  links, loggedIn, name, avatar,
}: { links: NavLink[]; loggedIn: boolean; name?: string | null; avatar?: string | null }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="md:hidden">
      <button
        aria-label="Menu"
        aria-expanded={open}
        className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-sm font-medium hover:bg-brand-50"
        onClick={() => setOpen((o) => !o)}
      >
        <span aria-hidden className="text-xl leading-none">{open ? '✕' : '☰'}</span>
        <span>Menu</span>
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-30 bg-black/20" onClick={() => setOpen(false)} />
          <nav className="absolute right-2 top-16 z-40 w-60 rounded-xl border border-brand-100 bg-white py-2 shadow-lg">
            {loggedIn && name && (
              <div className="flex items-center gap-2.5 border-b border-brand-50 px-4 pb-2.5 pt-1">
                {avatar ? (
                  <img
                    src={avatar}
                    alt={name}
                    className="h-8 w-8 rounded-full object-cover border border-brand-200"
                  />
                ) : (
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-700 text-xs font-bold text-white">
                    {name.slice(0, 2).toUpperCase()}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] text-stone-400">Signed in as</p>
                  <p className="text-xs font-bold text-stone-800 truncate">{name}</p>
                </div>
              </div>
            )}
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="block px-4 py-2.5 text-sm font-medium text-stone-700 hover:bg-brand-50 hover:text-brand-700"
                onClick={() => setOpen(false)}
              >
                {l.label}
              </Link>
            ))}
            {/* Auth actions, mobile-only (desktop shows them in the header) */}
            <div className="mt-1 border-t border-brand-50 pt-2">
              {loggedIn ? (
                <form action="/api/auth/logout" method="post">
                  <button type="submit" className="block w-full px-4 py-2.5 text-left text-sm font-medium text-red-600 hover:bg-red-50">
                    Log out
                  </button>
                </form>
              ) : (
                <>
                  <Link href="/auth/login" className="block px-4 py-2.5 text-sm font-medium text-stone-700 hover:bg-brand-50" onClick={() => setOpen(false)}>
                    Sign in
                  </Link>
                  <Link href="/auth/register" className="block px-4 py-2.5 text-sm font-semibold text-brand-700 hover:bg-brand-50" onClick={() => setOpen(false)}>
                    Create an account
                  </Link>
                </>
              )}
            </div>
          </nav>
        </>
      )}
    </div>
  );
}
