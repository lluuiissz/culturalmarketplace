import { NextResponse } from 'next/server';
import { createArtisan, getArtisanByEmail, logActivity } from '@/lib/db';
import { captureOcr } from '@/lib/ocr';
import { verifyFace, checkDuplicateFace } from '@/lib/faceVerify';
import { listFaceEmbeddings, saveFaceEmbedding } from '@/lib/faceEmbeddings';
import { logFaceAttempt } from '@/lib/faceLogs';
import { uploadFile } from '@/lib/storage';

// In-memory pending-artisan handoff shared with ../route.ts.
declare global {
  // eslint-disable-next-line no-var
  var __pendingArtisans: Map<string, { data: Record<string, string>; expires: number }> | undefined;
}

export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const token = String(form.get('token') ?? '');
    const entry = globalThis.__pendingArtisans?.get(token);
    if (!entry || entry.expires < Date.now()) {
      globalThis.__pendingArtisans?.delete(token);
      return NextResponse.json({ status: 'error', message: 'Registration session expired. Please start again.' }, { status: 410 });
    }
    const d = entry.data;

    const idFront = form.get('id_front') as File | null;
    const idBack = form.get('id_back') as File | null;
    const selfie = form.get('selfie') as File | null;
    if (!idFront || !idBack || !selfie) {
      return NextResponse.json({ status: 'error', message: 'ID front, ID back, and a live selfie are required.' }, { status: 400 });
    }
    for (const f of [idFront, idBack, selfie]) {
      if (f.size > 8 * 1024 * 1024) return NextResponse.json({ status: 'error', message: 'Each image must be under 8 MB.' }, { status: 400 });
    }

    const [idFrontBuf, idBackBuf, selfieBuf] = await Promise.all([idFront.arrayBuffer(), idBack.arrayBuffer(), selfie.arrayBuffer()]);
    const notes: string[] = [];
    let warnings: string[] = [];

    // ---- 1+2. OCR both ID sides and face-verify in PARALLEL ----
    // Three remote calls used to run back-to-back (each 1-8s); Promise.all
    // caps total wait at the slowest single call instead of the sum.
    const [ocrFront, ocrBack, verify] = await Promise.all([
      captureOcr(idFrontBuf, idFront.name || 'id-front.jpg'),
      captureOcr(idBackBuf, idBack.name || 'id-back.jpg'),
      verifyFace(idFrontBuf, selfieBuf),
    ]);
    if (ocrFront.status === 'ok' && ocrFront.fields.id_number) {
      const found = ocrFront.fields.id_number.replace(/[\s-]/g, '');
      const given = (d.id_number ?? '').replace(/[\s-]/g, '');
      if (given && found !== given) {
        notes.push(`OCR read ID number "${ocrFront.fields.id_number}" which differs from the entered one.`);
      }
    }
    const ocrDetail = { front: ocrFront.status === 'ok' ? ocrFront.fields : ocrFront.status, back: ocrBack.status === 'ok' ? ocrBack.fields : ocrBack.status };

    // ---- Face verification (result from the parallel block above) ----
    let faceMatch: boolean | null = null;
    let selfieEmbedding: number[] | null = null;
    let faceConfidence: number | null = null;
    if (verify.status === 'ok') {
      faceMatch = verify.data.match;
      faceConfidence = verify.data.confidence;
      selfieEmbedding = verify.data.selfie_embedding;
      if (!verify.data.match) {
        await logFaceAttempt({ email: d.email, result: 'no_match', distance: verify.data.distance, confidence: verify.data.confidence, detail: { step: 'verify' } });
        return NextResponse.json({ status: 'error', message: 'Face verification failed: your selfie does not match your ID photo. Retake in better lighting, facing the camera.' }, { status: 422 });
      }
      await logFaceAttempt({ email: d.email, result: 'match', distance: verify.data.distance, confidence: verify.data.confidence, detail: { step: 'verify' } });
    } else if (verify.status === 'error') {
      await logFaceAttempt({ email: d.email, result: 'error', detail: { step: 'verify', message: verify.message } });
      notes.push('Face service unreachable - submitted for manual admin review.');
      warnings.push('Automatic face check could not run; an admin will verify your documents manually.');
    } else {
      notes.push('Face service not configured - submitted for manual admin review.');
    }

    // ---- 3. Duplicate-face check against existing artisans ----
    let duplicateOf: number | null = null;
    if (selfieEmbedding) {
      const stored = await listFaceEmbeddings();
      const dup = await checkDuplicateFace(selfieBuf, stored);
      if (dup.status === 'ok' && dup.data.is_duplicate) {
        duplicateOf = dup.data.matched_artisan_id;
        await logFaceAttempt({ email: d.email, artisanId: duplicateOf, result: 'duplicate', distance: dup.data.distance, detail: { step: 'duplicate' } });
        return NextResponse.json({ status: 'error', message: 'This face is already registered to another artisan account.' }, { status: 409 });
      }
    } else if (verify.status === 'skipped') {
      // best-effort without embeddings
    }

    // ---- 4. Store verification documents (skipped without Storage keys) ----
    let idFrontPath: string | null = null;
    let idBackPath: string | null = null;
    let selfiePath: string | null = null;
    const safeEmail = (d.email ?? 'applicant').replace(/[^a-z0-9]/gi, '_');
    try {
      const up = async (f: File, buf: ArrayBuffer, name: string) => {
        const r = await uploadFile('verification-docs', `${safeEmail}/${Date.now()}-${name}`, buf, f.type || 'image/jpeg');
        return r.path;
      };
      [idFrontPath, idBackPath, selfiePath] = await Promise.all([
        up(idFront, idFrontBuf, 'id-front'),
        up(idBack, idBackBuf, 'id-back'),
        up(selfie, selfieBuf, 'selfie'),
      ]);
      if (!idFrontPath) notes.push('File storage not configured - documents not retained; admin will request them separately.');
    } catch (e) {
      notes.push('Document upload failed; an admin may contact you for re-submission.');
      if (e instanceof Error) notes.push(`(${e.message})`);
    }

    // ---- 5. Create the pending artisan ----
    const artisanId = await createArtisan({
      name: d.name ?? '', email: d.email ?? '', password: d.password ?? '',
      phone: d.phone ?? '', location: d.location ?? '',
      craft_type: d.craft_type ?? '', business_name: d.business_name,
      id_number: d.id_number ?? '', dob: d.dob,
      id_document_path: idFrontPath, id_document_back_path: idBackPath,
      selfie_path: selfiePath, face_matched: faceMatch, face_confidence: faceConfidence,
      registration_notes: notes.join(' ') || null,
    });
    if (selfieEmbedding) await saveFaceEmbedding(artisanId, selfieEmbedding);

    await logActivity({ userId: artisanId, role: 'artisan', userName: d.name ?? '', action: 'registration', description: `New artisan registered: ${d.name} (${d.email}) - Status: pending${faceMatch ? ' - face verified' : ''}` });

    globalThis.__pendingArtisans?.delete(token);
    return NextResponse.json({
      status: 'success',
      message: 'Registration submitted! Your account is pending admin approval.',
      requires_approval: true,
      face_verified: faceMatch === true,
      duplicate_of: duplicateOf,
    });
  } catch (e) {
    return NextResponse.json({ status: 'error', message: e instanceof Error ? `Registration failed: ${e.message}` : 'Registration failed. Please try again.' }, { status: 500 });
  }
}
