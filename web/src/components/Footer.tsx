import Link from 'next/link';
import WeaveDivider from './WeaveDivider';

export default function Footer() {
  return (
    <footer className="mt-20 border-t border-abaca-300/40 bg-charcoal-950 text-canvas">
      {/* Top Weave Border Accent */}
      <WeaveDivider pattern="kalinga" className="opacity-75" />

      <div className="mx-auto max-w-6xl px-4 py-16">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-4">
          {/* Brand & Provenance */}
          <div className="md:col-span-1 space-y-4">
            <Link href="/" className="inline-flex items-center gap-2 font-sculpted text-xl font-bold text-white tracking-wide">
              <span className="text-2xl text-ochre-500">☀️</span>
              <span>Cultural Marketplace</span>
            </Link>
            <p className="text-xs leading-relaxed text-abaca-200/80">
              Preserving and honoring the living indigenous traditions of Agusan del Sur. Connecting master weavers, woodcarvers, and cultural keepers directly with respectful global patrons.
            </p>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-charcoal-900 px-3 py-1 text-[11px] font-medium text-ochre-400 border border-ochre-600/30">
              <span>🌿</span>
              <span>Custodians of Agusan del Sur</span>
            </div>
          </div>

          {/* Column 1: Discover */}
          <div className="space-y-3">
            <p className="font-sculpted text-sm font-semibold uppercase tracking-wider text-ochre-400">Discover the Craft</p>
            <ul className="space-y-2 text-xs text-abaca-100/70">
              <li>
                <Link href="/customer/browse" className="transition hover:text-ochre-300">Explore Traditional Weaves</Link>
              </li>
              <li>
                <Link href="/artisans" className="transition hover:text-ochre-300">Master Artisans & Lineage</Link>
              </li>
              <li>
                <Link href="/customer/browse" className="transition hover:text-ochre-300">Living Cultural Workshops</Link>
              </li>
              <li>
                <Link href="/verify/35:F3:D4:33:79" className="transition hover:text-ochre-300">NFC Authenticity Verification</Link>
              </li>
            </ul>
          </div>

          {/* Column 2: The Gathering */}
          <div className="space-y-3">
            <p className="font-sculpted text-sm font-semibold uppercase tracking-wider text-ochre-400">The Gathering</p>
            <ul className="space-y-2 text-xs text-abaca-100/70">
              <li>
                <Link href="/auth/register-artisan" className="transition hover:text-ochre-300">Enroll as a Master Artisan</Link>
              </li>
              <li>
                <Link href="/auth/login" className="transition hover:text-ochre-300">Sign in to Patron Portal</Link>
              </li>
              <li>
                <Link href="/auth/register" className="transition hover:text-ochre-300">Join the Community</Link>
              </li>
              <li>
                <Link href="/cart" className="transition hover:text-ochre-300">Your Artisan Basket</Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Cultural Respect & Ethics */}
          <div className="space-y-3">
            <p className="font-sculpted text-sm font-semibold uppercase tracking-wider text-ochre-400">Cultural Respect</p>
            <p className="text-xs leading-relaxed text-abaca-200/70">
              Each craft pattern represents centuries of sacred heritage. Motifs are utilized with tribal attribution, ensuring genuine cultural preservation without sacred misuse.
            </p>
            <p className="text-[11px] text-ochre-300/80">
              Caraga Administrative Region · Agusan del Sur, Philippines
            </p>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 border-t border-charcoal-800 pt-6 text-center text-xs text-abaca-200/50 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>© {new Date().getFullYear()} Cultural Marketplace. All rights reserved. Handcrafted with reverence.</p>
          <p className="text-[11px]">
            Honoring Manobo, Higaonon, Banwaon, and Talaandig Artisan Heritage
          </p>
        </div>
      </div>
    </footer>
  );
}
