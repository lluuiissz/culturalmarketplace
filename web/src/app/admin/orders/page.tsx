import { listAllOrdersWithItems } from '@/lib/db';

export const dynamic = 'force-dynamic';

export default async function AdminOrdersPage() {
  const withItems = await listAllOrdersWithItems();
  const rows = withItems.map(({ order: o, items }) => ({
    id: o.id,
    customer_id: o.customer_id,
    total: Number(o.total_amount),
    status: o.status,
    method: o.payment_method,
    created: new Date(o.created_at).toLocaleString(),
    items: items.map((i) => `${i.product_name} ×${i.quantity}`),
  }));

  return (
    <div>
      <h1 className="font-serif text-2xl font-bold text-brand-900">All orders</h1>
      <div className="card mt-6 overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-stone-100 text-xs uppercase tracking-wide text-stone-400">
            <tr>
              <th className="px-4 py-3">Order</th>
              <th className="px-4 py-3">Items</th>
              <th className="px-4 py-3">Payment</th>
              <th className="px-4 py-3">Total</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-50">
            {rows.map((o) => (
              <tr key={o.id} className="hover:bg-brand-50/40">
                <td className="px-4 py-3">
                  <p className="font-semibold text-stone-700">#{o.id}</p>
                  <p className="text-xs text-stone-400">{o.created}</p>
                </td>
                <td className="px-4 py-3 text-stone-600">{o.items.join(', ') || '—'}</td>
                <td className="px-4 py-3">{o.method === 'gcash' ? '📱 GCash' : '💵 COD'}</td>
                <td className="px-4 py-3 font-semibold text-brand-700">₱{o.total.toFixed(2)}</td>
                <td className="px-4 py-3"><span className="badge bg-stone-100 capitalize text-stone-600">{o.status.replace(/_/g, ' ')}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 && <p className="p-6 text-sm text-stone-500">No orders.</p>}
      </div>
    </div>
  );
}
