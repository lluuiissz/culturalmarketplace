import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import PortalSidebar, { type NavSection } from '@/components/PortalSidebar';

export const dynamic = 'force-dynamic';

const SECTIONS: NavSection[] = [
  {
    title: 'Overview',
    items: [
      { href: '/artisan/dashboard', label: 'Atelier Dashboard', icon: '🏠' },
      { href: '/artisan/analytics', label: 'Studio Statistics', icon: '📈' },
    ],
  },
  {
    title: 'Heritage Crafting',
    items: [
      { href: '/artisan/products', label: 'My Creations', icon: '📦' },
      { href: '/artisan/products/new', label: 'Add New Craft', icon: '➕' },
      { href: '/artisan/experiences', label: 'Workshops & Experiences', icon: '🧺' },
    ],
  },
  {
    title: 'Orders & Delivery',
    items: [
      { href: '/artisan/orders', label: 'Patron Orders', icon: '🧾' },
      { href: '/artisan/shipments', label: 'Shipments (J&T)', icon: '🚚' },
      { href: '/artisan/bookings', label: 'Workshop Bookings', icon: '🎟️' },
    ],
  },
  {
    title: 'Community',
    items: [
      { href: '/artisan/messages', label: 'Patron Messages', icon: '💬' },
      { href: '/artisan/reviews', label: 'Patron Reviews', icon: '⭐' },
      { href: '/artisan/notifications', label: 'Notifications', icon: '🔔' },
    ],
  },
  {
    title: 'Atelier Identity',
    items: [
      { href: '/artisan/profile', label: 'Master Profile', icon: '👤' },
    ],
  },
];

export default async function ArtisanLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session || session.role !== 'artisan') redirect('/auth/login?next=/artisan/dashboard');

  return (
    <div className="flex min-h-screen flex-col md:flex-row bg-canvas">
      <PortalSidebar
        sections={SECTIONS}
        portalHome="/artisan/dashboard"
        portalLabel="Artisan Atelier"
        userName={session.name}
        backLabel="Browse the marketplace"
      />
      <main className="min-w-0 flex-1 bg-canvas p-4 md:p-8">{children}</main>
    </div>
  );
}
