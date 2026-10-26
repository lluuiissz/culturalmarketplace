'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

export interface NavSection {
  title: string;
  items: Array<{ href: string; label: string; icon?: string }>;
}

function isActive(pathname: string, href: string): boolean {
  if (href === pathname) return true;
  return pathname.startsWith(href + '/');
}

export default function PortalSidebar({
  sections,
  portalHome,
  portalLabel,
  userName,
  backLabel = '← Storefront',
}: {
  sections: NavSection[];
  portalHome: string;
  portalLabel: string;
  userName: string;
  backLabel?: string;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

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

  const roleTitle = portalLabel.toLowerCase().includes('admin')
    ? 'Curator Administrator'
    : portalLabel.toLowerCase().includes('artisan')
    ? 'Master Artisan'
    : 'Active Patron';

  const content = (
    <div className="flex h-full max-h-full flex-col min-h-0 overflow-hidden">
      {/* 1. Header (Fixed top) */}
      <div className="shrink-0 flex items-center justify-between pb-3.5 border-b border-charcoal-800">
        <Link href={portalHome} className="flex items-center gap-2.5 group">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-ochre-500 to-crimson-700 text-white shadow-2xs">
            <span className="text-base">☀️</span>
          </div>
          <div>
            <span className="block font-sculpted text-sm font-bold text-white group-hover:text-ochre-300 transition-colors leading-tight">
              Cultural Marketplace
            </span>
            <span className="inline-block mt-0.5 rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider bg-ochre-500/20 text-ochre-300 border border-ochre-500/30">
              {portalLabel}
            </span>
          </div>
        </Link>
        <button
          type="button"
          className="rounded-lg p-1.5 text-base text-stone-400 hover:text-white hover:bg-charcoal-800 md:hidden"
          aria-label="Close menu"
          onClick={() => setOpen(false)}
        >
          ✕
        </button>
      </div>

      {/* 2. Navigation Sections (Scrollable middle container) */}
      <nav
        className="my-3 flex-1 min-h-0 overflow-y-auto pr-1 space-y-4 text-xs font-medium [scrollbar-width:thin] [scrollbar-color:#23272F_transparent]"
        aria-label={`${portalLabel} navigation`}
      >
        {sections.map((section) => (
          <div key={section.title}>
            <p className="px-2.5 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-ochre-400 font-sculpted">
              {section.title}
            </p>
            <div className="flex flex-col gap-0.5">
              {section.items.map((item) => {
                const active = isActive(pathname, item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    prefetch={true}
                    aria-current={active ? 'page' : undefined}
                    className={`flex items-center gap-2.5 rounded-xl px-3 py-2 transition-all ${
                      active
                        ? 'bg-crimson-600 text-white font-semibold shadow-xs'
                        : 'hover:bg-charcoal-800 hover:text-white text-stone-300 font-medium'
                    }`}
                    onClick={() => setOpen(false)}
                  >
                    {item.icon && (
                      <span aria-hidden className="w-4 text-center text-sm leading-none opacity-90">
                        {item.icon}
                      </span>
                    )}
                    <span className="truncate">{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* 3. Footer (Fixed bottom) */}
      <div className="shrink-0 border-t border-charcoal-800 pt-3 space-y-2">
        <Link
          href="/"
          prefetch={true}
          onClick={() => setOpen(false)}
          className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold text-ochre-300 hover:bg-charcoal-800 hover:text-ochre-200 transition"
        >
          <span>🛍️</span>
          <span>{backLabel}</span>
        </Link>

        <div className="rounded-xl bg-charcoal-900 p-2.5 border border-charcoal-800">
          <p className="text-[10px] text-ochre-400/90 uppercase tracking-wider font-bold">
            {roleTitle}
          </p>
          <p className="font-bold text-xs text-white truncate mt-0.5">{userName}</p>
        </div>

        <form action="/api/auth/logout" method="post">
          <button
            type="submit"
            className="w-full rounded-xl border border-red-900/60 bg-red-950/40 px-3 py-2 text-xs font-semibold text-red-300 transition hover:bg-red-900/40 hover:text-red-200"
          >
            Log out
          </button>
        </form>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Top Bar */}
      <div className="sticky top-0 z-40 border-b border-abaca-200/90 bg-white/95 backdrop-blur-md md:hidden">
        <div className="flex h-14 items-center justify-between px-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              aria-label="Toggle portal navigation"
              aria-expanded={open}
              className="flex min-h-[44px] min-w-[44px] shrink-0 items-center justify-center gap-1 rounded-xl border border-abaca-300 bg-white px-3 py-2 text-xs font-semibold text-charcoal-900 shadow-2xs hover:bg-ochre-50 active:bg-ochre-100"
              onClick={() => setOpen((o) => !o)}
            >
              <span aria-hidden className="text-base leading-none">{open ? '✕' : '☰'}</span>
              <span>Menu</span>
            </button>
            <Link href={portalHome} className="min-w-0 truncate font-sculpted text-sm font-bold text-charcoal-900">
              ☀️ {portalLabel}
            </Link>
          </div>
          <Link href="/" className="text-xs font-semibold text-crimson-700 hover:underline px-2 py-1">
            Storefront →
          </Link>
        </div>

        {open && mounted && createPortal(
          <div className="fixed inset-0 z-[100] flex justify-start md:hidden">
            <div className="fixed inset-0 bg-charcoal-950/60 backdrop-blur-sm" onClick={() => setOpen(false)} />
            <div className="relative z-50 flex h-full w-72 sm:w-80 flex-col bg-charcoal-950 p-4 shadow-2xl border-r border-charcoal-800 overflow-hidden animate-in slide-in-from-left duration-200">
              {content}
            </div>
          </div>,
          document.body
        )}
      </div>

      {/* Desktop Sidebar */}
      <aside className="hidden w-64 shrink-0 flex-col border-r border-charcoal-800 bg-charcoal-950 p-4 text-canvas md:sticky md:top-0 md:flex md:h-screen md:max-h-screen overflow-hidden shadow-lg">
        {content}
      </aside>
    </>
  );
}
