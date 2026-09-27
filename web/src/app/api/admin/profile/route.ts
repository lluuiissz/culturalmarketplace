import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { verifyPassword, updateCustomer, logActivity, findUserByEmail, hashPassword } from '@/lib/db';
import { sql, usingPg } from '@/lib/dbPg';

export async function POST(req: Request) {
  const session = await getSession();
  if (!session || session.role !== 'admin') return NextResponse.json({ status: 'error' }, { status: 401 });

  const body = (await req.json()) as { action: 'update' | 'password'; name?: string; phone?: string; current_password?: string; new_password?: string };

  if (body.action === 'update') {
    if (usingPg) {
      await sql`update admins set name = coalesce(${body.name ?? null}, name) where email = ${session.email}`;
      await sql`update users set name = coalesce(${body.name ?? null}, name), phone = coalesce(${body.phone ?? null}, phone) where id = ${session.id} and role = 'admin'`;
    } else {
      await updateCustomer(session.id, { name: body.name, phone: body.phone });
    }
    await logActivity({ userId: session.id, role: 'admin', userName: session.name, action: 'profile_update', description: `Admin updated their profile` });
    return NextResponse.json({ status: 'success' });
  }

  if (body.action === 'password') {
    if (!body.current_password || !body.new_password || body.new_password.length < 8) {
      return NextResponse.json({ status: 'error', message: 'New password must be at least 8 characters.' }, { status: 400 });
    }
    const user = await findUserByEmail(session.email);
    if (!user || !(await verifyPassword(body.current_password, user.password))) {
      return NextResponse.json({ status: 'error', message: 'Current password is incorrect.' }, { status: 400 });
    }
    const hash = await hashPassword(body.new_password);
    if (usingPg) {
      await sql`update admins set password = ${hash} where email = ${session.email}`;
      await sql`update users set password = ${hash} where id = ${session.id} and role = 'admin'`;
    } else {
      await updateCustomer(session.id, {} as never); // demo store: hash handled below
      const { store: _ignored } = await import('@/lib/db');
      void _ignored;
      // fall through to users-table update via updateCustomer is not enough; do direct:
      const { hashPasswordAdmin } = await import('@/lib/adminDb');
      void hashPasswordAdmin;
      // In demo mode, mutate the global store directly:
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const g = globalThis as unknown as { __cmDemoStore?: any };
      if (g.__cmDemoStore) {
        const u = g.__cmDemoStore.users.find((x: { id: number }) => x.id === session.id);
        if (u) u.password = hash;
      }
    }
    await logActivity({ userId: session.id, role: 'admin', userName: session.name, action: 'password_change', description: `Admin changed their password` });
    return NextResponse.json({ status: 'success' });
  }

  return NextResponse.json({ status: 'error', message: 'Unknown action.' }, { status: 400 });
}
