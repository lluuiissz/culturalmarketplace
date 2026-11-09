import Link from 'next/link';
import WeaveDivider from './WeaveDivider';

export default function Footer() {
  return (
    <footer className="mt-20 border-t border-[#DCC5A8] bg-[#F5EBDD] text-[#211B17]">
      {/* Top Weave Border Accent */}
      <WeaveDivider pattern="kalinga" className="opacity-75" />

      <div className="mx-auto max-w-6xl px-4 py-16">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-4">

          {/* Brand & Provenance */}
          <div className="space-y-4 md:col-span-1">

            {/* LOGO AND BRAND NAME */}
            <div className="flex items-center gap-3">
              <Link
                href="/"
                className="flex shrink-0 items-center"
                aria-label="Cultural Marketplace — home"
              >
                <img
                  src="/images/cultural-marketplace-logo.png"
                  alt="Cultural Marketplace Logo"
                  className="h-14 w-auto max-w-[110px] object-contain"
                />
              </Link>

              {/* BRAND NAME BESIDE LOGO */}
              <div className="flex min-w-0 flex-col justify-center leading-tight">
                <h2 className="whitespace-nowrap font-sans text-sm font-extrabold tracking-tight sm:text-base">
                  <span className="text-[#8B0000]">Cultural</span>
                  {' '}
                  <span className="text-[#D18A00]">Marketplace</span>
                </h2>
                <p className="mt-1 text-[9px] font-semibold leading-tight text-[#51443A]">
                  Agusan del Sur Indigenous Crafts and Experiences
                </p>
              </div>
            </div>

            <p className="text-xs leading-relaxed text-[#51443A]">
              Preserving and honoring the living indigenous traditions of Agusan del Sur. Connecting master weavers, woodcarvers, and cultural keepers directly with respectful global patrons.
            </p>

            <div className="inline-flex items-center gap-1.5 rounded-full border border-[#D9A441]/50 bg-white px-3 py-1 text-[11px] font-medium text-[#8B5E00]">
              <span>🌿</span>
              <span>Custodians of Agusan del Sur</span>
            </div>
          </div>

          {/* Column 1: Discover */}
          <div className="space-y-3">
            <p className="font-sculpted text-sm font-semibold uppercase tracking-wider text-[#8B0000]">
              Discover the Craft
            </p>
            <ul className="space-y-2 text-xs text-[#51443A]">
              <li>
                <Link href="/customer/browse" className="transition hover:text-[#990000]">
                  Explore Traditional Weaves
                </Link>
              </li>
              <li>
                <Link href="/artisans" className="transition hover:text-[#990000]">
                  Master Artisans & Lineage
                </Link>
              </li>
              <li>
                <Link href="/customer/browse" className="transition hover:text-[#990000]">
                  Living Cultural Workshops
                </Link>
              </li>
              <li>
                <Link href="/verify/35:F3:D4:33:79" className="transition hover:text-[#990000]">
                  NFC Authenticity Verification
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 2: The Gathering */}
          <div className="space-y-3">
            <p className="font-sculpted text-sm font-semibold uppercase tracking-wider text-[#8B0000]">
              The Gathering
            </p>
            <ul className="space-y-2 text-xs text-[#51443A]">
              <li>
                <Link href="/auth/register-artisan" className="transition hover:text-[#990000]">
                  Enroll as a Master Artisan
                </Link>
              </li>
              <li>
                <Link href="/auth/login" className="transition hover:text-[#990000]">
                  Sign in to Patron Portal
                </Link>
              </li>
              <li>
                <Link href="/auth/register" className="transition hover:text-[#990000]">
                  Join the Community
                </Link>
              </li>
              <li>
                <Link href="/cart" className="transition hover:text-[#990000]">
                  Your Artisan Basket
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Cultural Respect & Ethics */}
          <div className="space-y-3">
            <p className="font-sculpted text-sm font-semibold uppercase tracking-wider text-[#8B0000]">
              Cultural Respect
            </p>
            <p className="text-xs leading-relaxed text-[#51443A]">
              Each craft pattern represents centuries of sacred heritage. Motifs are utilized with tribal attribution, ensuring genuine cultural preservation without sacred misuse.
            </p>
            <p className="text-[11px] text-[#8B5E00]">
              Caraga Administrative Region · Agusan del Sur, Philippines
            </p>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-[#DCC5A8] pt-6 text-center text-xs text-[#78695C] sm:flex-row">
          <p>
            © {new Date().getFullYear()} Cultural Marketplace. All rights reserved. Handcrafted with reverence.
          </p>
          <p className="text-[11px]">
            Honoring Manobo, Higaonon, Banwaon, and Talaandig Artisan Heritage
          </p>
        </div>
      </div>
    </footer>
  );
}
