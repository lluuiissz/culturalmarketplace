import { NextResponse } from 'next/server';
import { findUserByEmail, putPendingRegistration } from '@/lib/db';
import { sendOtpEmail } from '@/lib/email';

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      first_name?: string; last_name?: string; email?: string; phone?: string; password?: string; password_confirmation?: string; terms?: boolean;
    };
    const firstName = (body.first_name ?? '').trim();
    const lastName = (body.last_name ?? '').trim();
    const email = (body.email ?? '').trim();
    const phone = (body.phone ?? '').trim();
    const password = body.password ?? '';

    if (!firstName || !lastName || !email || !phone || !password) {
      return NextResponse.json({ status: 'error', message: 'Please complete all required fields.' }, { status: 400 });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ status: 'error', message: 'Please enter a valid email address.' }, { status: 400 });
    }
    if (!/^09\d{9}$/.test(phone)) {
      return NextResponse.json({ status: 'error', message: 'Please enter a valid 11-digit mobile number starting with 09.' }, { status: 400 });
    }
    if (password !== (body.password_confirmation ?? '')) {
      return NextResponse.json({ status: 'error', message: 'Passwords do not match.' }, { status: 400 });
    }
    if (password.length < 8) {
      return NextResponse.json({ status: 'error', message: 'Your password must be at least 8 characters long.' }, { status: 400 });
    }
    if (!body.terms) {
      return NextResponse.json({ status: 'error', message: 'Please agree to the Terms & Conditions and Privacy Policy.' }, { status: 400 });
    }
    if (await findUserByEmail(email)) {
      return NextResponse.json({ status: 'error', message: 'This email is already registered. Please provide a different valid email address.' }, { status: 409 });
    }

    const otp = String(Math.floor(100000 + Math.random() * 900000));
    await putPendingRegistration(email, {
      name: `${firstName} ${lastName}`, phone, password,
      otp, ttlMinutes: 10,
    });
    const { delivered } = await sendOtpEmail(email, otp);

    return NextResponse.json({
      status: 'success',
      // Say what actually happened — never promise an email we didn't send.
      message: delivered
        ? 'We sent a 6-digit code to your email. Enter it below to verify your account.'
        : "We couldn't send the email right now, so here is your code instead.",
      requires_otp: true,
      // Only surface the code when delivery genuinely failed.
      dev_otp: delivered ? undefined : otp,
    });
  } catch {
    return NextResponse.json({ status: 'error', message: 'Registration failed. Please try again.' }, { status: 500 });
  }
}
