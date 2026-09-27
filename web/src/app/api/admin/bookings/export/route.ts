import { getSession } from '@/lib/auth';
import { listBookings } from '@/lib/db';

function csvCell(v: unknown): string {
  const s = v == null ? '' : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== 'admin') {
    return new Response('Unauthorized', { status: 401 });
  }
  const bookings = await listBookings();
  const header = ['booking_item_id', 'order_id', 'customer', 'product', 'attendee_name', 'attendee_contact', 'session_date', 'session_time', 'quantity', 'price', 'status', 'ticket_code'];
  const lines = [header.join(',')];
  for (const b of bookings) {
    lines.push([
      b.order_item_id, b.order_id, b.customer_name, b.product_name, b.attendee_name, b.attendee_contact,
      b.selected_session?.date ?? '', `${b.selected_session?.time_start ?? ''}-${b.selected_session?.time_end ?? ''}`,
      b.quantity, b.price.toFixed(2), b.status, b.ticket_code,
    ].map(csvCell).join(','));
  }
  return new Response(lines.join('\n'), {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="bookings-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
