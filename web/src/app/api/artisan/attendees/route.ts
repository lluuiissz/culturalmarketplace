import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { markAttendeePresent, getOrderItem } from '@/lib/db';

export async function POST(req: Request) {
  const session = await getSession();
  if (!session || session.role !== 'artisan') return NextResponse.json({ status: 'error' }, { status: 401 });

  const { order_item_id, present } = (await req.json()) as { order_item_id?: number; present?: boolean };
  if (!order_item_id || typeof present !== 'boolean') {
    return NextResponse.json({ status: 'error', message: 'Invalid input.' }, { status: 400 });
  }

  // Ownership check: the booking must belong to this artisan
  const item = await getOrderItem(order_item_id);
  if (!item || item.artisan_id !== session.id) {
    return NextResponse.json({ status: 'error', message: 'Booking not found.' }, { status: 404 });
  }

  await markAttendeePresent(order_item_id, present);
  return NextResponse.json({ status: 'success' });
}
