'use client';

import Link from 'next/link';
import { useState } from 'react';

export interface NavLink { href: string; label: string }

export default function MobileMenu({
  links, loggedIn, name, avatar,
}: { links: NavLink[]; loggedIn: boolean; name?: string | null; avatar?: string | null }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="md:hidden">
      <button
        aria-label="Menu"
        aria-expanded={open}
        className="flex items-center gap-1.5 rounded-xl border border-abaca-300 bg-white/80 px-2.5 py-1.5 text-xs font-semibold text-charcoal-900 shadow-2xs hover:bg-ochre-50 transition"
        onClick={() => setOpen((o) => !o)}
      >
        <span aria-hidden className="text-base leading-none">{open ? '✕' : '☰'}</span>
        <span>Menu</span>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-30 bg-charcoal-950/40 backdrop-blur-2xs" onClick={() => setOpen(false)} />
          <nav className="absolute right-3 top-16 z-40 w-64 rounded-2xl border border-abaca-200 bg-white p-2 shadow-xl">
            {/* Top weave accent */}
            <div className="weave-divider-diamond opacity-40 h-1 mb-2" />

            {loggedIn && name && (
              <Link
                href="/customer/account/dashboard"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2.5 rounded-xl bg-canvas p-2.5 hover:bg-ochre-50 transition group border border-abaca-200/60 mb-2"
                title="View your account dashboard"
              >
                {avatar ? (
                  <img
                    src={avatar}
                    alt={name}
                    className="h-8 w-8 rounded-full object-cover border border-ochre-300 shrink-0"
                  />
                ) : (
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-charcoal-900 text-xs font-bold text-ochre-300 shrink-0">
                    {name.slice(0, 2).toUpperCase()}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] uppercase tracking-wider text-ochre-700 font-semibold">Signed in as</p>
                  <p className="text-xs font-bold text-charcoal-900 truncate group-hover:text-crimson-700">{name}</p>
                </div>
                <span className="text-xs text-ochre-600 group-hover:translate-x-0.5 transition-transform">→</span>
              </Link>
            )}

            <div className="space-y-0.5">
              {links.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  className="block rounded-xl px-3 py-2 text-sm font-medium text-charcoal-800 hover:bg-ochre-50 hover:text-crimson-700 transition"
                  onClick={() => setOpen(false)}
                >
                  {l.label}
                </Link>
              ))}
            </div>

            {/* Auth actions, mobile-only */}
            <div className="mt-2 border-t border-abaca-200/60 pt-2 space-y-1">
              {loggedIn ? (
                <form action="/api/auth/logout" method="post">
                  <button
                    type="submit"
                    className="block w-full rounded-xl px-3 py-2 text-left text-sm font-medium text-red-600 hover:bg-red-50 transition"
                  >
                    Log out
                  </button>
                </form>
              ) : (
                <>
                  <Link
                    href="/auth/login"
                    className="block rounded-xl px-3 py-2 text-sm font-medium text-charcoal-800 hover:bg-ochre-50"
                    onClick={() => setOpen(false)}
                  >
                    Sign in
                  </Link>
                  <Link
                    href="/auth/register"
                    className="block rounded-xl bg-crimson-600 px-3 py-2 text-center text-sm font-semibold text-white shadow-xs hover:bg-crimson-700 transition"
                    onClick={() => setOpen(false)}
                  >
                    Become Part of Gathering
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
