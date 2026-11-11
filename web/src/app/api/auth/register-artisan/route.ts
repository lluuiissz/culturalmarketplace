import { NextResponse } from 'next/server';
import { findUserByEmail } from '@/lib/db';
import { sealPending } from '@/lib/pendingToken';

// Fields carried from the text step to the capture step (inside the encrypted token).
const FIELDS = [
  'name',
  'email',
  'password',
  'phone',
  'location',
  'craft_type',
  'business_name',
  'id_number',
  'dob',
] as const;

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

    const data: Record<string, string> = {};
    for (const f of FIELDS) {
      if (typeof body[f] === 'string') data[f] = body[f];
    }

    // Stateless, encrypted token (valid 15 minutes) - works across serverless instances.
    const token = sealPending(data);

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
