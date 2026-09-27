// Applies Supabase migrations + seed to the DATABASE_URL project.
// Usage (from web/):  node --env-file=.env.local scripts/apply-migrations.mjs
import postgres from 'postgres';
import { readFileSync } from 'node:fs';

const url = process.env.DATABASE_URL;
if (!url) { console.error('DATABASE_URL env var required'); process.exit(1); }

const sql = postgres(url, { prepare: false, max: 1, connect_timeout: 20 });

const files = [
  '../supabase/migrations/0001_schema.sql',
  'scripts/migrations_local/0002_reviews_reports.sql',
  'scripts/migrations_local/0003_face_verification.sql',
  '../supabase/migrations/0004_shipments.sql',
  '../supabase/migrations/0005_nfc_write.sql',
  '../supabase/migrations/0006_image_moderation.sql',
];

let failed = false;
for (const f of files) {
  const sqlText = readFileSync(f, 'utf8');
  try {
    await sql.unsafe(sqlText);
    console.log(`ok: ${f}`);
  } catch (e) {
    failed = true;
    console.error(`FAILED: ${f}: ${e.message}`);
  }
}
await sql.end();
process.exit(failed ? 1 : 0);
