import { NextResponse } from 'next/server';
import { findUserByEmail, verifyPassword, logActivity } from '@/lib/db';
import { createSession } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const { email, password } = (await req.json()) as { email?: string; password?: string };
    if (!email || !password) {
      return NextResponse.json({ status: 'error', message: 'Email and password are required.' }, { status: 400 });
    }
    const user = await findUserByEmail(email);
    if (!user || !(await verifyPassword(password, user.password))) {
      return NextResponse.json({ status: 'error', message: "That email or password isn't right. Please double-check and try again." }, { status: 401 });
    }
    await createSession({ id: user.id, name: user.name, role: user.role, email: user.email, profile_picture: user.profile_picture });
    await logActivity({
      userId: user.id, role: user.role, userName: user.name, action: 'login',
      description: `${user.role === 'admin' ? 'Administrator' : user.role === 'artisan' ? 'Artisan' : 'User'} logged in: ${user.name} (${user.email})`,
    });
    const home = user.role === 'admin' ? '/admin/dashboard' : user.role === 'artisan' ? '/artisan/dashboard' : '/customer/account/dashboard';
    return NextResponse.json({ status: 'success', redirect: home });
  } catch (e) {
    return NextResponse.json({ status: 'error', message: 'Login failed.' }, { status: 500 });
  }
}
