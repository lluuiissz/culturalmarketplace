import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { updateBookingStatus, logActivity, pushNotification, getOrderItem, getOrder } from '@/lib/db';

export async function POST(req: Request) {
  const session = await getSession();
  if (!session || session.role !== 'admin') return NextResponse.json({ status: 'error' }, { status: 401 });

  const { order_item_id, status } = (await req.json()) as { order_item_id: number; status: 'cancelled' | 'no_show' | 'pending' };
  if (!order_item_id || !['cancelled', 'no_show', 'pending'].includes(status)) {
    return NextResponse.json({ status: 'error', message: 'Invalid input.' }, { status: 400 });
  }

  await updateBookingStatus(order_item_id, status);
  const item = await getOrderItem(order_item_id);
  if (item) {
    const order = await getOrder(item.order_id);
    if (order) {
      await pushNotification({
        userId: order.customer_id, role: 'customer', type: 'booking_update',
        message: status === 'cancelled'
          ? `❌ Your booking for '${item.product_name}' was cancelled by the marketplace. Contact support for details.`
          : status === 'no_show'
            ? `⚠️ You were marked absent for '${item.product_name}'.`
            : `Your booking for '${item.product_name}' was reopened.`,
      });
    }
  }
  await logActivity({ userId: session.id, role: 'admin', userName: session.name, action: 'booking_update', description: `Admin set booking #${order_item_id} to ${status}` });
  return NextResponse.json({ status: 'success' });
}
