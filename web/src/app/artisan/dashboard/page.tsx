import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { listArtisanProducts, listArtisanOrders, listNotifications, getArtisan } from '@/lib/db';

export const dynamic = 'force-dynamic';

export default async function ArtisanDashboard() {
  const session = await getSession();
  if (!session || session.role !== 'artisan') redirect('/auth/login?next=/artisan/dashboard');

  const [products, orders, notifications, profile] = await Promise.all([
    listArtisanProducts(session.id), listArtisanOrders(session.id), listNotifications(session.id, 'artisan'), getArtisan(session.id),
  ]);
  const pendingOrders = orders.filter((o) => o.status === 'pending');
  const unread = notifications.filter((n) => !n.is_read).length;

  return (
    <>
      <main className="mx-auto max-w-5xl px-4 py-10">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="font-serif text-3xl font-bold text-brand-900">Artisan portal</h1>
            <p className="mt-1 text-stone-500">
              {profile?.business_name ?? profile?.name ?? session.name}
              {profile?.verification_status === 'approved' && <span className="badge ml-2 bg-leaf-500/10 text-leaf-700">✔ Verified</span>}
            </p>
          </div>
          <Link className="btn-primary" href="/artisan/products/new">+ Add product</Link>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-4">
          <div className="card p-5"><p className="text-sm text-stone-500">Products</p><p className="mt-1 text-3xl font-bold text-brand-700">{products.length}</p></div>
          <div className="card p-5"><p className="text-sm text-stone-500">Pending orders</p><p className="mt-1 text-3xl font-bold text-brand-700">{pendingOrders.length}</p></div>
          <div className="card p-5"><p className="text-sm text-stone-500">Total orders</p><p className="mt-1 text-3xl font-bold text-brand-700">{orders.length}</p></div>
          <div className="card p-5"><p className="text-sm text-stone-500">Notifications</p><p className="mt-1 text-3xl font-bold text-brand-700">{unread}</p></div>
        </div>

        <h2 className="mt-10 font-serif text-2xl font-bold text-brand-900">Recent orders</h2>
        <div className="mt-4 space-y-3">
          {orders.slice(0, 6).map((o) => (
            <div key={o.id} className="card flex flex-wrap items-center justify-between gap-3 p-4">
              <div>
                <p className="font-semibold text-stone-800">
                  {o.product_name} × {o.quantity}
                  {o.selected_variant ? ` (${o.selected_variant})` : ''}
                </p>
                <p className="text-sm text-stone-500">
                  Order #{o.order_id} · {o.customer_name ?? 'Customer'} · {o.order?.payment_method === 'gcash' ? 'GCash' : 'COD'}
                </p>
              </div>
              <span className="badge bg-stone-100 capitalize text-stone-600">{o.status.replace(/_/g, ' ')}</span>
            </div>
          ))}
          {orders.length === 0 && <p className="text-stone-500">No orders yet.</p>}
        </div>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link className="btn-outline" href="/artisan/orders">Manage orders</Link>
          <Link className="btn-outline" href="/artisan/bookings">Bookings</Link>
          <Link className="btn-outline" href="/artisan/experiences">Experiences</Link>
          <Link className="btn-outline" href="/artisan/reviews">Reviews</Link>
          <Link className="btn-outline" href="/artisan/analytics">Analytics</Link>
          <Link className="btn-outline" href="/artisan/profile">Profile</Link>
          <Link className="btn-outline" href="/artisan/messages">Messages</Link>
        </div>
      </main>
    </>
  );
}
