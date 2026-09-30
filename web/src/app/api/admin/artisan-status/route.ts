import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { setArtisanStatus, logActivity, pushNotification } from '@/lib/db';

// Admin approve/reject/suspend for artisans. The status change itself is the
// critical operation; notification + audit log are wrapped so a failure there
// can never leave the decision unrecorded or return a confusing 500.
export async function POST(req: Request) {
  const session = await getSession();
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ status: 'error' }, { status: 401 });
  }
  let body: { artisan_id?: number; status?: string; rule_snapshot?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ status: 'error', message: 'Invalid request.' }, { status: 400 });
  }
  const { artisan_id, status, rule_snapshot } = body;
  const allowed = ['approved', 'rejected', 'suspended', 'pending'] as const;
  if (!artisan_id || !status || !allowed.includes(status as (typeof allowed)[number])) {
    return NextResponse.json({ status: 'error', message: 'Invalid input.' }, { status: 400 });
  }

  await setArtisanStatus(Number(artisan_id), status as 'approved' | 'rejected' | 'suspended' | 'pending');

  const sideEffects = { notification: false, audit: false };
  try {
    await pushNotification({
      userId: Number(artisan_id), role: 'artisan', type: 'verification_update',
      message: status === 'approved'
        ? '🎉 Congratulations! Your artisan account has been approved. You can now list your crafts.'
        : `Your artisan account status changed to: ${status}.`,
    });
    sideEffects.notification = true;
  } catch (e) {
    console.error('[artisan-status] notification failed:', e instanceof Error ? e.message : e);
  }
  try {
    await logActivity({
      userId: session.id, role: 'admin', userName: session.name, action: 'artisan_status_update',
      description: `Admin ${session.name} set artisan #${artisan_id} status to ${status}${rule_snapshot ? ` [rules: ${rule_snapshot}]` : ''}`,
    });
    sideEffects.audit = true;
  } catch (e) {
    console.error('[artisan-status] audit log failed:', e instanceof Error ? e.message : e);
  }

  return NextResponse.json({ status: 'success', ...sideEffects });
}
