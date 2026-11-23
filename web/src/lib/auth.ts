// JWT session cookie auth — mirrors the legacy PHP session keys
// (id, name, role, isLoggedIn) so ported controller logic maps 1:1.

import { SignJWT } from 'jose';
import { cookies } from 'next/headers';
import { cache } from 'react';
import type { SessionUser, Role } from './types';
import { getArtisanByEmail, isAccountActive } from './db';
import { SESSION_COOKIE_NAME, sessionSecret, verifySessionToken, type SessionPayload } from './sessionToken';

export { SESSION_COOKIE_NAME, verifySessionToken } from './sessionToken';
export type { SessionPayload } from './sessionToken';

export async function createSession(user: SessionUser): Promise<void> {
  const token = await new SignJWT({ ...user, isLoggedIn: true })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(sessionSecret());
  (await cookies()).set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24 * 7,
    path: '/',
  });
}

export const getSession = cache(async (): Promise<SessionPayload | null> => {
  const session = await verifySessionToken((await cookies()).get(SESSION_COOKIE_NAME)?.value);
  if (!session) return null;
  if (session.role === 'artisan') {
    const artisan = await getArtisanByEmail(session.email);
    if (!artisan) return null;
    return {
      ...session,
      id: artisan.id,
      name: artisan.name,
      email: artisan.email,
      profile_picture: artisan.profile_picture,
    };
  }
  if (!await isAccountActive(session.id, session.role, session.email)) return null;
  return session;
});

export async function destroySession(): Promise<void> {
  (await cookies()).delete(SESSION_COOKIE_NAME);
}

export async function requireRole(...roles: Role[]): Promise<SessionPayload> {
  const s = await getSession();
  if (!s || !roles.includes(s.role)) throw new HttpError(401, 'Unauthorized');
  return s;
}

export class HttpError extends Error {
  constructor(public status: number, message: string) { super(message); }
}
