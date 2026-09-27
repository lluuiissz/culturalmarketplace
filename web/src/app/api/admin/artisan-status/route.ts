import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { setArtisanStatus, logActivity, pushNotification } from '@/lib/db';

export async function POST(req: Request) {
  const session = await getSession();
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ status: 'error' }, { status: 401 });
  }
  const { artisan_id, status } = (await req.json()) as { artisan_id?: number; status?: string };
  const allowed = ['approved', 'rejected', 'suspended', 'pending'] as const;
  if (!artisan_id || !status || !allowed.includes(status as (typeof allowed)[number])) {
    return NextResponse.json({ status: 'error', message: 'Invalid input.' }, { status: 400 });
  }

  await setArtisanStatus(Number(artisan_id), status as 'approved' | 'rejected' | 'suspended' | 'pending');
  await pushNotification({
    userId: Number(artisan_id), role: 'artisan', type: 'verification_update',
    message: status === 'approved'
      ? '🎉 Congratulations! Your artisan account has been approved. You can now list your crafts.'
      : `Your artisan account status changed to: ${status}.`,
  });
  await logActivity({
    userId: session.id, role: 'admin', userName: session.name, action: 'artisan_status_update',
    description: `Admin ${session.name} set artisan #${artisan_id} status to ${status}`,
  });
  return NextResponse.json({ status: 'success' });
}
