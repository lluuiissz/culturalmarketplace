// JWT session cookie auth — mirrors the legacy PHP session keys
// (id, name, role, isLoggedIn) so ported controller logic maps 1:1.

import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import type { SessionUser, Role } from './types';

const COOKIE = 'cm_session';
const SECRET = () => new TextEncoder().encode(process.env.JWT_SECRET || 'dev-only-secret-fallback');

export interface SessionPayload extends SessionUser {
  isLoggedIn: true;
}

export async function createSession(user: SessionUser): Promise<void> {
  const token = await new SignJWT({ ...user, isLoggedIn: true })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(SECRET());
  (await cookies()).set(COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24 * 7,
    path: '/',
  });
}

export async function getSession(): Promise<SessionPayload | null> {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, SECRET());
    if (!payload.isLoggedIn) return null;
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

export async function destroySession(): Promise<void> {
  (await cookies()).delete(COOKIE);
}

export async function requireRole(...roles: Role[]): Promise<SessionPayload> {
  const s = await getSession();
  if (!s || !roles.includes(s.role)) throw new HttpError(401, 'Unauthorized');
  return s;
}

export class HttpError extends Error {
  constructor(public status: number, message: string) { super(message); }
}

/** Middleware-safe verification (no cookies() API — reads header directly). */
export async function verifySessionToken(token: string | undefined): Promise<SessionPayload | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, SECRET());
    if (!payload.isLoggedIn) return null;
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

export const SESSION_COOKIE_NAME = COOKIE;
