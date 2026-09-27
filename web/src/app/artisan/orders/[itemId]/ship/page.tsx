import { notFound, redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { listArtisanOrders, getArtisan } from '@/lib/db';
import { getShipmentByOrderItem } from '@/lib/shipments';
import ShipWizard from './ShipWizard';

export const dynamic = 'force-dynamic';

export default async function ShipOrderItemPage({ params }: { params: Promise<{ itemId: string }> }) {
  const session = await getSession();
  if (!session || session.role !== 'artisan') redirect('/auth/login?next=/artisan/orders');
  const { itemId } = await params;

  const item = (await listArtisanOrders(session.id)).find((i) => i.id === Number(itemId));
  if (!item || !item.order) notFound();
  if (item.purchase_type === 'workshop') notFound();

  const existing = await getShipmentByOrderItem(item.id);
  const artisan = await getArtisan(session.id);

  return (
    <>
      <main className="mx-auto max-w-2xl px-4 py-10">
        <h1 className="font-serif text-3xl font-bold text-brand-900">Book a J&T shipment</h1>
        <p className="mt-1 text-stone-500">
          {item.product_name} × {item.quantity} · Order #{item.order_id}
        </p>
        <ShipWizard
          orderItemId={item.id}
          item={{
            name: item.product_name,
            quantity: item.quantity,
            variant: item.selected_variant,
            unitPrice: Number(item.price),
          }}
          shippingAddress={item.order.shipping_address ?? ''}
          customerName={item.customer_name ?? 'Customer'}
          declaredValue={Number(item.price) * item.quantity}
          prefill={{
            senderName: artisan?.business_name || artisan?.name || session.name,
            senderPhone: artisan?.phone ?? '',
            senderAddress: artisan?.location ?? '',
          }}
          existingTracking={existing?.tracking_number ?? null}
        />
      </main>
    </>
  );
}
