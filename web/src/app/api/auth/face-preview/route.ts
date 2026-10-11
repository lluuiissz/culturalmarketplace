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
      return NextResponse.json({
        match: Boolean(result.data.match),
        confidence: result.data.confidence,
        distance: result.data.distance,
        message: result.data.match ? 'Face matched your ID photo.' : 'Face did not match ID photo.',
      });
    }
    if (result.status === 'skipped') {
      return NextResponse.json({
        match: false,
        skipped: true,
        message: 'Face comparison service is offline. Photo saved for manual admin review.',
      });
    }

    await logFaceAttempt({ result: 'error', detail: { step: 'preview', message: result.message } });

    const isNoFace = result.message?.toLowerCase().includes('no face') || result.message?.toLowerCase().includes('face found');
    return NextResponse.json({
      match: false,
      no_face: isNoFace,
      message: isNoFace
        ? 'No face was detected in one or both images. Ensure your face and ID photo are clearly visible and well-lit.'
        : (result.message || 'Face comparison service error.'),
    });
  } catch (err) {
    return NextResponse.json({ match: false, message: 'Face check failed. Admin will review manually.' }, { status: 500 });
  }
}
