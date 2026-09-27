import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { sql, usingPg } from '@/lib/dbPg';
import { pushNotification, logActivity } from '@/lib/db';

// Admin moderation queue actions on products flagged by the upload pipeline:
//   approve -> status back to active (visible to buyers)
//   reject  -> status inactive + artisan notified with the reason
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ status: 'error', message: 'Unauthorized' }, { status: 401 });
  }
  const { id } = await params;
  const productId = Number(id);
  if (!Number.isInteger(productId)) {
    return NextResponse.json({ status: 'error', message: 'Invalid product.' }, { status: 400 });
  }

  const { action, reason } = (await req.json()) as { action?: 'approve' | 'reject'; reason?: string };
  if (action !== 'approve' && action !== 'reject') {
    return NextResponse.json({ status: 'error', message: 'Invalid action.' }, { status: 400 });
  }

  if (!usingPg) {
    return NextResponse.json({ status: 'error', message: 'Moderation queue needs the real database (demo store has no uploads).' }, { status: 400 });
  }

  const rows = await sql`select id, name, artisan_id, status from products where id = ${productId} limit 1`;
  const product = rows[0] as { id: number; name: string; artisan_id: number; status: string } | undefined;
  if (!product) {
    return NextResponse.json({ status: 'error', message: 'Product not found.' }, { status: 404 });
  }

  if (action === 'approve') {
    await sql`update products set status = 'active' where id = ${productId}`;
    await pushNotification({ userId: product.artisan_id, role: 'artisan', type: 'moderation', message: `Good news — the photo on “${product.name}” passed review and your product is now live.` });
    await logActivity({ userId: session.id, role: 'admin', userName: session.name, action: 'moderation_approve', description: `Admin approved media for product #${productId}` });
    return NextResponse.json({ status: 'success', new_status: 'active' });
  }

  const why = (reason ?? '').trim() || 'The product photo did not meet our content guidelines. Please upload clear photos of the actual handicraft.';
  await sql`update products set status = 'inactive' where id = ${productId}`;
  await pushNotification({ userId: product.artisan_id, role: 'artisan', type: 'moderation', message: `Your photo on “${product.name}” was not approved: ${why} You can upload a new photo any time.` });
  await logActivity({ userId: session.id, role: 'admin', userName: session.name, action: 'moderation_reject', description: `Admin rejected media for product #${productId}: ${why}` });
  return NextResponse.json({ status: 'success', new_status: 'inactive' });
}
