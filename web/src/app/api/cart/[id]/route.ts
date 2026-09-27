import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { updateCartQty, removeFromCart } from '@/lib/db';

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || session.role !== 'customer') {
    return NextResponse.json({ status: 'error' }, { status: 401 });
  }
  const { id } = await params;
  const body = (await req.json()) as { quantity?: number };
  await updateCartQty(session.id, Number(id), Math.max(1, Number(body.quantity) || 1));
  return NextResponse.json({ status: 'success' });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || session.role !== 'customer') {
    return NextResponse.json({ status: 'error' }, { status: 401 });
  }
  const { id } = await params;
  await removeFromCart(session.id, Number(id));
  return NextResponse.json({ status: 'success' });
}
