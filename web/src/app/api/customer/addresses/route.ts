import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { createAddress, deleteAddress, setDefaultAddress } from '@/lib/db';

export async function POST(req: Request) {
  const session = await getSession();
  if (!session || session.role !== 'customer') return NextResponse.json({ status: 'error' }, { status: 401 });

  const body = (await req.json()) as {
    action: 'create' | 'delete' | 'set-default';
    id?: number; label?: string; full_name?: string; phone?: string; address?: string; landmark?: string; is_default?: boolean;
  };

  if (body.action === 'create') {
    if (!body.address?.trim()) return NextResponse.json({ status: 'error', message: 'Address is required.' }, { status: 400 });
    await createAddress({
      customer_id: session.id,
      label: body.label?.trim() || 'Home',
      full_name: body.full_name ?? session.name,
      phone: body.phone ?? null,
      address: body.address.trim(),
      landmark: body.landmark ?? null,
      is_default: Boolean(body.is_default),
    });
    return NextResponse.json({ status: 'success' });
  }
  if (body.action === 'delete' && body.id) {
    await deleteAddress(session.id, body.id);
    return NextResponse.json({ status: 'success' });
  }
  if (body.action === 'set-default' && body.id) {
    await setDefaultAddress(session.id, body.id);
    return NextResponse.json({ status: 'success' });
  }
  return NextResponse.json({ status: 'error', message: 'Unknown action.' }, { status: 400 });
}
