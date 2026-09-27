import Link from 'next/link';
import { adminStats, listActivityLogs } from '@/lib/db';

export const dynamic = 'force-dynamic';

export default async function AdminDashboard() {
  const [stats, logs] = await Promise.all([adminStats(), listActivityLogs(8)]);

  const cards = [
    { label: 'Customers', value: stats.customers, href: '/admin/artisans' },
    { label: 'Artisans', value: stats.artisans, href: '/admin/artisans' },
    { label: 'Pending approvals', value: stats.pendingArtisans, href: '/admin/artisans?filter=pending' },
    { label: 'Orders', value: stats.orders, href: '/admin/orders' },
    { label: 'Revenue (paid)', value: `₱${stats.revenue.toFixed(2)}`, href: '/admin/orders' },
    { label: 'Products', value: stats.products, href: '/admin/products' },
  ];

  return (
    <div>
      <h1 className="font-serif text-2xl font-bold text-brand-900">Platform overview</h1>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((c) => (
          <Link key={c.label} href={c.href} className="card p-5 transition-shadow hover:shadow-md">
            <p className="text-sm text-stone-500">{c.label}</p>
            <p className="mt-1 text-3xl font-bold text-brand-700">{c.value}</p>
          </Link>
        ))}
      </div>

      <h2 className="mt-10 font-serif text-xl font-bold text-brand-900">Recent activity</h2>
      <div className="card mt-4 divide-y divide-stone-100">
        {logs.map((l) => (
          <div key={l.id} className="flex items-center justify-between gap-3 p-3 text-sm">
            <div>
              <span className="font-semibold text-stone-700">{l.user_name}</span>
              <span className="ml-2 text-stone-500">{l.description}</span>
            </div>
            <span className="shrink-0 text-xs text-stone-400">{new Date(l.created_at).toLocaleString()}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
