import Link from 'next/link';
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
      <main className="mx-auto max-w-4xl px-4 py-10 space-y-6">
        <div>
          <h1 className="font-serif text-3xl font-bold text-brand-900">Bookings & Attendance</h1>
          <p className="mt-1 text-sm text-stone-500">
            Verify tickets, track attendees, check-in participants, and print attendance sheets.
          </p>
        </div>

        {/* Quick Navigation Sub-bar */}
        <div className="flex flex-wrap items-center gap-2 border-b border-stone-200 pb-3 text-xs">
          <Link
            href="/artisan/experiences"
            className="rounded-lg bg-stone-100 px-3.5 py-1.5 font-semibold text-stone-600 hover:bg-stone-200 transition"
          >
            🎓 Workshops List
          </Link>
          <Link
            href="/artisan/experiences/calendar"
            className="rounded-lg bg-stone-100 px-3.5 py-1.5 font-semibold text-stone-600 hover:bg-stone-200 transition"
          >
            📅 Session Calendar
          </Link>
          <Link
            href="/artisan/bookings"
            className="rounded-lg bg-brand-600 px-3.5 py-1.5 font-bold text-white shadow-xs"
          >
            🎟️ Bookings & Attendance ({bookings.length})
          </Link>
        </div>

        <BookingsClient
          initial={bookings.map((b) => ({
            order_item_id: b.order_item_id,
            order_id: b.order_id,
            product_id: b.product_id,
            product: b.product_name,
            customer: b.customer_name,
            customer_phone: b.customer_phone ?? null,
            attendee: b.attendee_name,
            attendee_contact: b.attendee_contact ?? b.customer_phone ?? null,
            attendee_for: b.attendee_for ?? 'self',
            session_date: b.selected_session?.date ?? null,
            session_time: b.selected_session ? `${b.selected_session.time_start}–${b.selected_session.time_end}` : null,
            session_location: b.selected_session?.location ?? null,
            selected_variant: b.selected_variant ?? null,
            purchase_type: b.purchase_type ?? 'workshop',
            order_notes: b.order_notes ?? null,
            quantity: b.quantity,
            price: b.price,
            status: b.status,
            ticket: b.ticket_code,
          }))}
        />
      </main>
    </>
  );
}
