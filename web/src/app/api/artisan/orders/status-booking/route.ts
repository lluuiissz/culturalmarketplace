import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { updateBookingStatus, listBookings, pushNotification, getOrder, getOrderItem } from '@/lib/db';

export async function POST(req: Request) {
  const session = await getSession();
  if (!session || session.role !== 'artisan') return NextResponse.json({ status: 'error' }, { status: 401 });

  const { order_item_id, status } = (await req.json()) as { order_item_id?: number; status?: string };
  if (!order_item_id || !['cancelled', 'no_show', 'pending'].includes(status ?? '')) {
    return NextResponse.json({ status: 'error', message: 'Invalid input.' }, { status: 400 });
  }

  const mine = await listBookings(session.id);
  if (!mine.some((b) => b.order_item_id === order_item_id)) {
    return NextResponse.json({ status: 'error', message: 'Booking not found.' }, { status: 404 });
  }

  await updateBookingStatus(order_item_id, status!);
  const item = await getOrderItem(order_item_id);
  if (item) {
    const order = await getOrder(item.order_id);
    if (order) {
      await pushNotification({
        userId: order.customer_id, role: 'customer', type: 'booking_update',
        message: status === 'cancelled'
          ? `❌ Your booking for '${item.product_name}' was cancelled by the artisan.`
          : status === 'no_show'
            ? `⚠️ You were marked absent for '${item.product_name}'.`
            : `Your booking for '${item.product_name}' was reopened.`,
      });
    }
  }
  return NextResponse.json({ status: 'success' });
}
