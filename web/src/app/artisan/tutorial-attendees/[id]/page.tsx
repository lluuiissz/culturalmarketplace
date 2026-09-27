import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { getSession } from '@/lib/auth';
import { getProduct, listAttendees } from '@/lib/db';
import AttendeesClient from './AttendeesClient';

export const dynamic = 'force-dynamic';

export default async function TutorialAttendeesPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || session.role !== 'artisan') redirect('/auth/login?next=/artisan/experiences');
  const { id } = await params;

  const product = await getProduct(Number(id));
  if (!product || product.artisan_id !== session.id) notFound();
  const attendees = await listAttendees(session.id, product.id);

  return (
    <>
      <main className="mx-auto max-w-3xl px-4 py-10">
        <Link href="/artisan/bookings" className="text-sm font-medium text-brand-700 hover:underline">← Back to bookings</Link>
        <h1 className="font-serif text-3xl font-bold text-brand-900 mt-2">Attendees — {product.name}</h1>
        <AttendeesClient
          initial={attendees.map((b) => ({
            order_item_id: b.order_item_id, customer: b.customer_name,
            attendee: b.attendee_name, ticket: b.ticket_code, status: b.status,
          }))}
        />
      </main>
    </>
  );
}
