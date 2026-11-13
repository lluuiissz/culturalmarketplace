import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import PortalSidebar, { type NavSection } from '@/components/PortalSidebar';

export const dynamic = 'force-dynamic';

const SECTIONS: NavSection[] = [
  {
    title: 'Customer Record',
    items: [
      { href: '/customer/account/dashboard', label: 'Logbook', icon: 'home' },
      { href: '/customer/account/orders', label: 'My Orders & History', icon: 'receipt' },
      { href: '/customer/account/bookings', label: 'Workshop & Schedules', icon: 'calendar' },
      { href: '/customer/account/messages', label: 'Messages', icon: 'message' },
      { href: '/customer/account/addresses', label: 'Delivery Addresses', icon: 'map-pin' },
      { href: '/customer/account/report', label: 'Cultural Helpdesk & Reports', icon: 'flag' },
      { href: '/customer/account/profile', label: 'Profile', icon: 'user' },
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
        portalLabel="Customer Account"
        userName={session.name}
        backLabel="Keep exploring crafts"
      />
      <main className="min-w-0 flex-1 bg-canvas p-4 md:p-8">{children}</main>
    </div>
  );
}
