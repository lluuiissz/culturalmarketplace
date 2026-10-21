import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import PortalSidebar, { type NavSection } from '@/components/PortalSidebar';

export const dynamic = 'force-dynamic';

const SECTIONS: NavSection[] = [
  {
    title: 'Cultural Directorate',
    items: [
      { href: '/admin/dashboard', label: 'Curator Dashboard', icon: '🏠' },
      { href: '/admin/analytics', label: 'Analytics & Provenance', icon: '📊' },
      { href: '/admin/activity', label: 'Activity Logs', icon: '🕘' },
    ],
  },
  {
    title: 'Artisans & Patrons',
    items: [
      { href: '/admin/artisans', label: 'Master Artisans & KYC', icon: '🎨' },
      { href: '/admin/customers', label: 'Patron Registry', icon: '🛒' },
    ],
  },
  {
    title: 'Heritage Catalog',
    items: [
      { href: '/admin/products', label: 'Craft Listings', icon: '📦' },
      { href: '/admin/categories', label: 'Weave Categories', icon: '🏷️' },
      { href: '/admin/reviews', label: 'Reviews & Feedback', icon: '⭐' },
      { href: '/admin/homepage', label: 'Homepage Showcase', icon: '🖼️' },
    ],
  },
  {
    title: 'Trust & Authenticity',
    items: [
      { href: '/admin/moderation', label: 'Moderation Queue', icon: '🛡️' },
      { href: '/admin/reports', label: 'Cultural Reports', icon: '🚩' },
      { href: '/admin/nfc', label: 'Sacred NFC Registry', icon: '📡' },
    ],
  },
  {
    title: 'Exchanges & Bookings',
    items: [
      { href: '/admin/orders', label: 'Orders', icon: '🧾' },
      { href: '/admin/payments', label: 'Payment Verification', icon: '💳' },
      { href: '/admin/shipments', label: 'Shipments (J&T)', icon: '🚚' },
      { href: '/admin/bookings', label: 'Workshop Bookings', icon: '🎟️' },
    ],
  },
  {
    title: 'System Settings',
    items: [
      { href: '/admin/settings', label: 'Platform Settings', icon: '⚙️' },
      { href: '/admin/profile', label: 'Curator Profile', icon: '👤' },
    ],
  },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session || session.role !== 'admin') redirect('/auth/login?next=/admin/dashboard');

  return (
    <div className="flex min-h-screen flex-col md:flex-row bg-canvas">
      <PortalSidebar
        sections={SECTIONS}
        portalHome="/admin/dashboard"
        portalLabel="Curator Directorate"
        userName={session.name}
        backLabel="View Storefront"
      />
      <main className="min-w-0 flex-1 bg-canvas p-4 md:p-8">{children}</main>
    </div>
  );
}
