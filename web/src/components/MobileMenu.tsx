'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

export interface NavLink { href: string; label: string }

export default function MobileMenu({
  links, loggedIn, name, avatar,
}: { links: NavLink[]; loggedIn: boolean; name?: string | null; avatar?: string | null }) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Lock body scroll when drawer is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  const drawerContent = (
    <div className="fixed inset-0 z-[100] flex justify-start">
      {/* Backdrop overlay */}
      <div
        className="fixed inset-0 bg-charcoal-950/60 backdrop-blur-sm transition-opacity"
        onClick={() => setOpen(false)}
        aria-hidden="true"
      />

      {/* Drawer container: slides out from the left */}
      <nav
        className="relative z-50 flex h-full w-72 sm:w-80 flex-col justify-between bg-white p-5 shadow-2xl border-r border-abaca-200 overflow-y-auto animate-in slide-in-from-left duration-200"
        aria-label="Mobile navigation menu"
      >
            <div>
              {/* Drawer Header */}
              <div className="flex items-center justify-between pb-3 border-b border-abaca-200">
                <div className="flex items-center gap-2">
                  <span className="text-xl">☀️</span>
                  <span className="font-sculpted text-sm font-bold text-charcoal-900">
                    Cultural Marketplace
                  </span>
                </div>
                <button
                  type="button"
                  aria-label="Close menu"
                  onClick={() => setOpen(false)}
                  className="flex h-9 w-9 items-center justify-center rounded-lg text-charcoal-700 hover:bg-stone-100 transition text-base font-bold"
                >
                  ✕
                </button>
              </div>

              {/* Tribal divider */}
              <div className="weave-divider-diamond opacity-60 h-1 my-3" />

              {/* User profile snippet */}
              {loggedIn && name && (
                <Link
                  href="/customer/account/dashboard"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-2.5 rounded-xl bg-canvas p-3 hover:bg-ochre-50 transition group border border-abaca-200/80 mb-3"
                  title="View your account dashboard"
                >
                  {avatar ? (
                    <img
                      src={avatar}
                      alt={name}
                      className="h-9 w-9 rounded-full object-cover border border-ochre-400 shrink-0"
                    />
                  ) : (
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-charcoal-900 text-xs font-bold text-ochre-300 shrink-0">
                      {name.slice(0, 2).toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] uppercase tracking-wider text-ochre-700 font-bold">Signed in as</p>
                    <p className="text-xs font-bold text-charcoal-900 truncate group-hover:text-crimson-700">{name}</p>
                  </div>
                  <span className="text-sm text-ochre-600 group-hover:translate-x-0.5 transition-transform">→</span>
                </Link>
              )}

              {/* Navigation links with ≥44px touch target */}
              <div className="space-y-1">
                {links.map((l) => (
                  <Link
                    key={l.href}
                    href={l.href}
                    className="flex min-h-[44px] items-center rounded-xl px-3.5 py-2.5 text-sm font-semibold text-charcoal-800 hover:bg-ochre-50 hover:text-crimson-700 active:bg-ochre-100 transition"
                    onClick={() => setOpen(false)}
                  >
                    {l.label}
                  </Link>
                ))}
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="mt-6 border-t border-abaca-200 pt-4 space-y-2">
              {loggedIn ? (
                <form action="/api/auth/logout" method="post">
                  <button
                    type="submit"
                    className="flex min-h-[44px] w-full items-center justify-center rounded-xl border border-red-200 bg-red-50/80 px-4 py-2.5 text-sm font-semibold text-red-700 hover:bg-red-100 active:bg-red-200 transition"
                  >
                    Log out
                  </button>
                </form>
              ) : (
                <div className="space-y-2">
                  <Link
                    href="/auth/login"
                    className="flex min-h-[44px] w-full items-center justify-center rounded-xl border border-abaca-300 bg-white px-4 py-2.5 text-sm font-semibold text-charcoal-900 hover:bg-ochre-50 transition"
                    onClick={() => setOpen(false)}
                  >
                    Sign in
                  </Link>
                  <Link
                    href="/auth/register"
                    className="flex min-h-[44px] w-full items-center justify-center rounded-xl bg-crimson-600 px-4 py-2.5 text-sm font-bold text-white shadow-xs hover:bg-crimson-700 active:bg-crimson-800 transition"
                    onClick={() => setOpen(false)}
                  >
                    Become Part of Gathering
                  </Link>
                </div>
              )}
              <p className="text-center text-[10px] text-stone-400 pt-1">
                Agusan del Sur Living Heritage
              </p>
            </div>
          </nav>
        </div>
      );

  return (
    <div className="md:hidden">
      <button
        type="button"
        aria-label="Toggle navigation menu"
        aria-expanded={open}
        className="flex min-h-[44px] min-w-[44px] items-center justify-center gap-1.5 rounded-xl border border-abaca-300 bg-white/95 px-2.5 py-2 text-xs font-semibold text-charcoal-900 shadow-2xs hover:bg-ochre-50 active:bg-ochre-100 transition shrink-0"
        onClick={() => setOpen((o) => !o)}
      >
        <span aria-hidden className="text-base leading-none font-bold">{open ? '✕' : '☰'}</span>
        <span className="hidden xs:inline">Menu</span>
      </button>

      {open && mounted && createPortal(drawerContent, document.body)}
    </div>
  );
}
