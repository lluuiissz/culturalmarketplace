
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

import {
  Home,
  ReceiptText,
  CalendarDays,
  MessageCircle,
  MapPin,
  Flag,
  UserRound,
  ShoppingBag,
  Menu,
  X,
  ArrowRight,
} from 'lucide-react';

type NavIconName =
  | 'home'
  | 'receipt'
  | 'calendar'
  | 'message'
  | 'map-pin'
  | 'flag'
  | 'user';

export interface NavSection {
  title: string;
  items: Array<{
    href: string;
    label: string;
    icon?: NavIconName;
  }>;
}

const NAV_ICONS = {
  home: Home,
  receipt: ReceiptText,
  calendar: CalendarDays,
  message: MessageCircle,
  'map-pin': MapPin,
  flag: Flag,
  user: UserRound,
};

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
    <div className="flex h-full max-h-full min-h-0 flex-col overflow-hidden">

      {/* SIDEBAR HEADER */}
      <div className="flex shrink-0 items-center justify-between gap-2 border-b border-[#DCC5A8] pb-3.5">
        <Link
          href={portalHome}
          className="group flex min-w-0 items-center gap-2.5"
        >
          <img
            src="/images/cultural-marketplace-logo.png"
            alt="Cultural Marketplace Logo"
            className="h-10 w-10 shrink-0 rounded-lg object-contain"
          />

          <div className="flex min-w-0 flex-col justify-center leading-tight">
  <span className="text-[12px] font-extrabold tracking-tight">
    <span className="text-[#8B0000]">Cultural</span>{' '}
    <span className="text-[#FFA500]">Marketplace</span>
  </span>

  <span className="mt-0.5 max-w-full text-[7px] font-bold leading-tight text-[#B00000]">
    Agusan del Sur Indigenous Crafts and Experiences
  </span>

            <span className="mt-1 inline-block w-fit rounded border border-[#D6B56D] bg-[#F0DFC0] px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-[#5C421D]">
              {portalLabel}
            </span>
          </div>
        </Link>

        {/* CLOSE BUTTON */}
        <button
          type="button"
          className="shrink-0 rounded-lg p-1.5 text-[#4B4038] transition hover:bg-[#EAD9C3] hover:text-[#211B17] md:hidden"
          aria-label="Close menu"
          onClick={() => setOpen(false)}
        >
          <X size={19} strokeWidth={1.8} />
        </button>
      </div>

      {/* NAVIGATION SECTIONS */}
      <nav
        className="my-3 min-h-0 flex-1 space-y-4 overflow-y-auto pr-1 text-xs font-medium [scrollbar-color:#B8A58F_transparent] [scrollbar-width:thin]"
        aria-label={`${portalLabel} navigation`}
      >
        {sections.map((section) => (
          <div key={section.title}>
            <p className="px-2.5 pb-1.5 font-sculpted text-[10px] font-bold uppercase tracking-wider text-[#8B0000]">
              {section.title}
            </p>

            <div className="flex flex-col gap-0.5">
              {section.items.map((item) => {
                const active = isActive(pathname, item.href);
                const Icon = item.icon
                  ? NAV_ICONS[item.icon]
                  : null;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    prefetch={true}
                    aria-current={active ? 'page' : undefined}
                    className={`flex items-center gap-2.5 rounded-xl px-3 py-2 transition-all ${
                      active
                        ? 'bg-[#8B0000] font-semibold text-white shadow-sm'
                        : 'font-medium text-[#3F352E] hover:bg-[#EAD9C3] hover:text-[#211B17]'
                    }`}
                    onClick={() => setOpen(false)}
                  >
                    {Icon && (
                      <Icon
                        size={17}
                        strokeWidth={1.8}
                        aria-hidden="true"
                        className={`shrink-0 ${
                          active ? 'text-white' : 'text-[#75695F]'
                        }`}
                      />
                    )}

                    <span className="truncate">{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* SIDEBAR FOOTER */}
      <div className="shrink-0 space-y-2 border-t border-[#DCC5A8] pt-3">

        {/* BACK TO STOREFRONT */}
        <Link
          href="/"
          prefetch={true}
          onClick={() => setOpen(false)}
          className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-[#8B0000] transition hover:bg-[#EAD9C3] hover:text-[#650000]"
        >
          <ShoppingBag
            size={16}
            strokeWidth={1.8}
            className="text-[#75695F]"
          />
          <span>{backLabel}</span>
        </Link>

        {/* USER INFORMATION */}
        <div className="rounded-xl border border-[#DCC5A8] bg-white/70 p-2.5">
          <p className="text-[10px] font-bold uppercase tracking-wider text-[#8B0000]">
            {roleTitle}
          </p>

          <p className="mt-0.5 truncate text-xs font-bold text-[#211B17]">
            {userName}
          </p>
        </div>

        {/* LOGOUT */}
        <form action="/api/auth/logout" method="post">
          <button
            type="submit"
            className="w-full rounded-xl border border-[#D9A6A6] bg-[#FCEEEE] px-3 py-2 text-xs font-semibold text-[#8B0000] transition hover:bg-[#F5DADA] hover:text-[#650000]"
          >
            Log out
          </button>
        </form>
      </div>
    </div>
  );

  return (
    <>
      {/* MOBILE TOP BAR */}
      <div className="sticky top-0 z-40 border-b border-[#DCC5A8] bg-[#F5EBDD]/95 backdrop-blur-md md:hidden">
        <div className="flex h-14 items-center justify-between px-3">
          <div className="flex min-w-0 items-center gap-2">

            {/* MENU BUTTON */}
            <button
              type="button"
              aria-label="Toggle portal navigation"
              aria-expanded={open}
              className="flex min-h-[44px] min-w-[44px] shrink-0 items-center justify-center gap-1 rounded-xl border border-[#DCC5A8] bg-white px-3 py-2 text-xs font-semibold text-[#211B17] shadow-sm transition hover:bg-[#EAD9C3] active:bg-[#DCC5A8]"
              onClick={() => setOpen((o) => !o)}
            >
              {open ? (
                <X size={18} strokeWidth={1.8} className="text-[#211B17]" />
              ) : (
                <Menu size={18} strokeWidth={1.8} className="text-[#211B17]" />
              )}
              <span>Menu</span>
            </button>

            {/* MOBILE BRAND */}
            <Link
              href={portalHome}
              className="flex min-w-0 items-center gap-2"
            >
              <img
                src="/images/cultural-marketplace-logo.png"
                alt="Cultural Marketplace"
                className="h-8 w-8 shrink-0 rounded object-contain"
              />

              <span className="truncate text-xs font-bold text-[#211B17]">
                {portalLabel}
              </span>
            </Link>
          </div>

          {/* STOREFRONT LINK */}
          <Link
            href="/"
            className="flex shrink-0 items-center gap-1 px-2 py-1 text-xs font-semibold text-[#8B0000] transition hover:underline"
          >
            Storefront
            <ArrowRight size={13} className="text-[#8B0000]" />
          </Link>
        </div>

        {/* MOBILE DRAWER */}
        {open &&
          mounted &&
          createPortal(
            <div className="fixed inset-0 z-[100] flex justify-start md:hidden">
              <div
                className="fixed inset-0 bg-[#211B17]/60 backdrop-blur-sm"
                onClick={() => setOpen(false)}
              />

              <div className="relative z-50 flex h-full w-72 flex-col overflow-hidden border-r border-[#DCC5A8] bg-[#F5EBDD] p-4 shadow-2xl animate-in slide-in-from-left duration-200 sm:w-80">
                {content}
              </div>
            </div>,
            document.body
          )}
      </div>

      {/* DESKTOP SIDEBAR */}
      <aside className="hidden w-64 shrink-0 flex-col overflow-hidden border-r border-[#DCC5A8] bg-[#F5EBDD] p-4 text-[#211B17] shadow-lg md:sticky md:top-0 md:flex md:h-screen md:max-h-screen">
        {content}
      </aside>
    </>
  );
}
