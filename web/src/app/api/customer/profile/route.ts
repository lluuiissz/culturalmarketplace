import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { updateCustomerProfile } from '@/lib/db';

export async function POST(req: Request) {
  const session = await getSession();
  if (!session || session.role !== 'customer') return NextResponse.json({ status: 'error' }, { status: 401 });

  const body = (await req.json()) as { name?: string; phone?: string; location?: string; bio?: string };
  await updateCustomerProfile(session.id, body);
  return NextResponse.json({ status: 'success' });
}
