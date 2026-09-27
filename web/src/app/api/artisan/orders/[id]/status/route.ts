import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { updateOrderItemStatus, getOrderItem, getOrder, pushNotification } from '@/lib/db';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || session.role !== 'artisan') {
    return NextResponse.json({ status: 'error' }, { status: 401 });
  }
  const { id } = await params;
  const { status } = (await req.json()) as { status?: string };
  const allowed = ['preparing', 'ready_to_ship', 'shipped', 'cancelled', 'no_show', 'received'];
  if (!status || !allowed.includes(status)) {
    return NextResponse.json({ status: 'error', message: 'Invalid status.' }, { status: 400 });
  }

  const item = await getOrderItem(Number(id));
  if (!item || item.artisan_id !== session.id) {
    return NextResponse.json({ status: 'error', message: 'Order item not found.' }, { status: 404 });
  }

  await updateOrderItemStatus(item.id, status);
  const order = await getOrder(item.order_id);
  if (order) {
    const msgs: Record<string, string> = {
      preparing: `⏳ The artisan is now preparing your order for '${item.product_name}'.`,
      ready_to_ship: `📦 Your order for '${item.product_name}' is packed and ready to ship!`,
      shipped: `🚚 Good news! Your order for '${item.product_name}' has been shipped.`,
      cancelled: `❌ Your order for '${item.product_name}' has been cancelled by the artisan.`,
      no_show: `⚠️ You were marked absent for '${item.product_name}'. Please contact support.`,
      received: `✅ Your order for '${item.product_name}' was marked received.`,
    };
    await pushNotification({
      userId: order.customer_id, role: 'customer', type: 'order_update',
      message: msgs[status] ?? `Order update for '${item.product_name}'.`,
      data: { order_item_id: item.id, order_id: order.id },
    });
  }
  return NextResponse.json({ status: 'success' });
}
