import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { listCustomerOrders, listNotifications, getCart } from '@/lib/db';

export const dynamic = 'force-dynamic';

export default async function CustomerDashboard() {
  const session = await getSession();
  if (!session || session.role !== 'customer') redirect('/auth/login?next=/customer/account/dashboard');

  const [orders, notifications, cart] = await Promise.all([listCustomerOrders(session.id), listNotifications(session.id, 'customer'), getCart(session.id)]);
  const unread = notifications.filter((n) => !n.is_read).length;
  const cartCount = cart.reduce((s, i) => s + i.quantity, 0);

  return (
    <>
      <main className="mx-auto max-w-5xl px-4 py-10">
        <h1 className="font-serif text-3xl font-bold text-brand-900">Hi, {session.name} 👋</h1>
        <p className="mt-1 text-stone-500">Track your orders and support local artisans.</p>

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <div className="card p-5">
            <p className="text-sm text-stone-500">Total orders</p>
            <p className="mt-1 text-3xl font-bold text-brand-700">{orders.length}</p>
          </div>
          <div className="card p-5">
            <p className="text-sm text-stone-500">Unread notifications</p>
            <p className="mt-1 text-3xl font-bold text-brand-700">{unread}</p>
          </div>
          <div className="card p-5">
            <p className="text-sm text-stone-500">Items in cart</p>
            <p className="mt-1 text-3xl font-bold text-brand-700">{cartCount}</p>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link className="btn-outline" href="/customer/account/profile">Edit profile</Link>
          <Link className="btn-outline" href="/customer/account/addresses">Address book</Link>
          <Link className="btn-outline" href="/customer/account/report">Report an issue</Link>
          <Link className="btn-outline" href="/customer/account/messages">Messages</Link>
        </div>

        <h2 className="mt-10 font-serif text-2xl font-bold text-brand-900">Recent orders</h2>
        <div className="mt-4 space-y-3">
          {orders.slice(0, 5).map((o) => (
            <Link key={o.id} href="/customer/account/orders" className="card flex items-center justify-between p-4 hover:bg-brand-50/50">
              <div>
                <p className="font-semibold text-stone-800">Order #{o.id}</p>
                <p className="text-sm text-stone-500">{new Date(o.created_at).toLocaleDateString()} · {o.payment_method === 'gcash' ? 'GCash' : 'COD'}</p>
              </div>
              <span className="badge bg-stone-100 capitalize text-stone-600">{o.status.replace(/_/g, ' ')}</span>
            </Link>
          ))}
          {orders.length === 0 && <p className="text-stone-500">No orders yet — <Link className="text-brand-600 underline" href="/customer/browse">start browsing</Link>.</p>}
        </div>

        <h2 className="mt-10 font-serif text-2xl font-bold text-brand-900">Notifications</h2>
        <div className="mt-4 space-y-2">
          {notifications.slice(0, 5).map((n) => (
            <div key={n.id} className={`card p-4 ${n.is_read ? 'opacity-60' : ''}`}>
              <p className="text-sm text-stone-700">{n.message}</p>
              <p className="mt-1 text-xs text-stone-400">{new Date(n.created_at).toLocaleString()}</p>
            </div>
          ))}
          {notifications.length === 0 && <p className="text-stone-500">You&apos;re all caught up.</p>}
        </div>
      </main>
    </>
  );
}
