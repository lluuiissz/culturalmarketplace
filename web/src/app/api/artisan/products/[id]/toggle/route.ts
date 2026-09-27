import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { toggleProductStatus } from '@/lib/db';

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || session.role !== 'artisan') {
    return NextResponse.json({ status: 'error' }, { status: 401 });
  }
  const { id } = await params;
  await toggleProductStatus(session.id, Number(id));
  return NextResponse.json({ status: 'success' });
}
