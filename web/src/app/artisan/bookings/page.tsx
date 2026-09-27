import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { listBookings } from '@/lib/db';
import BookingsClient from './BookingsClient';

export const dynamic = 'force-dynamic';

export default async function ArtisanBookingsPage() {
  const session = await getSession();
  if (!session || session.role !== 'artisan') redirect('/auth/login?next=/artisan/bookings');

  const bookings = await listBookings(session.id);
  return (
    <>
      <main className="mx-auto max-w-4xl px-4 py-10">
        <h1 className="font-serif text-3xl font-bold text-brand-900">Bookings</h1>
        <BookingsClient
          initial={bookings.map((b) => ({
            order_item_id: b.order_item_id, customer: b.customer_name, product: b.product_name,
            product_id: b.product_id,
            attendee: b.attendee_name,
            session: b.selected_session ? `${b.selected_session.date} ${b.selected_session.time_start}–${b.selected_session.time_end}` : null,
            quantity: b.quantity, status: b.status, ticket: b.ticket_code,
          }))}
        />
      </main>
    </>
  );
}
