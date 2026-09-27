// Client for the face-api FastAPI microservice (face-api/main.py).
// Contract (matches the legacy PHP flow):
//   POST {FACE_API_URL}/verify           multipart: id_image, selfie
//     -> { match, distance, confidence, selfie_embedding }
//   POST {FACE_API_URL}/check-duplicate  multipart: selfie, embeddings(JSON)
//     -> { is_duplicate, matched_artisan_id, distance }
// When FACE_API_URL is unset every function degrades to 'skipped' so
// registration continues to work service-less (documented deviation).

const BASE = (process.env.FACE_API_URL || '').replace(/\/$/, '');

export type FaceOutcome<T> =
  | { status: 'ok'; data: T }
  | { status: 'skipped' }
  | { status: 'error'; message: string };

async function call<T>(path: string, form: FormData): Promise<FaceOutcome<T>> {
  if (!BASE) return { status: 'skipped' };
  try {
    const res = await fetch(`${BASE}${path}`, { method: 'POST', body: form, signal: AbortSignal.timeout(30_000) });
    if (!res.ok) {
      let detail = `face-api returned ${res.status}`;
      try { detail = (await res.json()).detail?.error ?? detail; } catch { /* keep default */ }
      return { status: 'error', message: detail };
    }
    return { status: 'ok', data: (await res.json()) as T };
  } catch (e) {
    return { status: 'error', message: e instanceof Error ? e.message : 'face-api unreachable' };
  }
}

export interface VerifyResult {
  match: boolean; distance: number; confidence: number; selfie_embedding: number[];
}

export async function verifyFace(idImage: ArrayBuffer, selfie: ArrayBuffer): Promise<FaceOutcome<VerifyResult>> {
  const form = new FormData();
  form.append('id_image', new Blob([idImage], { type: 'image/jpeg' }), 'id.jpg');
  form.append('selfie', new Blob([selfie], { type: 'image/jpeg' }), 'selfie.jpg');
  return call<VerifyResult>('/verify', form);
}

export interface DuplicateResult {
  is_duplicate: boolean; matched_artisan_id: number | null; distance: number;
}

/** Duplicate-face check against the stored 128-d artisan embeddings. */
export async function checkDuplicateFace(selfie: ArrayBuffer, stored: Array<{ artisan_id: number; embedding: number[] }>): Promise<FaceOutcome<DuplicateResult>> {
  const form = new FormData();
  form.append('selfie', new Blob([selfie], { type: 'image/jpeg' }), 'selfie.jpg');
  form.append('embeddings', JSON.stringify(stored));
  return call<DuplicateResult>('/check-duplicate', form);
}
