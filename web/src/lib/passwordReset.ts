import { createHash } from 'node:crypto';
import { SignJWT, jwtVerify } from 'jose';
import { sql } from './dbPg';
import { usingPostgres, store, findUserByEmail } from './db';
import type { MailOptions } from './email';

/**
 * Password reset helpers.
 *
 * The reset link carries a signed token (valid 30 minutes). The token also
 * contains a fingerprint of the user's CURRENT password hash, so as soon as the
 * password changes, the same link stops working (single use). Nothing is stored
 * on the server, so it works on Vercel's serverless instances.
 */

const TTL = '30m';

function secretKey(): Buffer {
  const secret =
    process.env.PENDING_TOKEN_SECRET ||
    process.env.JWT_SECRET ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    (process.env.NODE_ENV !== 'production' ? 'dev-only-reset-secret' : '');

  if (!secret) throw new Error('No server secret configured for password reset tokens.');
  return createHash('sha256').update(`cm-pwd-reset:${secret}`).digest();
}

function fingerprint(passwordHash: string): string {
  return createHash('sha256').update(passwordHash).digest('hex').slice(0, 16);
}

export async function createResetToken(email: string, currentPasswordHash: string): Promise<string> {
  return new SignJWT({
    purpose: 'pwd-reset',
    email: email.toLowerCase(),
    pf: fingerprint(currentPasswordHash),
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(TTL)
    .sign(secretKey());
}

/** Returns the account email if the token is valid, unexpired and unused; otherwise null. */
export async function getResetEmail(token: string): Promise<string | null> {
  try {
    const { payload } = await jwtVerify(token, secretKey(), { algorithms: ['HS256'] });
    if (payload.purpose !== 'pwd-reset' || typeof payload.email !== 'string' || typeof payload.pf !== 'string') {
      return null;
    }
    const user = await findUserByEmail(payload.email);
    if (!user || fingerprint(user.password) !== payload.pf) return null;
    return user.email;
  } catch {
    return null;
  }
}

/** Updates the password everywhere the account lives (users + artisans tables). */
export async function setPasswordByEmail(email: string, passwordHash: string): Promise<void> {
  const e = email.toLowerCase();
  if (usingPostgres) {
    await sql`update users set password = ${passwordHash} where lower(email) = ${e}`;
    await sql`update artisans set password = ${passwordHash} where lower(email) = ${e}`;
    return;
  }
  for (const u of store!.users) if (u.email.toLowerCase() === e) u.password = passwordHash;
  for (const a of store!.artisans) if (a.email.toLowerCase() === e) a.password = passwordHash;
}

/** Reset requests for this email in the last 15 minutes (counted from activity_logs). */
export async function countRecentResetRequests(email: string): Promise<number> {
  const e = email.toLowerCase();
  try {
    if (usingPostgres) {
      const rows = await sql`
        select count(*)::int as n from activity_logs
        where action = 'password_reset_request'
          and strpos(lower(description), ${e}) > 0
          and created_at > now() - interval '15 minutes'`;
      return Number((rows[0] as Record<string, unknown>)?.n ?? 0);
    }
    const cutoff = Date.now() - 15 * 60_000;
    return store!.activity_logs.filter(
      (l) =>
        l.action === 'password_reset_request' &&
        l.description.toLowerCase().includes(e) &&
        new Date(l.created_at).getTime() > cutoff
    ).length;
  } catch {
    return 0; // never block a legitimate reset because of a logging problem
  }
}

function esc(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
}

export function buildResetEmail(name: string, link: string): MailOptions {
  const first = esc((name || '').split(' ')[0] || 'there');
  return {
    subject: 'Reset your Cultural Marketplace password',
    text: `Hi ${first},\n\nWe received a request to reset your password. Open this link to choose a new one (valid for 30 minutes):\n\n${link}\n\nIf you did not request this, you can safely ignore this email.\n\n- Cultural Marketplace`,
    html: `
<div style="font-family:Arial,Helvetica,sans-serif;background:#faf7f2;padding:24px">
  <div style="max-width:480px;margin:0 auto;background:#ffffff;border:1px solid #e8dcc8;border-radius:16px;overflow:hidden">
    <div style="height:8px;background:#111111;border-bottom:3px solid #9E0000"></div>
    <div style="padding:28px">
      <p style="margin:0 0 4px;font-size:20px;font-weight:800">
        <span style="color:#8B0000">Cultural</span> <span style="color:#F5A000">Marketplace</span>
      </p>
      <p style="margin:0 0 20px;font-size:11px;color:#B00000">Agusan del Sur Indigenous Crafts and Experiences</p>

      <h2 style="margin:0 0 12px;font-size:18px;color:#1f1f1f">Reset your password</h2>
      <p style="margin:0 0 12px;font-size:14px;line-height:1.6;color:#44403c">Hi ${first},</p>
      <p style="margin:0 0 20px;font-size:14px;line-height:1.6;color:#44403c">
        We received a request to reset your password. Click the button below to choose a new one.
        This link is valid for <b>30 minutes</b> and can be used once.
      </p>

      <p style="margin:0 0 20px">
        <a href="${link}" style="display:inline-block;background:#9E2A2B;color:#ffffff;text-decoration:none;font-weight:700;font-size:14px;padding:12px 22px;border-radius:10px">
          Set a new password
        </a>
      </p>

      <p style="margin:0 0 6px;font-size:12px;color:#78716c">If the button does not work, copy this link into your browser:</p>
      <p style="margin:0 0 20px;font-size:12px;word-break:break-all;color:#9E2A2B">${link}</p>

      <p style="margin:0;font-size:12px;line-height:1.6;color:#78716c">
        If you did not request this, you can safely ignore this email. Your password will not change.
      </p>
    </div>
  </div>
</div>`,
  };
}
