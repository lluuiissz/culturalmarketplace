import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import PortalSidebar, { type NavSection } from '@/components/PortalSidebar';

export const dynamic = 'force-dynamic';

// Customer account navigation — only "my stuff" pages. Shopping itself
// (browse, cart, checkout) stays in the public storefront header.
const SECTIONS: NavSection[] = [
  {
    title: 'My account',
    items: [
      { href: '/customer/account/dashboard', label: 'Dashboard', icon: '🏠' },
      { href: '/customer/account/orders', label: 'My orders', icon: '🧾' },
      { href: '/customer/account/messages', label: 'Messages', icon: '💬' },
      { href: '/customer/account/addresses', label: 'Address book', icon: '📍' },
      { href: '/customer/account/report', label: 'Report an issue', icon: '🚩' },
      { href: '/customer/account/profile', label: 'Profile', icon: '👤' },
    ],
  },
];

export default async function CustomerAccountLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session || session.role !== 'customer') redirect('/auth/login?next=/customer/account/dashboard');

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <PortalSidebar
        sections={SECTIONS}
        portalHome="/customer/account/dashboard"
        portalLabel="My account"
        userName={session.name}
        backLabel="Keep shopping"
      />
      <main className="min-w-0 flex-1 bg-brand-50/50 p-4 md:p-6">{children}</main>
    </div>
  );
}
