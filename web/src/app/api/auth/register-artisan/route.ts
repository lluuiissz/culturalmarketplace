import { NextResponse } from 'next/server';
import { randomUUID } from 'node:crypto';
import { findUserByEmail } from '@/lib/db';

// In-memory pending-artisan handoff (text step -> capture step). Survives dev
// hot-reload via globalThis. 15-minute expiry.
declare global {
  // eslint-disable-next-line no-var
  var __pendingArtisans: Map<string, { data: Record<string, string>; expires: number }> | undefined;
}

function pending(): Map<string, { data: Record<string, string>; expires: number }> {
  if (!globalThis.__pendingArtisans) globalThis.__pendingArtisans = new Map();
  return globalThis.__pendingArtisans;
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Record<string, string>;
    const name = (body.name ?? '').trim();
    const email = (body.email ?? '').trim();
    const password = body.password ?? '';
    if (!name || !email || !password) {
      return NextResponse.json({ status: 'error', message: 'Please complete all required fields.' }, { status: 400 });
    }
    if (await findUserByEmail(email)) {
      return NextResponse.json({ status: 'error', message: 'This email is already registered.' }, { status: 409 });
    }

    const token = randomUUID();
    pending().set(token, { data: body, expires: Date.now() + 15 * 60_000 });

    return NextResponse.json({
      status: 'success',
      token,
      services: {
        ocr: Boolean(process.env.OCR_API_KEY),
        face: Boolean(process.env.FACE_API_URL),
        storage: Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY),
      },
    });
  } catch {
    return NextResponse.json({ status: 'error', message: 'Registration failed. Please try again.' }, { status: 500 });
  }
}
