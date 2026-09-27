import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { listShipmentsForArtisan } from '@/lib/shipments';
import ShipmentsClient from './ShipmentsClient';

export const dynamic = 'force-dynamic';

export default async function ArtisanShipmentsPage() {
  const session = await getSession();
  if (!session || session.role !== 'artisan') redirect('/auth/login?next=/artisan/shipments');

  const shipments = await listShipmentsForArtisan(session.id);
  return (
    <>
      <main className="mx-auto max-w-4xl px-4 py-10">
        <h1 className="font-serif text-3xl font-bold text-brand-900">Shipments</h1>
        <p className="mt-1 text-stone-500">Parcels you booked with J&T Express.</p>
        <ShipmentsClient
          initial={shipments.map((s) => ({
            id: s.id, order_id: s.order_id, tracking: s.tracking_number, status: s.status,
            recipient: s.recipient_name, items: s.items_summary,
            weight: s.weight_kg, declared: s.declared_value,
            order_item_id: s.order_item_id,
            updated_at: s.updated_at,
          }))}
        />
      </main>
    </>
  );
}
