// Email delivery, transport-agnostic:
//   1. SMTP   — when SMTP_HOST + SMTP_USER are set (legacy Gmail app password)
//   2. Resend — when RESEND_API_KEY is set (needs a verified sending domain)
//   3. Console — dev/demo fallback; in non-production the OTP is surfaced in
//      the API response so the preview works with no provider at all.

import nodemailer from 'nodemailer';

const FROM = process.env.EMAIL_FROM || process.env.OTP_FROM_EMAIL || 'Cultural Marketplace <noreply@localhost>';

export interface MailOptions {
  subject: string;
  html: string;
  text?: string;
}

async function sendViaSmtp(to: string, opts: MailOptions): Promise<boolean> {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!host || !user || !pass) return false;

  const port = Number(process.env.SMTP_PORT || 465);
  const secure = process.env.SMTP_SECURE ? process.env.SMTP_SECURE === 'true' : port === 465;

  try {
    const transporter = nodemailer.createTransport({ host, port, secure, auth: { user, pass } });
    await transporter.verify();
    await transporter.sendMail({ from: FROM, to, subject: opts.subject, html: opts.html, text: opts.text });
    return true;
  } catch (e) {
    console.error('[email] SMTP send failed:', e instanceof Error ? e.message : e);
    return false;
  }
}

async function sendViaResend(to: string, opts: MailOptions): Promise<boolean> {
  const key = process.env.RESEND_API_KEY;
  if (!key) return false;
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: FROM, to, subject: opts.subject, html: opts.html, text: opts.text }),
    });
    if (!res.ok) console.error('[email] Resend returned', res.status);
    return res.ok;
  } catch (e) {
    console.error('[email] Resend failed:', e instanceof Error ? e.message : e);
    return false;
  }
}

/** Tries SMTP then Resend; returns whether the message was actually delivered. */
export async function sendEmail(to: string, opts: MailOptions): Promise<{ delivered: boolean }> {
  if (await sendViaSmtp(to, opts)) return { delivered: true };
  if (await sendViaResend(to, opts)) return { delivered: true };
  console.log(`[email:console-fallback] to=${to} subject="${opts.subject}"`);
  return { delivered: false };
}

/** OTP delivery used by customer registration. */
export async function sendOtpEmail(email: string, code: string): Promise<{ delivered: boolean }> {
  return sendEmail(email, {
    subject: 'Your Account Verification OTP',
    html: `<p>Your 6-digit verification code is: <b>${code}</b></p><p>It expires in 10 minutes.</p>`,
    text: `Your verification code is ${code} (expires in 10 minutes).`,
  });
}
