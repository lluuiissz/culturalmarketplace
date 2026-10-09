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
  // Philippine IDs: PhilSys "1234-5678-9012-3456" / "1234 5678 9012 3456", license "N08-12-345678", UMID "1234-5678901-2"
  {
    field: 'id_number',
    regexes: [
      /\b(\d{4}[- ]\d{4}[- ]\d{4}[- ]\d{4})\b/,
      /\b([A-Z]\d{2}[- ]\d{2}[- ]\d{6})\b/,
      /\b(\d{4}[- ]\d{7}[- ]\d{1})\b/,
      /\b([A-Z]{0,2}\d{2,4}[- ]\d{2,4}[- ]\d{4,8})\b/,
      /\bID\s*(?:NO|NUMBER)?[:.\s#]*([A-Z0-9-]{6,20})\b/i,
    ],
  },
  // Full Name: "SURNAME, GIVEN NAME", "NAME: ...", or multi-word capitalized names
  {
    field: 'full_name',
    regexes: [
      /\b(?:NAME|FULL NAME|PANGALAN)\s*[:\-]\s*([A-Z][A-Za-z '\-]{3,40})/i,
      /([A-Z][A-Z '\-]{2,25},\s*[A-Z][A-Za-z '\-]{2,25})/,
      /\b([A-Z][a-z]+ [A-Z][a-z]+(?: [A-Z][a-z]+)?)\b/,
    ],
  },
  // Date of Birth: YYYY-MM-DD, DD/MM/YYYY, MM/DD/YYYY, or textual "12 Jan 1990"
  {
    field: 'dob',
    regexes: [
      /\b(?:DOB|DATE OF BIRTH|BIRTHDATE|KAPANGANAKAN)\s*[:\-]\s*([0-9A-Za-z,/\- ]{8,20})/i,
      /\b((?:19|20)\d{2}[-/.](?:0?[1-9]|1[0-2])[-/.](?:0?[1-9]|[12]\d|3[01]))\b/,
      /\b((?:0?[1-9]|[12]\d|3[01])[-/.](?:0?[1-9]|1[0-2])[-/.](?:19|20)\d{2})\b/,
      /\b((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]* \d{1,2},? (?:19|20)\d{2})\b/i,
    ],
  },
  // Address: "Address: ...", "TIRAHAN: ...", or lines containing barangay/purok/city/municipality
  {
    field: 'address',
    regexes: [
      /\b(?:ADDRESS|TIRAHAN)\s*[:\-]\s*([^\n]{5,100})/i,
      /(.{8,90}(?:purok|sitio|barangay|brgy|san francisco|prosperidad|bayugan|bunawan|trento|rosario|agusan)[^\n]*)/i,
      /(.{10,100}(?:street|st\.|road|city|municipality|province)[^\n]*)/i,
    ],
  },
];

export async function captureOcr(image: ArrayBuffer, filename = 'id.jpg'): Promise<OcrResult> {
  const key = process.env.OCR_API_KEY;
  if (!key) return { status: 'skipped' };

  const prepared = await prepImage(image);

  let lastError = 'OCR request failed';
  // Fast single or quick-retry with tight 8s timeout to ensure prompt UI response
  for (let attempt = 0; attempt < 2; attempt++) {
    if (attempt > 0) await new Promise((r) => setTimeout(r, 800));
    try {
      const form = new FormData();
      form.append('file', new Blob([new Uint8Array(prepared)]), filename);
      form.append('apikey', key);
      form.append('language', 'eng');
      form.append('OCREngine', '2');
      form.append('scale', 'true');
      form.append('detectOrientation', 'true');

      // Fast 8-second timeout cap: prevents UI stalls
      const res = await fetch(OCR_ENDPOINT, { method: 'POST', body: form, signal: AbortSignal.timeout(8_000) });
      if (!res.ok) {
        lastError = res.status === 503
          ? 'The ID-reading service is momentarily busy.'
          : `OCR service returned ${res.status}`;
        if (res.status >= 500 && attempt === 0) continue;
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
        ? 'ID reading timed out. You may type your ID details directly.'
        : e instanceof Error ? e.message : 'OCR request failed';
    }
  }
  return { status: 'error', message: lastError };
}
