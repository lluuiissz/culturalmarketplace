import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { listCustomerOrders, listNotifications, getCart, listCustomerBookings, getUser } from '@/lib/db';

export const dynamic = 'force-dynamic';

export default async function CustomerDashboard() {
  const session = await getSession();
  if (!session || session.role !== 'customer') redirect('/auth/login?next=/customer/account/dashboard');

  const [orders, notifications, cart, bookings, user] = await Promise.all([
    listCustomerOrders(session.id),
    listNotifications(session.id, 'customer'),
    getCart(session.id),
    listCustomerBookings(session.id),
    getUser(session.id),
  ]);
  const unread = notifications.filter((n) => !n.is_read).length;
  const cartCount = cart.reduce((s, i) => s + i.quantity, 0);
  const nextBooking = bookings.find(
    (b) => b.status !== 'cancelled' && b.status !== 'attended' && b.order_status !== 'cancelled'
  );

  return (
    <>
      <main className="mx-auto max-w-5xl px-4 py-10">
        <div className="flex items-center gap-4">
          {user?.profile_picture ? (
            <img
              src={user.profile_picture}
              alt={session.name}
              className="h-16 w-16 rounded-full object-cover border-2 border-brand-200 shadow-xs"
            />
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-crimson-700 to-ochre-600 text-xl font-bold text-white shadow-xs">
              {session.name.slice(0, 2).toUpperCase()}
            </div>
          )}
          <div>
            <h1 className="font-serif text-3xl font-bold text-brand-900">Hi, {session.name} 👋</h1>
            <p className="mt-1 text-stone-500">Track your orders and support local artisans.</p>
          </div>
        </div>

        {nextBooking && (
          <div className="card mt-6 p-5 border-2 border-ochre-400/50 bg-gradient-to-r from-ochre-50/80 via-white to-brand-50/40 flex flex-wrap items-center justify-between gap-4 shadow-xs">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="badge bg-ochre-500 text-charcoal-950 border border-ochre-600 text-xs font-bold">✨ Upcoming Workshop</span>
                {nextBooking.ticket_code && (
                  <span className="font-mono text-xs font-bold text-brand-800">🎟️ {nextBooking.ticket_code}</span>
                )}
              </div>
              <h3 className="font-serif text-lg font-bold text-stone-900">{nextBooking.product_name}</h3>
              <p className="text-xs text-stone-600">
                📅 {nextBooking.selected_session?.date || 'Confirmed Session'} · 📍 {nextBooking.venue_location || 'Artisan Workshop Studio'}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Link href="/customer/account/bookings" className="btn-primary text-xs px-3.5 py-2 font-bold shadow-xs">
                🧭 Track Venue & Pathfinding →
              </Link>
            </div>
          </div>
        )}

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
          <Link className="btn-primary" href="/customer/account/bookings">🎟️ Workshops & Bookings</Link>
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
