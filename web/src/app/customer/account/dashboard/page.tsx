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
    <main className="min-h-screen bg-[#FCF9F4]">
      {/* PROFILE HEADER */}
      <section className="border-b border-[#E8DCCB] px-4 py-6 md:px-8">
        <div className="mx-auto flex max-w-5xl flex-col items-center gap-4 sm:flex-row sm:justify-center sm:gap-6">
          {/* PROFILE PHOTO */}
          <div className="h-28 w-28 shrink-0 overflow-hidden rounded-full border border-[#D8C8B5] bg-white">
            {user?.profile_picture ? (
              <img
                src={user.profile_picture}
                alt={`${session.name}'s profile`}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-4xl font-bold text-[#8B0000]">
                {session.name?.charAt(0)?.toUpperCase() || 'C'}
              </div>
            )}
          </div>

          {/* CUSTOMER INFORMATION */}
          <div className="min-w-0 text-center sm:text-left">
            <h1 className="font-serif text-xl font-bold text-[#3D3028] md:text-2xl">
              Hi, {session.name}
            </h1>

            <p className="mt-1 text-sm font-semibold text-[#D18A00]">Valued Customer</p>

            <p className="mt-1 text-sm text-[#71675F]">
              Track your orders and support local artisans.
            </p>

            {/* PROFILE ACTIONS */}
            <div className="mt-2 flex flex-wrap justify-center gap-2 sm:justify-start">
              <Link
                href="/customer/account/profile"
                className="rounded-md border border-[#D6B56D] bg-white px-4 py-1 text-[10px] font-medium text-[#9A681D] transition hover:bg-[#FFF5E4]"
              >
                Change Photo
              </Link>

              <Link
                href="/customer/account/bookings"
                className="rounded-md border border-[#D9A6A6] bg-white px-4 py-1 text-[10px] font-medium text-[#8B0000] transition hover:bg-[#FCEEEE]"
              >
                My Bookings
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* DIVIDER */}
      <div className="h-px w-full bg-gray-300" />

      {/* DASHBOARD CONTENT */}
      <section className="px-4 py-5 md:px-8 md:py-6">
        <div className="mx-auto max-w-4xl">
          {/* UPCOMING WORKSHOP */}
          {nextBooking && (
            <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[#D6B56D] bg-[#FFF9EF] p-5 shadow-sm">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="rounded-full border border-[#D6B56D] bg-[#F5A000] px-2.5 py-0.5 text-xs font-bold text-[#3D3028]">
                    Upcoming Workshop
                  </span>
                  {nextBooking.ticket_code && (
                    <span className="font-mono text-xs font-bold text-[#8B0000]">
                      🎟️ {nextBooking.ticket_code}
                    </span>
                  )}
                </div>
                <h3 className="font-serif text-lg font-bold text-[#3D3028]">{nextBooking.product_name}</h3>
                <p className="text-xs text-[#71675F]">
                  {nextBooking.selected_session?.date || 'Confirmed Session'} · 📍{' '}
                  {nextBooking.venue_location || 'Artisan Workshop Studio'}
                </p>
              </div>
              <Link href="/customer/account/bookings" className="btn-primary px-3.5 py-2 text-xs font-bold shadow-sm">
                Track Venue & Pathfinding →
              </Link>
            </div>
          )}

          {/* STATS */}
          <div className={`grid gap-4 sm:grid-cols-3 ${nextBooking ? 'mt-5' : ''}`}>
            {[
              { label: 'Total orders', value: orders.length },
              { label: 'Unread notifications', value: unread },
              { label: 'Items in cart', value: cartCount },
            ].map((s) => (
              <div key={s.label} className="rounded-2xl border border-[#D6D0C9] bg-white p-5 shadow-sm">
                <p className="text-sm text-[#71675F]">{s.label}</p>
                <p className="mt-1 text-3xl font-bold text-[#8B0000]">{s.value}</p>
              </div>
            ))}
          </div>

          {/* QUICK LINKS */}
          <div className="mt-5 flex flex-wrap gap-3">
            <Link className="btn-primary" href="/customer/account/bookings">Workshops & Bookings</Link>
            <Link className="btn-outline" href="/customer/account/profile">Edit profile</Link>
            <Link className="btn-outline" href="/customer/account/addresses">Address book</Link>
            <Link className="btn-outline" href="/customer/account/report">Report an issue</Link>
            <Link className="btn-outline" href="/customer/account/messages">Messages</Link>
          </div>

          {/* RECENT ORDERS */}
          <div className="mt-8 rounded-2xl border border-[#D6D0C9] bg-white p-5 shadow-sm sm:p-6">
            <h2 className="font-serif text-xl font-bold text-[#3D3028]">Recent orders</h2>
            <div className="mt-4 space-y-3">
              {orders.slice(0, 5).map((o) => (
                <Link
                  key={o.id}
                  href="/customer/account/orders"
                  className="flex items-center justify-between rounded-xl border border-[#E8DCCB] p-4 transition hover:bg-[#FFF5E4]"
                >
                  <div>
                    <p className="font-semibold text-[#3D3028]">Order #{o.id}</p>
                    <p className="text-sm text-[#71675F]">
                      {new Date(o.created_at).toLocaleDateString()} · {o.payment_method === 'gcash' ? 'GCash' : 'COD'}
                    </p>
                  </div>
                  <span className="rounded-full bg-stone-100 px-2.5 py-0.5 text-xs capitalize text-stone-600">
                    {o.status.replace(/_/g, ' ')}
                  </span>
                </Link>
              ))}
              {orders.length === 0 && (
                <p className="text-[#71675F]">
                  No orders yet —{' '}
                  <Link className="text-[#8B0000] underline" href="/customer/browse">start browsing</Link>.
                </p>
              )}
            </div>
          </div>

          {/* NOTIFICATIONS */}
          <div className="mt-5 rounded-2xl border border-[#D6D0C9] bg-white p-5 shadow-sm sm:p-6">
            <h2 className="font-serif text-xl font-bold text-[#3D3028]">Notifications</h2>
            <div className="mt-4 space-y-2">
              {notifications.slice(0, 5).map((n) => (
                <div
                  key={n.id}
                  className={`rounded-xl border border-[#E8DCCB] p-4 ${n.is_read ? 'opacity-60' : ''}`}
                >
                  <p className="text-sm text-[#3D3028]">{n.message}</p>
                  <p className="mt-1 text-xs text-stone-400">{new Date(n.created_at).toLocaleString()}</p>
                </div>
              ))}
              {notifications.length === 0 && <p className="text-[#71675F]">You&apos;re all caught up.</p>}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}