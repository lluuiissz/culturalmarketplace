import { NextResponse } from 'next/server';
import { findUserByEmail, hashPassword, logActivity } from '@/lib/db';
import { getResetEmail, setPasswordByEmail } from '@/lib/passwordReset';

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => ({}))) as { token?: string; password?: string };
    const token = String(body.token ?? '');
    const password = String(body.password ?? '');

    if (password.length < 8) {
      return NextResponse.json({ status: 'error', message: 'Password must be at least 8 characters.' }, { status: 400 });
    }

    const email = token ? await getResetEmail(token) : null;
    if (!email) {
      return NextResponse.json(
        { status: 'error', message: 'This reset link is invalid or has expired. Please request a new one.' },
        { status: 410 }
      );
    }

    const user = await findUserByEmail(email);
    await setPasswordByEmail(email, await hashPassword(password));

    try {
      await logActivity({
        userId: user?.id ?? null,
        role: user?.role ?? 'system',
        userName: user?.name ?? email,
        action: 'password_reset',
        description: `Password was reset for ${email}`,
      });
    } catch { /* ignore */ }

    return NextResponse.json({ status: 'success', message: 'Your password has been updated. You can now sign in.' });
  } catch {
    return NextResponse.json({ status: 'error', message: 'Could not reset password. Please try again.' }, { status: 500 });
  }
}
