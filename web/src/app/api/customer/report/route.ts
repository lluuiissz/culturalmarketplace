import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { createReport } from '@/lib/db';

export async function POST(req: Request) {
  const session = await getSession();
  if (!session || session.role !== 'customer') return NextResponse.json({ status: 'error' }, { status: 401 });

  const { reported_type, reported_id, reason } = (await req.json()) as {
    reported_type?: 'product' | 'artisan' | 'experience'; reported_id?: number; reason?: string;
  };
  if (!reported_type || !['product', 'artisan', 'experience'].includes(reported_type) || !reported_id || !reason?.trim()) {
    return NextResponse.json({ status: 'error', message: 'Please choose what you are reporting and describe the issue.' }, { status: 400 });
  }
  if (reason.trim().length < 10) {
    return NextResponse.json({ status: 'error', message: 'Please provide at least a sentence of detail (10+ characters).' }, { status: 400 });
  }

  await createReport({
    reporterId: session.id,
    reportedType: reported_type,
    reportedId: reported_id,
    reason: reason.trim(),
    reporterName: session.name,
  });
  return NextResponse.json({ status: 'success', message: 'Report submitted. Our team will review it shortly.' });
}
