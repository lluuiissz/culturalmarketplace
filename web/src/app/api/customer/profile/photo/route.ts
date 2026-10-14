import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { updateCustomerProfile } from '@/lib/db';
import { uploadFile, objectPath } from '@/lib/storage';
import { moderateUpload } from '@/lib/imageModeration';

const MAX_BYTES = 8 * 1024 * 1024;
const ALLOWED = ['image/jpeg', 'image/png', 'image/webp'];

export async function POST(req: Request) {
  const session = await getSession();
  if (!session || session.role !== 'customer') {
    return NextResponse.json({ status: 'error', message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const form = await req.formData();
    const file = form.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ status: 'error', message: 'No file provided.' }, { status: 400 });
    }
    if (!ALLOWED.includes(file.type)) {
      return NextResponse.json({ status: 'error', message: 'Only JPEG, PNG, or WebP images are allowed.' }, { status: 415 });
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json({ status: 'error', message: 'Image must be under 8 MB.' }, { status: 413 });
    }

    const buf = Buffer.from(await file.arrayBuffer());
    const contentType = file.type;
    const fileName = `${Date.now()}-${file.name ? file.name.replace(/[^a-zA-Z0-9._-]/g, '_') : 'avatar.jpg'}`;

    const verdict = await moderateUpload({ arrayBuffer: async () => buf, type: contentType });
    if (verdict.kind === 'reject') {
      return NextResponse.json({ status: 'error', message: verdict.reasons.join(' ') }, { status: 422 });
    }

    const p = objectPath(`customers/${session.id}`, fileName);
    const { publicUrl } = await uploadFile(
      'profile-pictures',
      p,
      buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) as ArrayBuffer,
      contentType
    );

    const profilePicUrl = publicUrl || `/uploads/${p}`;
    await updateCustomerProfile(session.id, { profile_picture: profilePicUrl });

    return NextResponse.json({ status: 'success', profile_picture: profilePicUrl });
  } catch (err: unknown) {
    return NextResponse.json(
      { status: 'error', message: (err as Error).message || 'Failed to upload photo.' },
      { status: 500 }
    );
  }
}
