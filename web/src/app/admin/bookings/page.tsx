import { listBookings } from '@/lib/db';
import BookingsClient from './BookingsClient';

export const dynamic = 'force-dynamic';

export default async function AdminBookingsPage() {
  const bookings = await listBookings();
  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-serif text-2xl font-bold text-brand-900">Bookings</h1>
        <a className="btn-outline" href="/api/admin/bookings/export" download>⬇ Export CSV</a>
      </div>
      <BookingsClient
        initial={bookings.map((b) => ({
          order_item_id: b.order_item_id, order_id: b.order_id, customer: b.customer_name,
          product: b.product_name, attendee: b.attendee_name,
          session: b.selected_session ? `${b.selected_session.date} ${b.selected_session.time_start}–${b.selected_session.time_end}` : null,
          quantity: b.quantity, price: b.price, status: b.status, ticket: b.ticket_code,
        }))}
      />
    </div>
  );
}
