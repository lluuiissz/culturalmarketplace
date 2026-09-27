import { listAllShipments } from '@/lib/shipments';
import AdminShipmentsClient from './AdminShipmentsClient';

export const dynamic = 'force-dynamic';

export default async function AdminShipmentsPage() {
  const shipments = await listAllShipments();
  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-serif text-2xl font-bold text-brand-900">Shipments</h1>
        <a className="btn-outline" href="/api/admin/shipments/export" download>⬇ Export CSV</a>
      </div>
      <AdminShipmentsClient
        initial={shipments.map((s) => ({
          id: s.id, order_id: s.order_id, tracking: s.tracking_number, status: s.status,
          artisan: s.sender_name, recipient: s.recipient_name, items: s.items_summary,
          weight: s.weight_kg, declared: s.declared_value,
          created_at: s.created_at,
        }))}
      />
    </div>
  );
}
