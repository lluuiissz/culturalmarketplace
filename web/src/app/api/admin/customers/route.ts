import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { updateCustomer, deleteCustomer, toggleCustomerStatus, logActivity } from '@/lib/db';

async function requireAdmin() {
  const s = await getSession();
  if (!s || s.role !== 'admin') return null;
  return s;
}

export async function POST(req: Request) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ status: 'error' }, { status: 401 });

  const { action, id, ...fields } = (await req.json()) as { action: string; id: number; [k: string]: unknown };

  if (action === 'update') {
    await updateCustomer(id, fields as { name?: string; email?: string; phone?: string; location?: string });
    await logActivity({ userId: session.id, role: 'admin', userName: session.name, action: 'customer_update', description: `Admin updated customer #${id}` });
  } else if (action === 'delete') {
    await deleteCustomer(id);
    await logActivity({ userId: session.id, role: 'admin', userName: session.name, action: 'customer_delete', description: `Admin deleted customer #${id}` });
  } else if (action === 'toggle') {
    await toggleCustomerStatus(id);
    await logActivity({ userId: session.id, role: 'admin', userName: session.name, action: 'customer_toggle', description: `Admin toggled status of customer #${id}` });
  } else {
    return NextResponse.json({ status: 'error', message: 'Unknown action.' }, { status: 400 });
  }
  return NextResponse.json({ status: 'success' });
}
