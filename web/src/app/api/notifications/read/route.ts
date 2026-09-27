import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { markNotificationsRead } from '@/lib/db';

export async function POST() {
  const session = await getSession();
  if (!session) return NextResponse.json({ status: 'error' }, { status: 401 });
  await markNotificationsRead(session.id, session.role);
  return NextResponse.json({ status: 'success' });
}
