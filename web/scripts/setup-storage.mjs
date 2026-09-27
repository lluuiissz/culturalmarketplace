// Ensures the storage buckets exist (idempotent). Two paths:
//   1. With SUPABASE_SERVICE_ROLE_KEY: uses the Storage API.
//   2. With DATABASE_URL only: creates buckets via SQL (storage.buckets is a
//      normal Postgres table exposed by Supabase's storage schema).
// Also creates the local fallback directory for non-Supabase mode.
// Usage: cd web && node --env-file=.env.local scripts/setup-storage.mjs
import postgres from 'postgres';
import { mkdirSync } from 'node:fs';

const url = process.env.DATABASE_URL;
if (!url) { console.error('DATABASE_URL required'); process.exit(1); }

const sql = postgres(url, { prepare: false, max: 1, connect_timeout: 20 });

const buckets = [
  { name: 'product-media', public: true },
  { name: 'profile-pictures', public: true },
  { name: 'verification-docs', public: false },
];

try {
  for (const b of buckets) {
    await sql`insert into storage.buckets (id, name, public) values (${b.name}, ${b.name}, ${b.public})
      on conflict (id) do update set public = ${b.public}`;
    console.log(`ok: ${b.name} (${b.public ? 'public' : 'private'})`);
  }
} finally {
  await sql.end();
}

mkdirSync('public/uploads', { recursive: true });
console.log('ok: local fallback dir public/uploads');
