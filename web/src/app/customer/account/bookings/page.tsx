import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { listCustomerBookings } from '@/lib/db';
import CustomerBookingsClient from './CustomerBookingsClient';

export const dynamic = 'force-dynamic';

export default async function CustomerBookingsPage() {
  const session = await getSession();
  if (!session || session.role !== 'customer') redirect('/auth/login?next=/customer/account/bookings');

  const bookings = await listCustomerBookings(session.id);

  return (
    <main className="mx-auto max-w-4xl px-4 py-8 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-200/80 pb-4">
        <div>
          <h1 className="font-serif text-3xl font-bold text-brand-900">Cultural experiences & workshops</h1>
          <p className="mt-1 text-sm text-stone-600">
            Your admission tickets, scheduled sessions, and live venue navigation for in-person heritage workshops.
          </p>
        </div>
      </div>

      <CustomerBookingsClient initial={bookings} customerName={session.name} />
    </main>
  );
}
