import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import {
  getOrderItem,
  getOrder,
  getOrderItems,
  updateOrderItemStatus,
  updateOrderStatus,
  pushNotification,
} from '@/lib/db';

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || session.role !== 'customer') {
    return NextResponse.json({ status: 'error', message: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const itemId = Number(id);
  if (!itemId || !Number.isInteger(itemId)) {
    return NextResponse.json({ status: 'error', message: 'Invalid item ID.' }, { status: 400 });
  }

  const item = await getOrderItem(itemId);
  if (!item) {
    return NextResponse.json({ status: 'error', message: 'Order item not found.' }, { status: 404 });
  }

  const order = await getOrder(item.order_id);
  if (!order || order.customer_id !== session.id) {
    return NextResponse.json({ status: 'error', message: 'Not authorized for this order.' }, { status: 403 });
  }

  if (item.status === 'received') {
    return NextResponse.json({ status: 'success', message: 'Item already marked as received.' });
  }

  if (item.status !== 'shipped') {
    return NextResponse.json(
      { status: 'error', message: `Cannot mark item as received while status is ${item.status}.` },
      { status: 400 }
    );
  }

  await updateOrderItemStatus(item.id, 'received');

  // If all items in this order are now received/cancelled, advance parent order status
  const allItems = await getOrderItems(order.id);
  const remainingNotDone = allItems.filter(
    (i) => i.id !== item.id && !['received', 'cancelled', 'attended'].includes(i.status)
  );
  if (remainingNotDone.length === 0) {
    await updateOrderStatus(order.id, 'received');
  }

  // Notify the artisan
  await pushNotification({
    userId: item.artisan_id,
    role: 'artisan',
    type: 'order_update',
    message: `✅ Customer ${session.name} has confirmed delivery and receipt of “${item.product_name}”.`,
    data: { order_item_id: item.id, order_id: order.id },
  });

  return NextResponse.json({ status: 'success' });
}
