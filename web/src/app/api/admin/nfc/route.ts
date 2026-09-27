import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { setNfcTagStatus, replaceNfcTag, registerNfcTag, clearNfcTag } from '@/lib/adminDb';
import { logActivity } from '@/lib/db';

export async function POST(req: Request) {
  const session = await getSession();
  if (!session || session.role !== 'admin') return NextResponse.json({ status: 'error' }, { status: 401 });

  const { product_id, action, status, new_tag_id } = (await req.json()) as {
    product_id: number; action: 'status' | 'replace' | 'register' | 'clear'; status?: 'active' | 'inactive' | 'lost'; new_tag_id?: string;
  };
  if (!product_id || !action) return NextResponse.json({ status: 'error', message: 'Invalid input.' }, { status: 400 });

  if (action === 'status' && status) {
    await setNfcTagStatus(product_id, status);
    await logActivity({ userId: session.id, role: 'admin', userName: session.name, action: 'nfc_status', description: `Admin set NFC status of product #${product_id} to ${status}` });
  } else if (action === 'register') {
    const result = await registerNfcTag(product_id);
    if ('error' in result) {
      return NextResponse.json({ status: 'error', message: result.error }, { status: 400 });
    }
    await logActivity({ userId: session.id, role: 'admin', userName: session.name, action: 'nfc_register', description: `Admin registered NFC tag ${result.tagId} on product #${product_id}` });
    return NextResponse.json({ status: 'success', tag_id: result.tagId, nfc_tag_status: 'awaiting_write' });
  } else if (action === 'clear') {
    await clearNfcTag(product_id);
    await logActivity({ userId: session.id, role: 'admin', userName: session.name, action: 'nfc_clear', description: `Admin cleared NFC tag of product #${product_id}` });
  } else if (action === 'replace' && new_tag_id?.trim()) {
    await replaceNfcTag(product_id, new_tag_id.trim());
    await logActivity({ userId: session.id, role: 'admin', userName: session.name, action: 'nfc_replace', description: `Admin replaced NFC tag of product #${product_id} with ${new_tag_id}` });
  } else {
    return NextResponse.json({ status: 'error', message: 'Invalid action.' }, { status: 400 });
  }
  return NextResponse.json({ status: 'success' });
}
