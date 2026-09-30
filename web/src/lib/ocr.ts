// OCR for artisan ID verification, via OCR.space free API (engine 2 handles
// photo text well). Extracted fields are ADVISORY: they pre-fill the
// registration form; the admin approves based on the document image.
// Set OCR_API_KEY in .env.local; without it captureOcr() reports skipped.
// Get a free key: https://ocr.space/OCRAPI  — 'helloworld' is their public demo
// key (verified working, but heavily rate-limited and shared: use for dev only).

import sharp from 'sharp';

const OCR_ENDPOINT = 'https://api.ocr.space/parse/image';

// Why resize server-side: (1) phone photos are 3-6 MB and the free OCR.space
// tier hard-caps uploads at 1 MB — oversized files used to fail outright;
// (2) upload time scales with bytes — a 1600px JPEG (~150-300 KB) OCRs just
// as accurately but is ~10-20x faster to send. Failures to decode fall back
// to the original bytes so the remote service can report the real problem.
async function prepImage(buf: ArrayBuffer): Promise<Buffer> {
  try {
    return await sharp(Buffer.from(buf), { failOn: 'none' })
      .rotate() // honor EXIF orientation before resizing
      .resize({ width: 1600, height: 1600, fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 80 })
      .toBuffer();
  } catch {
    return Buffer.from(buf);
  }
}

export interface OcrFields {
  raw_text: string;
  id_number: string | null;
  full_name: string | null;
  dob: string | null;
  address: string | null;
}

export type OcrResult =
  | { status: 'ok'; fields: OcrFields; engineMs: number }
  | { status: 'skipped' }
  | { status: 'error'; message: string };

// Ordered per-field patterns: first regex that matches wins. Group 1 is the
// extracted value (inner groups are non-capturing).
const FIELD_PATTERNS: Array<{ field: keyof OcrFields; regexes: RegExp[] }> = [
  // Philippine IDs: license "N08-12-345678", PhilSys/UMID "1234-5678-9012"
  { field: 'id_number', regexes: [/\b([A-Z]{0,2}\d{2,4}[- ]\d{2,4}[- ]\d{4,8}|\d{4}[- ]\d{4}[- ]\d{4})\b/] },
  // Prefer "SURNAME, GIVEN" comma form, then a labelled "Name: ..." line.
  { field: 'full_name', regexes: [/[A-Z][A-Z '\-]{2,},\s*[A-Z][A-Z '\-]+/, /\bname\s*[:\-]\s*([A-Z][A-Z '\-]{4,})/i] },
  // Full dates, either order (inner groups non-capturing so group 1 is the date)
  { field: 'dob', regexes: [/\b((?:19|20)\d{2}[-/.](?:0?[1-9]|1[0-2])[-/.](?:0?[1-9]|[12]\d|3[01]))\b/, /\b((?:0?[1-9]|[12]\d|3[01])[-/.](?:0?[1-9]|1[0-2])[-/.](?:19|20)\d{2})\b/] },
  // "Address: ..." labelled line first, else the longest line with an address cue
  { field: 'address', regexes: [/\baddress\s*[:\-]\s*([^\n]{5,120})/i, /(.{10,120}(?:street|st\.|brgy|barangay|purok|sitio|city|municipality|province)[^\n]*)/i] },
];

export async function captureOcr(image: ArrayBuffer, filename = 'id.jpg'): Promise<OcrResult> {
  const key = process.env.OCR_API_KEY;
  if (!key) return { status: 'skipped' };

  const prepared = await prepImage(image);

  // One retry: the free tier regularly answers 503 under load (shared key),
  // and a transient network blip shouldn't fail the user's registration step.
  let lastError = 'OCR request failed';
  for (let attempt = 0; attempt < 2; attempt++) {
    if (attempt > 0) await new Promise((r) => setTimeout(r, 1500));
    try {
      const form = new FormData();
      form.append('file', new Blob([new Uint8Array(prepared)]), filename);
      form.append('apikey', key);
      form.append('language', 'eng');
      form.append('OCREngine', '2');
      form.append('scale', 'true');
      form.append('detectOrientation', 'true');

      // Hard 20s cap: a hung call previously blocked the request until the
      // platform killed it, which looked like the page silently dying.
      const res = await fetch(OCR_ENDPOINT, { method: 'POST', body: form, signal: AbortSignal.timeout(20_000) });
      if (!res.ok) {
        lastError = res.status === 503
          ? 'The ID-reading service is busy right now — please try again in a few seconds.'
          : `OCR service returned ${res.status}`;
        if (res.status >= 500) continue; // retryable
        return { status: 'error', message: lastError };
      }
      const json = (await res.json()) as {
        IsErroredOnProcessing?: boolean | string;
        ErrorMessage?: string | string[];
        ParsedResults?: Array<{ ParsedText?: string }>;
        ProcessingTimeInMilliseconds?: string;
      };
      if (json.IsErroredOnProcessing) {
        const msg = Array.isArray(json.ErrorMessage) ? json.ErrorMessage.join('; ') : json.ErrorMessage;
        return { status: 'error', message: String(msg ?? 'OCR processing error') };
      }
      const raw = json.ParsedResults?.[0]?.ParsedText ?? '';
      const fields: OcrFields = { raw_text: raw.trim(), id_number: null, full_name: null, dob: null, address: null };
      for (const { field, regexes } of FIELD_PATTERNS) {
        for (const re of regexes) {
          const m = raw.match(re);
          if (m) {
            fields[field] = (m[1] ?? m[0]).trim();
            break;
          }
        }
      }
      return { status: 'ok', fields, engineMs: Number(json.ProcessingTimeInMilliseconds ?? 0) };
    } catch (e) {
      lastError = e instanceof Error && e.name === 'TimeoutError'
        ? 'ID reading took too long — please try again.'
        : e instanceof Error ? e.message : 'OCR request failed';
      // network errors → retry once
    }
  }
  return { status: 'error', message: lastError };
}
