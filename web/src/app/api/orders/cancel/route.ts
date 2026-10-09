import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { cancelOrderCustomer } from '@/lib/db';

export async function POST(req: Request) {
  const session = await getSession();
  if (!session || session.role !== 'customer') {
    return NextResponse.json({ status: 'error', message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { order_id, reason } = (await req.json()) as { order_id?: number; reason?: string };
    if (!order_id) {
      return NextResponse.json({ status: 'error', message: 'order_id is required.' }, { status: 400 });
    }

    const res = await cancelOrderCustomer(Number(order_id), session.id, reason);
    if (!res.success) {
      return NextResponse.json({ status: 'error', message: res.message }, { status: 422 });
    }

    return NextResponse.json({ status: 'success', message: res.message });
  } catch (e) {
    return NextResponse.json(
      { status: 'error', message: e instanceof Error ? e.message : 'Could not cancel order.' },
      { status: 500 }
    );
  }
}
