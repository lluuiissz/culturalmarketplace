
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import PortalSidebar, { type NavSection } from '@/components/PortalSidebar';

export const dynamic = 'force-dynamic';

const SECTIONS: NavSection[] = [
  {
    title: 'Cultural Directorate',
    items: [
      { href: '/admin/dashboard', label: 'Curator Dashboard', icon: 'home' },
      { href: '/admin/analytics', label: 'Analytics & Provenance', icon: 'chart' },
      { href: '/admin/activity', label: 'Activity Logs', icon: 'history' },
    ],
  },
  {
    title: 'Artisans & Patrons',
    items: [
      { href: '/admin/artisans', label: 'Master Artisans & KYC', icon: 'users' },
      { href: '/admin/customers', label: 'Patron Registry', icon: 'shopping-bag' },
    ],
  },
  {
    title: 'Heritage Catalog',
    items: [
      { href: '/admin/products', label: 'Craft Listings', icon: 'package' },
      { href: '/admin/categories', label: 'Weave Categories', icon: 'tags' },
      { href: '/admin/reviews', label: 'Reviews & Feedback', icon: 'star' },
      { href: '/admin/homepage', label: 'Homepage Showcase', icon: 'image' },
    ],
  },
  {
    title: 'Trust & Authenticity',
    items: [
      { href: '/admin/moderation', label: 'Moderation Queue', icon: 'shield' },
      { href: '/admin/reports', label: 'Cultural Reports', icon: 'flag' },
      { href: '/admin/nfc', label: 'Sacred NFC Registry', icon: 'radio' },
    ],
  },
  {
    title: 'Exchanges & Bookings',
    items: [
      { href: '/admin/orders', label: 'Orders', icon: 'receipt' },
      { href: '/admin/payments', label: 'Payment Verification', icon: 'credit-card' },
      { href: '/admin/shipments', label: 'Shipments (J&T)', icon: 'truck' },
      { href: '/admin/bookings', label: 'Workshop Bookings', icon: 'ticket' },
    ],
  },
  {
    title: 'System Settings',
    items: [
      { href: '/admin/settings', label: 'Platform Settings', icon: 'settings' },
      { href: '/admin/profile', label: 'Curator Profile', icon: 'user' },
    ],
  },
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (!session || session.role !== 'admin') {
    redirect('/auth/login?next=/admin/dashboard');
  }

  return (
    <div className="flex min-h-screen flex-col bg-canvas md:flex-row">
      <PortalSidebar
        sections={SECTIONS}
        portalHome="/admin/dashboard"
        portalLabel="Curator Directorate"
        userName={session.name}
        backLabel="View Storefront"
      />

      <main className="min-w-0 flex-1 bg-canvas p-4 md:p-8">
        {children}
      </main>
    </div>
  );
}
