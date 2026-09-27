import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getOrder, getOrderItems, updateOrderStatus, pushNotification, logActivity } from '@/lib/db';

export async function POST(req: Request) {
  const session = await getSession();
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ status: 'error' }, { status: 401 });
  }
  const { order_id, decision } = (await req.json()) as { order_id?: number; decision?: 'verify' | 'fail' };
  if (!order_id || !decision) {
    return NextResponse.json({ status: 'error', message: 'Invalid input.' }, { status: 400 });
  }

  const order = await getOrder(Number(order_id));
  if (!order) return NextResponse.json({ status: 'error', message: 'Order not found.' }, { status: 404 });

  if (decision === 'verify') {
    await updateOrderStatus(order.id, 'paid');
    const items = await getOrderItems(order.id);
    const artisanIds = [...new Set(items.map((i) => i.artisan_id))];
    for (const aid of artisanIds) {
      await pushNotification({
        userId: aid, role: 'artisan', type: 'new_order',
        message: `New paid order #${order.id}! Items: ${items.map((i) => i.product_name).join(', ')}. Payment verified by admin.`,
        data: { order_id: order.id },
      });
    }
    await pushNotification({
      userId: order.customer_id, role: 'customer', type: 'payment_confirmed',
      message: `✅ Your GCash payment for order #${order.id} was verified. Artisans are preparing your items!`,
    });
  } else {
    await updateOrderStatus(order.id, 'payment_failed');
    await pushNotification({
      userId: order.customer_id, role: 'customer', type: 'payment_failed',
      message: `⚠️ Payment for order #${order.id} could not be verified. Please try again or contact support.`,
    });
  }

  await logActivity({
    userId: session.id, role: 'admin', userName: session.name, action: 'payment_verification',
    description: `Admin ${session.name} ${decision === 'verify' ? 'verified' : 'failed'} payment for order #${order.id}`,
  });
  return NextResponse.json({ status: 'success' });
}
