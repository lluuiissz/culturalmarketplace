import { NextResponse } from 'next/server';
import { verifyFace } from '@/lib/faceVerify';
import { logFaceAttempt } from '@/lib/faceLogs';

// Live preview: selfie vs ID front, called from the capture screen so the
// applicant can retake immediately. Final gate is server-side in /captures.
export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const idImage = form.get('id_image') as File | null;
    const selfie = form.get('selfie') as File | null;
    if (!idImage || !selfie) return NextResponse.json({ match: false, message: 'Need ID image and selfie.' }, { status: 400 });

    const result = await verifyFace(await idImage.arrayBuffer(), await selfie.arrayBuffer());
    if (result.status === 'ok') {
      return NextResponse.json({ match: result.data.match, confidence: result.data.confidence });
    }
    if (result.status === 'skipped') {
      return NextResponse.json({ match: true, skipped: true, message: 'Face service not configured - automatic comparison unavailable.' });
    }
    await logFaceAttempt({ result: 'error', detail: { step: 'preview', message: result.message } });
    return NextResponse.json({ match: false, message: result.message });
  } catch {
    return NextResponse.json({ match: false, message: 'Face check failed.' }, { status: 500 });
  }
}
