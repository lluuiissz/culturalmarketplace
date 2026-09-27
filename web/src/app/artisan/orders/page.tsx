import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { listArtisanOrders } from '@/lib/db';
import { listShipmentsForArtisan } from '@/lib/shipments';
import ArtisanOrdersClient from './ArtisanOrdersClient';

export const dynamic = 'force-dynamic';

export default async function ArtisanOrdersPage() {
  const session = await getSession();
  if (!session || session.role !== 'artisan') redirect('/auth/login?next=/artisan/orders');

  // Parallel: orders + shipments fetched together (LCP — ~100ms per round-trip
  // to Supabase, and these are independent).
  const [orders, shipmentRows] = await Promise.all([
    listArtisanOrders(session.id),
    listShipmentsForArtisan(session.id),
  ]);
  const trackings = new Map<number, string>();
  for (const sh of shipmentRows) {
    trackings.set(sh.order_item_id, sh.tracking_number);
  }
  return (
    <>
      <main className="mx-auto max-w-4xl px-4 py-10">
        <h1 className="font-serif text-3xl font-bold text-brand-900">Orders</h1>
        <ArtisanOrdersClient
          initial={orders.map((o) => ({
            item_id: o.id,
            order_id: o.order_id,
            product_name: o.product_name,
            quantity: o.quantity,
            variant: o.selected_variant,
            customer: o.customer_name ?? 'Customer',
            payment: o.order?.payment_method ?? 'cash_on_delivery',
            status: o.status,
            purchase_type: o.purchase_type,
            tracking_number: trackings.get(o.id) ?? o.tracking_number ?? null,
          }))}
        />
      </main>
    </>
  );
}
