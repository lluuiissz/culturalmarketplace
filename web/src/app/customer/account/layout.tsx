import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import PortalSidebar, { type NavSection } from '@/components/PortalSidebar';

export const dynamic = 'force-dynamic';

const SECTIONS: NavSection[] = [
  {
    title: 'Patron Record',
    items: [
      { href: '/customer/account/dashboard', label: 'Patron Logbook', icon: '🏠' },
      { href: '/customer/account/orders', label: 'Craft Orders & History', icon: '🧾' },
      { href: '/customer/account/bookings', label: 'Workshop Passes & Schedules', icon: '🎟️' },
      { href: '/customer/account/messages', label: 'Artisan Messages', icon: '💬' },
      { href: '/customer/account/addresses', label: 'Delivery Addresses', icon: '📍' },
      { href: '/customer/account/report', label: 'Cultural Helpdesk & Reports', icon: '🚩' },
      { href: '/customer/account/profile', label: 'Patron Profile', icon: '👤' },
    ],
  },
];

export default async function CustomerAccountLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session || session.role !== 'customer') redirect('/auth/login?next=/customer/account/dashboard');

  return (
    <div className="flex min-h-screen flex-col md:flex-row bg-canvas">
      <PortalSidebar
        sections={SECTIONS}
        portalHome="/customer/account/dashboard"
        portalLabel="Patron Account"
        userName={session.name}
        backLabel="Keep exploring crafts"
      />
      <main className="min-w-0 flex-1 bg-canvas p-4 md:p-8">{children}</main>
    </div>
  );
}
