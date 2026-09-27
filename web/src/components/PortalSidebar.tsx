'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

// Role-based portal navigation: grouped sections per role, active-link
// highlighting, identity + Log out pinned at the bottom. The PUBLIC site
// navigation (browse/cart/home) stays in the public Header — the portal
// shell links back to the storefront instead, keeping "shop" and "manage"
// visually and mentally separate.

export interface NavSection {
  title: string;
  items: Array<{ href: string; label: string; icon?: string }>;
}

function isActive(pathname: string, href: string): boolean {
  if (href === pathname) return true;
  // Section parents (e.g. /artisan/products) highlight for sub-paths too,
  // but never steal from an exact sibling match.
  return pathname.startsWith(href + '/');
}

export default function PortalSidebar({
  sections, portalHome, portalLabel, userName, backLabel = '← Storefront',
}: {
  sections: NavSection[];
  portalHome: string;
  portalLabel: string;
  userName: string;
  backLabel?: string;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const content = (
    <>
      <div className="flex items-center justify-between">
        <Link href={portalHome} className="font-serif text-lg font-bold text-brand-900">
          🧶 <span className="hidden min-[400px]:inline">Cultural Marketplace</span><span className="min-[400px]:hidden">CM</span>
        </Link>
        <button type="button" className="rounded-lg px-2 py-1 text-xl leading-none hover:bg-brand-50 md:hidden" aria-label="Close menu" onClick={() => setOpen(false)}>✕</button>
      </div>
      <p className="mt-1 text-xs uppercase tracking-wider text-stone-400">{portalLabel}</p>

      <nav className="mt-5 flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto pr-1 text-sm font-medium text-stone-600" aria-label={`${portalLabel} navigation`}>
        {sections.map((section) => (
          <div key={section.title}>
            <p className="px-2 pb-1 text-[11px] font-semibold uppercase tracking-wider text-stone-400">{section.title}</p>
            <div className="flex flex-col gap-0.5">
              {section.items.map((item) => {
                const active = isActive(pathname, item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={active ? 'page' : undefined}
                    className={`flex items-center gap-2 rounded-lg px-3 py-2 transition ${active ? 'bg-brand-500 text-white shadow-sm' : 'hover:bg-brand-50 hover:text-brand-700'}`}
                    onClick={() => setOpen(false)}
                  >
                    {item.icon && <span aria-hidden className="w-5 text-center text-base leading-none">{item.icon}</span>}
                    <span className="truncate">{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="mt-3 shrink-0 border-t border-stone-100 pt-3">
        <Link href="/" className="block rounded-lg px-3 py-2 text-sm font-medium text-brand-700 hover:bg-brand-50">
          🛍️ {backLabel}
        </Link>
        <p className="mt-1 px-3 text-xs text-stone-400">
          Signed in as<br /><span className="font-semibold text-stone-600">{userName}</span>
        </p>
        <form action="/api/auth/logout" method="post" className="mt-2">
          <button type="submit" className="w-full rounded-lg border border-red-200 px-3 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50">
            Log out
          </button>
        </form>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile top bar with hamburger (portal-scoped) */}
      <div className="sticky top-0 z-40 border-b border-brand-100 bg-white md:hidden">
        <div className="flex h-14 items-center justify-between px-4">
          <Link href={portalHome} className="font-serif text-lg font-bold text-brand-900">🧶 {portalLabel}</Link>
          <button
            type="button"
            aria-label="Menu"
            aria-expanded={open}
            className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-sm font-medium hover:bg-brand-50"
            onClick={() => setOpen((o) => !o)}
          >
            <span aria-hidden className="text-xl leading-none">{open ? '✕' : '☰'}</span>
            <span>Menu</span>
          </button>
        </div>
        {open && (
          <>
            <div className="fixed inset-0 z-30 bg-black/20" onClick={() => setOpen(false)} />
            <div className="fixed inset-y-0 left-0 z-40 flex w-72 flex-col border-r border-brand-100 bg-white p-4 shadow-xl md:hidden">
              {content}
            </div>
          </>
        )}
      </div>

      {/* Desktop sidebar */}
      <aside className="hidden w-64 shrink-0 flex-col border-r border-brand-100 bg-white p-4 md:sticky md:top-0 md:flex md:h-screen">
        {content}
      </aside>
    </>
  );
}
