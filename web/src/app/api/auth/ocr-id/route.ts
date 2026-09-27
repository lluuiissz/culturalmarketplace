import { NextResponse } from 'next/server';
import { captureOcr } from '@/lib/ocr';

// Optional OCR preview: returns extracted fields for form pre-fill.
// The authoritative pass happens server-side in /register-artisan/captures.
export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const file = form.get('id_image') as File | null;
    if (!file) return NextResponse.json({ status: 'error', message: 'No image provided.' }, { status: 400 });
    const result = await captureOcr(await file.arrayBuffer(), file.name || 'id.jpg');
    if (result.status === 'ok') return NextResponse.json({ status: 'ok', fields: result.fields });
    if (result.status === 'skipped') return NextResponse.json({ status: 'skipped' });
    return NextResponse.json({ status: 'error', message: result.message }, { status: 200 });
  } catch {
    return NextResponse.json({ status: 'error', message: 'OCR request failed.' }, { status: 500 });
  }
}
