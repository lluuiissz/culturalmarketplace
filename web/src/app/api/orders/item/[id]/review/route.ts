import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { updateOrderItemReview, getOrderItem, getOrder, pushNotification } from '@/lib/db';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || session.role !== 'customer') return NextResponse.json({ status: 'error' }, { status: 401 });

  const { id } = await params;
  const { rating, comment } = (await req.json()) as { rating?: number; comment?: string };
  if (!rating || rating < 1 || rating > 5) {
    return NextResponse.json({ status: 'error', message: 'Please choose a star rating.' }, { status: 400 });
  }

  const item = await getOrderItem(Number(id));
  if (!item) return NextResponse.json({ status: 'error', message: 'Order item not found.' }, { status: 404 });
  const order = await getOrder(item.order_id);
  if (!order || order.customer_id !== session.id) {
    return NextResponse.json({ status: 'error', message: 'Not your order.' }, { status: 403 });
  }
  if (item.review_rating != null) {
    return NextResponse.json({ status: 'error', message: 'Already reviewed.' }, { status: 400 });
  }

  await updateOrderItemReview(item.id, Math.round(rating), comment?.trim() ?? null);
  await pushNotification({
    userId: item.artisan_id, role: 'artisan', type: 'new_review',
    message: `⭐ ${session.name} left a ${rating}-star review on '${item.product_name}'.`,
  });
  return NextResponse.json({ status: 'success' });
}
