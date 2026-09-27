import { NextResponse } from 'next/server';
import { takePendingRegistration, deletePendingRegistration, createCustomer, logActivity, findUserByEmail, hashPassword } from '@/lib/db';
import { createSession } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const { email, otp } = (await req.json()) as { email?: string; otp?: string };
    if (!email || !otp) {
      return NextResponse.json({ status: 'error', message: 'Missing email or OTP.' }, { status: 400 });
    }
    const pending = await takePendingRegistration(email);
    if (!pending) {
      return NextResponse.json({ status: 'error', message: 'Session expired or not found. Please register again.' }, { status: 404 });
    }
    if (pending.otp !== otp) {
      return NextResponse.json({ status: 'error', message: 'Invalid OTP code. Please try again.' }, { status: 400 });
    }
    if (pending.expires < Date.now()) {
      return NextResponse.json({ status: 'error', message: 'OTP has expired. Please click Resend OTP to get a new one.' }, { status: 400 });
    }
    if (await findUserByEmail(email)) {
      await deletePendingRegistration(email);
      return NextResponse.json({ status: 'error', message: 'This email was just registered. Please log in instead.' }, { status: 409 });
    }

    const id = await createCustomer({ name: pending.name, email, password: await hashPassword(pending.password), phone: pending.phone });
    await deletePendingRegistration(email);
    await createSession({ id, name: pending.name, role: 'customer', email, profile_picture: null });
    await logActivity({ userId: id, role: 'customer', userName: pending.name, action: 'registration', description: `New customer registered: ${pending.name} (${email})` });
    return NextResponse.json({ status: 'success', redirect: '/customer/account/dashboard' });
  } catch {
    return NextResponse.json({ status: 'error', message: 'Verification failed. Please try again.' }, { status: 500 });
  }
}
