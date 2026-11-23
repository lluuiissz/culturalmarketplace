
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import PortalSidebar, { type NavSection } from '@/components/PortalSidebar';

export const dynamic = 'force-dynamic';

const SECTIONS: NavSection[] = [
  {
    title: 'Admin Panel',
    items: [
      { href: '/admin/dashboard', label: 'Admin Dashboard', icon: 'home' },
      { href: '/admin/analytics', label: 'Reports & Analytics', icon: 'chart' },
      { href: '/admin/activity', label: 'Activity Logs', icon: 'history' },
    ],
  },
  {
    title: 'Users & Artisans',
    items: [
      { href: '/admin/artisans', label: 'Artisan Accounts & Verification', icon: 'users' },
      { href: '/admin/customers', label: 'Buyer Accounts', icon: 'shopping-bag' },
    ],
  },
  {
    title: 'Products & Categories',
    items: [
      { href: '/admin/products', label: 'Craft Listings', icon: 'package' },
      { href: '/admin/categories', label: 'Craft Categories', icon: 'tags' },
      { href: '/admin/reviews', label: 'Reviews & Feedback', icon: 'star' },
      { href: '/admin/homepage', label: 'Homepage Highlights', icon: 'image' },
    ],
  },
  {
    title: 'Verification & Safety',
    items: [
      { href: '/admin/moderation', label: 'Pending Reviews', icon: 'shield' },
      { href: '/admin/reports', label: 'Cultural Reports', icon: 'flag' },
      { href: '/admin/nfc', label: 'NFC Authenticity Records', icon: 'radio' },
    ],
  },
  {
    title: 'Orders & Workshops',
    items: [
      { href: '/admin/orders', label: 'Orders', icon: 'receipt' },
      { href: '/admin/payments', label: 'Payment Verification', icon: 'credit-card' },
      { href: '/admin/shipments', label: 'Shipping & Delivery', icon: 'truck' },
      { href: '/admin/bookings', label: 'Workshop Bookings', icon: 'ticket' },
    ],
  },
  {
    title: 'System Settings',
    items: [
      { href: '/admin/settings', label: 'Marketplace Settings', icon: 'settings' },
      { href: '/admin/profile', label: 'Admin Profile', icon: 'user' },
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
        portalLabel="Admin Panel"
        userName={session.name}
        backLabel="View Marketplace"
        roleTitle="Administrator" 
      />

      <main className="min-w-0 flex-1 bg-canvas p-4 md:p-8">
        {children}
      </main>
    </div>
  );
}
