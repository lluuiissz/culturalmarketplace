import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getProduct } from '@/lib/db';
import { registerNfcTag, activateNfcTag, clearNfcTag } from '@/lib/adminDb';
import { logActivity } from '@/lib/db';

// Artisan NFC tag lifecycle on their OWN product:
//   register  -> system generates the tag ID, status `awaiting_write`
//   activate  -> called after NfcWriter's read-back confirms the card carries
//                the right URL; flips status to `active`
//   replace   -> overwrite with a new generated ID (card lost/damaged)
// Ownership is enforced against the session artisan; admins go through
// /api/admin/nfc.
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || session.role !== 'artisan') {
    return NextResponse.json({ status: 'error', message: 'Please sign in as an artisan.' }, { status: 401 });
  }
  const { id } = await params;
  const productId = Number(id);
  if (!Number.isInteger(productId)) {
    return NextResponse.json({ status: 'error', message: 'Invalid product.' }, { status: 400 });
  }

  const product = await getProduct(productId);
  if (!product) {
    return NextResponse.json({ status: 'error', message: 'Product not found.' }, { status: 404 });
  }
  if (product.artisan_id !== session.id) {
    return NextResponse.json({ status: 'error', message: 'This is not your product.' }, { status: 403 });
  }

  const { action } = (await req.json()) as { action?: 'register' | 'activate' | 'replace' };

  if (action === 'register') {
    if (product.nfc_tag_id) {
      return NextResponse.json({ status: 'error', message: 'This product already has an NFC tag. Use “Replace tag” instead.' }, { status: 409 });
    }
    const result = await registerNfcTag(productId);
    if ('error' in result) {
      return NextResponse.json({ status: 'error', message: result.error }, { status: 500 });
    }
    await logActivity({ userId: session.id, role: 'artisan', userName: session.name, action: 'nfc_register', description: `Artisan registered NFC tag ${result.tagId} on product #${productId}` });
    return NextResponse.json({ status: 'success', tag_id: result.tagId, nfc_tag_status: 'awaiting_write' });
  }

  if (action === 'activate') {
    if (!product.nfc_tag_id) {
      return NextResponse.json({ status: 'error', message: 'Register a tag first.' }, { status: 400 });
    }
    const ok = await activateNfcTag(productId, product.nfc_tag_id);
    if (!ok) {
      return NextResponse.json({ status: 'error', message: 'Could not activate the tag.' }, { status: 500 });
    }
    await logActivity({ userId: session.id, role: 'artisan', userName: session.name, action: 'nfc_activate', description: `Artisan activated NFC tag ${product.nfc_tag_id} on product #${productId}` });
    return NextResponse.json({ status: 'success', nfc_tag_status: 'active' });
  }

  if (action === 'replace') {
    // Re-generate a fresh tag and return it for writing to the new card.
    await clearNfcTag(productId);
    const result = await registerNfcTag(productId);
    if ('error' in result) {
      return NextResponse.json({ status: 'error', message: result.error }, { status: 500 });
    }
    await logActivity({ userId: session.id, role: 'artisan', userName: session.name, action: 'nfc_replace', description: `Artisan replaced NFC tag on product #${productId} with ${result.tagId}` });
    return NextResponse.json({ status: 'success', tag_id: result.tagId, nfc_tag_status: 'awaiting_write' });
  }

  return NextResponse.json({ status: 'error', message: 'Invalid action.' }, { status: 400 });
}
