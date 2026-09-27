import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { listCustomerOrders, getOrderItemsForOrders } from '@/lib/db';
import { listShipmentsForCustomer } from '@/lib/shipments';
import OrdersClient from './OrdersClient';

export const dynamic = 'force-dynamic';

export default async function CustomerOrdersPage() {
  const session = await getSession();
  if (!session || session.role !== 'customer') redirect('/auth/login?next=/customer/account/orders');

  const orders = await listCustomerOrders(session.id);
  // Parallel: items + shipments fetched together (LCP — each round-trip is ~100ms
  // to Supabase and these are independent).
  const [itemsByOrder, shipments] = await Promise.all([
    getOrderItemsForOrders(orders.map((o) => o.id)),
    listShipmentsForCustomer(session.id),
  ]);
  const trackingByItem = new Map(shipments.map((s) => [s.order_item_id, s]));
  const withItems = orders.map((o) => ({ order: o, items: itemsByOrder.get(o.id) ?? [] }));

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
              return { id: i.id, name: i.product_name, qty: i.quantity, status: i.status, price: Number(i.price), rating: i.review_rating, tracking: sh?.tracking_number ?? i.tracking_number ?? null, courier: sh?.courier_name ?? i.courier_name ?? null };
            }),
          }))}
        />
      </main>
    </>
  );
}
