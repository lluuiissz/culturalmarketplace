import { NextResponse, after } from 'next/server';
import { findUserByEmail, logActivity } from '@/lib/db';
import { sendEmail } from '@/lib/email';
import { createResetToken, countRecentResetRequests, buildResetEmail } from '@/lib/passwordReset';

export const maxDuration = 30;

// Same answer whether or not the email exists, so nobody can probe for accounts.
const GENERIC =
  'If that email is registered, we have sent a password reset link. Please check your inbox and spam folder.';

const MAX_REQUESTS_PER_15_MIN = 3;

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => ({}))) as { email?: string };
    const email = String(body.email ?? '').trim().toLowerCase();

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ status: 'error', message: 'Please enter a valid email address.' }, { status: 400 });
    }

    let devLink: string | undefined;
    const user = await findUserByEmail(email);

    if (user && (await countRecentResetRequests(email)) < MAX_REQUESTS_PER_15_MIN) {
      const token = await createResetToken(user.email, user.password);
      const base = (process.env.NEXT_PUBLIC_SITE_URL || new URL(req.url).origin).replace(/\/$/, '');
      const link = `${base}/auth/reset-password?token=${encodeURIComponent(token)}`;

      // Recorded so we can rate-limit; a logging failure must not block the email.
      try {
        await logActivity({
          userId: user.id,
          role: user.role,
          userName: user.name,
          action: 'password_reset_request',
          description: `Password reset requested for ${email}`,
        });
      } catch { /* ignore */ }

      // Send AFTER responding so the response time is the same for every email address.
      const mail = buildResetEmail(user.name, link);
      after(async () => {
        try {
          await sendEmail(user.email, mail);
        } catch (e) {
          console.error('[forgot-password] email failed:', e instanceof Error ? e.message : e);
        }
      });

      if (process.env.NODE_ENV !== 'production') devLink = link; // local testing only
    }

    return NextResponse.json({ status: 'success', message: GENERIC, ...(devLink ? { dev_link: devLink } : {}) });
  } catch {
    return NextResponse.json({ status: 'error', message: 'Something went wrong. Please try again.' }, { status: 500 });
  }
}
