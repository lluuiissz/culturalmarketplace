import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import PortalSidebar, { type NavSection } from '@/components/PortalSidebar';

export const dynamic = 'force-dynamic';

const SECTIONS: NavSection[] = [
  {
    title: 'Overview',
    items: [
      { href: '/artisan/dashboard', label: 'Artisan Dashboard', icon: 'home' },
      { href: '/artisan/analytics', label: 'Statistics', icon: 'chart' },
    ],
  },
  {
    title: 'Traditional Crafting',
    items: [
      { href: '/artisan/products', label: 'Creations', icon: 'package' },
      { href: '/artisan/products/new', label: 'Add New Craft', icon: 'tags' },
      { href: '/artisan/experiences', label: 'Workshops & Experiences', icon: 'calendar' },
    ],
  },
  {
    title: 'Orders & Delivery',
    items: [
      { href: '/artisan/orders', label: 'Orders', icon: 'receipt' },
      { href: '/artisan/shipments', label: 'Shipments (J&T)', icon: 'truck' },
      { href: '/artisan/bookings', label: 'Workshop Bookings', icon: 'ticket' },
    ],
  },
  {
    title: 'Community',
    items: [
      { href: '/artisan/messages', label: 'Messages', icon: 'message' },
      { href: '/artisan/reviews', label: 'Reviews', icon: 'star' },
      { href: '/artisan/notifications', label: 'Notifications', icon: 'radio' },
    ],
  },
  {
    title: 'Identity',
    items: [
      { href: '/artisan/profile', label: 'Profile', icon: 'user' },
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
        portalLabel="Artisan Dashboard"
        userName={session.name}
        backLabel="Browse the Marketplace"
      />
      <main className="min-w-0 flex-1 bg-canvas p-4 md:p-8">{children}</main>
    </div>
  );
}
