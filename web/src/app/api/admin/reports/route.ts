import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import {
  updateReport, suspendProduct, suspendArtisanAccount, getProduct, getArtisan, logActivity, pushNotification,
} from '@/lib/db';

export async function POST(req: Request) {
  const session = await getSession();
  if (!session || session.role !== 'admin') return NextResponse.json({ status: 'error' }, { status: 401 });

  const body = (await req.json()) as {
    report_id: number; action: 'investigate' | 'resolve' | 'warn' | 'suspend-listing' | 'suspend-account';
    action_taken?: string;
  };
  const { report_id, action } = body;
  if (!report_id || !action) return NextResponse.json({ status: 'error', message: 'Invalid input.' }, { status: 400 });

  // Fetch report via listReports to avoid a new single-row fn
  const { listReports } = await import('@/lib/db');
  const report = (await listReports()).find((r) => r.id === report_id);
  if (!report) return NextResponse.json({ status: 'error', message: 'Report not found.' }, { status: 404 });

  let note = '';
  if (action === 'investigate') {
    await updateReport(report_id, { status: 'investigating' });
    note = 'Status set to investigating';
  } else if (action === 'resolve') {
    await updateReport(report_id, { status: 'resolved', action_taken: body.action_taken ?? 'Resolved by admin' });
    note = 'Report resolved';
  } else if (action === 'warn') {
    // Notify the reported party
    if (report.reported_type === 'artisan') {
      await pushNotification({ userId: report.reported_id, role: 'artisan', type: 'warning', message: `⚠️ A warning was issued regarding your account: ${report.reason.slice(0, 140)}` });
    } else {
      await pushNotification({ userId: report.reporter_id, role: 'customer', type: 'warning', message: '⚠️ A report you filed is under review. Thank you for keeping the marketplace safe.' });
    }
    await updateReport(report_id, { status: 'investigating', action_taken: 'Warning sent' });
    note = 'Warning sent';
  } else if (action === 'suspend-listing') {
    if (report.reported_type === 'product') {
      await suspendProduct(report.reported_id);
      await updateReport(report_id, { status: 'resolved', action_taken: 'Listing suspended' });
      note = 'Listing suspended';
    } else {
      return NextResponse.json({ status: 'error', message: 'Only product reports can suspend a listing.' }, { status: 400 });
    }
  } else if (action === 'suspend-account') {
    if (report.reported_type === 'artisan') {
      await suspendArtisanAccount(report.reported_id);
      await updateReport(report_id, { status: 'resolved', action_taken: 'Account suspended' });
      note = 'Account suspended';
    } else {
      return NextResponse.json({ status: 'error', message: 'Only artisan reports can suspend an account.' }, { status: 400 });
    }
  }

  await logActivity({ userId: session.id, role: 'admin', userName: session.name, action: 'report_moderation', description: `Admin ${session.name} moderated report #${report_id}: ${note}` });
  return NextResponse.json({ status: 'success', note });
}
