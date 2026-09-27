import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import PortalSidebar, { type NavSection } from '@/components/PortalSidebar';

export const dynamic = 'force-dynamic';

// Admin-only navigation — grouped by responsibility. Distinct from the
// artisan portal and the public storefront.
const SECTIONS: NavSection[] = [
  {
    title: 'Overview',
    items: [
      { href: '/admin/dashboard', label: 'Dashboard', icon: '🏠' },
      { href: '/admin/analytics', label: 'Analytics & demographics', icon: '📊' },
      { href: '/admin/activity', label: 'Activity logs', icon: '🕘' },
    ],
  },
  {
    title: 'People',
    items: [
      { href: '/admin/artisans', label: 'Artisans', icon: '🎨' },
      { href: '/admin/customers', label: 'Customers', icon: '🛒' },
    ],
  },
  {
    title: 'Marketplace content',
    items: [
      { href: '/admin/products', label: 'Products', icon: '📦' },
      { href: '/admin/categories', label: 'Categories', icon: '🏷️' },
      { href: '/admin/reviews', label: 'Reviews', icon: '⭐' },
      { href: '/admin/homepage', label: 'Homepage editor', icon: '🖼️' },
    ],
  },
  {
    title: 'Trust & safety',
    items: [
      { href: '/admin/moderation', label: 'Moderation queue', icon: '🛡️' },
      { href: '/admin/reports', label: 'Reports', icon: '🚩' },
      { href: '/admin/nfc', label: 'NFC tags', icon: '📡' },
    ],
  },
  {
    title: 'Transactions',
    items: [
      { href: '/admin/orders', label: 'Orders', icon: '🧾' },
      { href: '/admin/payments', label: 'Payment verification', icon: '💳' },
      { href: '/admin/shipments', label: 'Shipments', icon: '🚚' },
      { href: '/admin/bookings', label: 'Bookings', icon: '🎟️' },
    ],
  },
  {
    title: 'System',
    items: [
      { href: '/admin/settings', label: 'Settings', icon: '⚙️' },
      { href: '/admin/profile', label: 'My profile', icon: '👤' },
    ],
  },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session || session.role !== 'admin') redirect('/auth/login?next=/admin/dashboard');

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <PortalSidebar
        sections={SECTIONS}
        portalHome="/admin/dashboard"
        portalLabel="Admin panel"
        userName={session.name}
        backLabel="View storefront"
      />
      {/* min-w-0 lets main shrink so wide tables scroll inside, not the page */}
      <main className="min-w-0 flex-1 bg-brand-50/50 p-4 md:p-6">{children}</main>
    </div>
  );
}
