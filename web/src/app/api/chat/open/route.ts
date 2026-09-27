import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { openConversation, getProduct } from '@/lib/db';

export async function POST(req: Request) {
  const session = await getSession();
  if (!session || session.role !== 'customer') {
    return NextResponse.json({ status: 'error', message: 'Please sign in as a customer to chat with artisans.' }, { status: 401 });
  }
  const { product_id } = (await req.json()) as { product_id?: number };
  const product = await getProduct(Number(product_id));
  if (!product) return NextResponse.json({ status: 'error', message: 'Product not found.' }, { status: 404 });

  const conversationId = await openConversation(session.id, product.artisan_id, product.id);
  return NextResponse.json({ status: 'success', conversation_id: conversationId });
}
