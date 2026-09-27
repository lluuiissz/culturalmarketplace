import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { updateOrderItemStatus } from '@/lib/db';

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || session.role !== 'customer') {
    return NextResponse.json({ status: 'error' }, { status: 401 });
  }
  const { id } = await params;
  await updateOrderItemStatus(Number(id), 'received');
  return NextResponse.json({ status: 'success' });
}
