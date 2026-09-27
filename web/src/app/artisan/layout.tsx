import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import PortalSidebar, { type NavSection } from '@/components/PortalSidebar';

export const dynamic = 'force-dynamic';

// Artisan-only navigation — distinct from the public storefront header and
// from the admin panel. Grouped by task so the purpose of each area is clear.
const SECTIONS: NavSection[] = [
  {
    title: 'Overview',
    items: [
      { href: '/artisan/dashboard', label: 'Dashboard', icon: '🏠' },
      { href: '/artisan/analytics', label: 'My statistics', icon: '📈' },
    ],
  },
  {
    title: 'Selling',
    items: [
      { href: '/artisan/products', label: 'My products', icon: '📦' },
      { href: '/artisan/products/new', label: 'Add a product', icon: '➕' },
      { href: '/artisan/experiences', label: 'Workshops & experiences', icon: '🧺' },
    ],
  },
  {
    title: 'Orders & delivery',
    items: [
      { href: '/artisan/orders', label: 'Orders', icon: '🧾' },
      { href: '/artisan/shipments', label: 'Shipments (J&T)', icon: '🚚' },
      { href: '/artisan/bookings', label: 'Workshop bookings', icon: '🎟️' },
    ],
  },
  {
    title: 'Customers',
    items: [
      { href: '/artisan/messages', label: 'Messages', icon: '💬' },
      { href: '/artisan/reviews', label: 'Reviews', icon: '⭐' },
      { href: '/artisan/notifications', label: 'Notifications', icon: '🔔' },
    ],
  },
  {
    title: 'Account',
    items: [
      { href: '/artisan/profile', label: 'My profile', icon: '👤' },
    ],
  },
];

export default async function ArtisanLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session || session.role !== 'artisan') redirect('/auth/login?next=/artisan/dashboard');

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <PortalSidebar
        sections={SECTIONS}
        portalHome="/artisan/dashboard"
        portalLabel="Artisan portal"
        userName={session.name}
        backLabel="Browse the marketplace"
      />
      {/* min-w-0 lets the content column shrink so wide tables scroll inside */}
      <main className="min-w-0 flex-1 bg-brand-50/50 p-4 md:p-6">{children}</main>
    </div>
  );
}
