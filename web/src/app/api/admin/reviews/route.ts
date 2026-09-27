import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { setReviewVisible, deleteReview, logActivity } from '@/lib/db';

export async function POST(req: Request) {
  const session = await getSession();
  if (!session || session.role !== 'admin') return NextResponse.json({ status: 'error' }, { status: 401 });

  const { item_id, action } = (await req.json()) as { item_id: number; action: 'toggle' | 'delete' };
  if (!item_id || !action) return NextResponse.json({ status: 'error', message: 'Invalid input.' }, { status: 400 });

  if (action === 'toggle') {
    // read current then flip
    const { listAllReviews } = await import('@/lib/db');
    const review = (await listAllReviews()).find((r) => r.id === item_id);
    const visible = review ? !(review.review_visible ?? true) : false;
    await setReviewVisible(item_id, visible);
    await logActivity({ userId: session.id, role: 'admin', userName: session.name, action: 'review_toggle', description: `Admin ${visible ? 'showed' : 'hid'} review on order item #${item_id}` });
  } else if (action === 'delete') {
    await deleteReview(item_id);
    await logActivity({ userId: session.id, role: 'admin', userName: session.name, action: 'review_delete', description: `Admin deleted review on order item #${item_id}` });
  } else {
    return NextResponse.json({ status: 'error', message: 'Unknown action.' }, { status: 400 });
  }
  return NextResponse.json({ status: 'success' });
}
