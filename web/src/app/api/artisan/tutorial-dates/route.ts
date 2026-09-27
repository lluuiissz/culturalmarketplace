import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { saveTutorialDates, getProduct } from '@/lib/db';
import type { TutorialDate } from '@/lib/types';

export async function POST(req: Request) {
  const session = await getSession();
  if (!session || session.role !== 'artisan') return NextResponse.json({ status: 'error' }, { status: 401 });

  const { product_id, dates } = (await req.json()) as { product_id?: number; dates?: TutorialDate[] };
  if (!product_id || !Array.isArray(dates)) {
    return NextResponse.json({ status: 'error', message: 'Invalid input.' }, { status: 400 });
  }
  const product = await getProduct(product_id);
  if (!product || product.artisan_id !== session.id) {
    return NextResponse.json({ status: 'error', message: 'Product not found.' }, { status: 404 });
  }
  await saveTutorialDates(session.id, product_id, dates);
  return NextResponse.json({ status: 'success' });
}
