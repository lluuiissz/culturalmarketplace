import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto';

/**
 * Stateless "pending artisan" token.
 *
 * The first registration step seals the applicant's details into an encrypted,
 * tamper-proof token (AES-256-GCM) that is returned to the browser. The capture
 * step opens it again. Nothing is stored in server memory, so it works on
 * Vercel, where each request may be handled by a different serverless instance.
 *
 * Secret: set PENDING_TOKEN_SECRET in Vercel (any long random string).
 * If it is missing we fall back to other server-side secrets already in use.
 */

const TTL_MS = 15 * 60_000; // 15 minutes

function key(): Buffer {
  const secret =
    process.env.PENDING_TOKEN_SECRET ??
    process.env.SESSION_SECRET ??
    process.env.JWT_SECRET ??
    process.env.AUTH_SECRET ??
    process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!secret) {
    throw new Error('No server secret configured for registration tokens.');
  }

  return createHash('sha256').update(`cm-pending-artisan:${secret}`).digest();
}

export function sealPending(data: Record<string, string>): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', key(), iv);

  const payload = JSON.stringify({ d: data, e: Date.now() + TTL_MS });
  const encrypted = Buffer.concat([cipher.update(payload, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();

  return Buffer.concat([iv, tag, encrypted]).toString('base64url');
}

/** Returns the applicant's details, or null if the token is invalid or expired. */
export function openPending(token: string): Record<string, string> | null {
  try {
    const raw = Buffer.from(token, 'base64url');
    if (raw.length < 29) return null;

    const iv = raw.subarray(0, 12);
    const tag = raw.subarray(12, 28);
    const encrypted = raw.subarray(28);

    const decipher = createDecipheriv('aes-256-gcm', key(), iv);
    decipher.setAuthTag(tag);

    const json = Buffer.concat([decipher.update(encrypted), decipher.final()]).toString('utf8');
    const parsed = JSON.parse(json) as { d?: Record<string, string>; e?: number };

    if (typeof parsed.e !== 'number' || parsed.e < Date.now() || !parsed.d) return null;
    return parsed.d;
  } catch {
    return null;
  }
}
