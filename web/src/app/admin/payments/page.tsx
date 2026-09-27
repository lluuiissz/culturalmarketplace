import { listAllOrders, getOrderItemsForOrders } from '@/lib/db';
import PaymentsClient from './PaymentsClient';

export const dynamic = 'force-dynamic';

export default async function AdminPaymentsPage() {
  const all = await listAllOrders();
  const pending = all.filter((o) => o.status === 'awaiting_payment');
  // ONE batched items query (N+1 fix).
  const itemsByOrder = await getOrderItemsForOrders(pending.map((o) => o.id));
  const rows = pending.map((o) => ({
    id: o.id,
    total: Number(o.total_amount),
    reference: o.payment_reference,
    created: new Date(o.created_at).toLocaleString(),
    items: (itemsByOrder.get(o.id) ?? []).map((i) => `${i.product_name} ×${i.quantity}`),
  }));

  return (
    <div>
      <h1 className="font-serif text-2xl font-bold text-brand-900">Payment verification</h1>
      <p className="mt-1 text-sm text-stone-500">
        Simulated GCash payments are auto-confirmed in mock mode; PayMongo webhook verifications land here when PAYMENTS_MODE=paymongo.
      </p>
      <PaymentsClient initial={rows} />
    </div>
  );
}
