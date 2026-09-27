import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getOrder, getOrderItems, setOrderPayment, pushNotification } from '@/lib/db';

export async function POST(_req: Request, { params }: { params: Promise<{ orderId: string }> }) {
  const session = await getSession();
  if (!session || session.role !== 'customer') {
    return NextResponse.json({ status: 'error' }, { status: 401 });
  }
  const { orderId } = await params;
  const order = await getOrder(Number(orderId));
  if (!order || order.customer_id !== session.id) {
    return NextResponse.json({ status: 'error', message: 'Order not found.' }, { status: 404 });
  }

  const reference = `SIM-${Date.now()}`;
  await setOrderPayment(order.id, { reference, status: 'paid' });

  // Notify artisans now that payment is (simulated as) confirmed
  const items = await getOrderItems(order.id);
  const artisanIds = [...new Set(items.map((i) => i.artisan_id))];
  for (const aid of artisanIds) {
    await pushNotification({
      userId: aid, role: 'artisan', type: 'new_order',
      message: `New paid order #${order.id} from ${session.name}! Items: ${items.map((i) => i.product_name).join(', ')}. Payment: GCash.`,
      data: { order_id: order.id, customer_name: session.name },
    });
  }

  return NextResponse.json({ status: 'success', reference });
}
