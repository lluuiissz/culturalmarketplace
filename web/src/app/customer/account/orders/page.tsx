import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { listCustomerOrdersWithItems } from '@/lib/db';
import { listShipmentsForCustomer } from '@/lib/shipments';
import OrdersClient from './OrdersClient';

export const dynamic = 'force-dynamic';

export default async function CustomerOrdersPage() {
  const session = await getSession();
  if (!session || session.role !== 'customer') redirect('/auth/login?next=/customer/account/orders');

  const [withItems, shipments] = await Promise.all([
    listCustomerOrdersWithItems(session.id),
    listShipmentsForCustomer(session.id),
  ]);
  const trackingByItem = new Map(shipments.map((s) => [s.order_item_id, s]));

  return (
    <>
      <main className="mx-auto max-w-4xl px-4 py-10">
        <h1 className="font-serif text-3xl font-bold text-brand-900">My orders</h1>
        <OrdersClient
          initial={withItems.map(({ order, items }) => ({
            id: order.id,
            status: order.status,
            method: order.payment_method,
            total: Number(order.total_amount),
            created_at: order.created_at,
            items: items.map((i) => {
              const sh = trackingByItem.get(i.id);
              return {
                id: i.id,
                product_id: i.product_id,
                name: i.product_name,
                qty: i.quantity,
                status: i.status,
                price: Number(i.price),
                rating: i.review_rating,
                tracking: sh?.tracking_number ?? i.tracking_number ?? null,
                courier: sh?.courier_name ?? i.courier_name ?? null,
                purchase_type: i.purchase_type ?? 'product',
                ticket_code: i.ticket_code ?? null,
                selected_session: i.selected_session ?? null,
                selected_variant: i.selected_variant ?? null,
                attendee_name: i.attendee_name ?? null,
              };
            }),
          }))}
        />
      </main>
    </>
  );
}
