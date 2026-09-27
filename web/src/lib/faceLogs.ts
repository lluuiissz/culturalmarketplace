// Audit trail for face verification attempts -> face_verification_logs (0003).
// Demo mode logs to console (no table in the in-memory store).
import { sql, usingPg } from './dbPg';

export type FaceLogResult = 'match' | 'no_match' | 'duplicate' | 'error' | 'skipped';

export async function logFaceAttempt(entry: {
  email?: string | null; artisanId?: number | null; result: FaceLogResult;
  distance?: number | null; confidence?: number | null; detail?: unknown;
}): Promise<void> {
  if (!usingPg) {
    console.log('[face-log]', entry.result, entry.email ?? '', entry.distance ?? '');
    return;
  }
  await sql`
    insert into face_verification_logs (email, artisan_id, result, distance, confidence, detail)
    values (${entry.email ?? null}, ${entry.artisanId ?? null}, ${entry.result},
            ${entry.distance ?? null}, ${entry.confidence ?? null},
            ${(entry.detail ?? null) as unknown as string | null}::jsonb)`;
}
