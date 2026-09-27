import { getSession } from '@/lib/auth';
import { listAllShipments } from '@/lib/shipments';

// CSV export of all shipments (admin).
export async function GET() {
  const session = await getSession();
  if (!session || session.role !== 'admin') {
    return new Response('Unauthorized', { status: 401 });
  }
  const shipments = await listAllShipments();
  const esc = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const lines = [
    'id,tracking,courier,status,order_id,sender,recipient,items,weight_kg,declared_value,created_at',
    ...shipments.map((s) =>
      [s.id, s.tracking_number, s.courier_name, s.status, s.order_id, s.sender_name, s.recipient_name, s.items_summary, s.weight_kg, s.declared_value, s.created_at]
        .map(esc).join(','),
    ),
  ];
  return new Response(lines.join('\n'), {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="shipments-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
