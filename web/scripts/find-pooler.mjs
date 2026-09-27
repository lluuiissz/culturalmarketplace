// Finds the correct Supavisor pooler region for the project ref in DATABASE_URL,
// then verifies auth. Usage (from web/):  node --env-file=.env.local scripts/find-pooler.mjs
import postgres from 'postgres';

const raw = process.env.DATABASE_URL || '';
const m = raw.match(/:\/\/([^:]+):([^@]+)@/);
if (!m) { console.error('Cannot parse DATABASE_URL'); process.exit(1); }
const password = m[2];
const ref = (raw.match(/db\.([a-z0-9]+)\.supabase\.co/) ?? [])[1];
if (!ref) { console.error('No project ref found in DATABASE_URL'); process.exit(1); }

const REGIONS = ['ap-southeast-1', 'us-east-1', 'us-west-1', 'us-east-2', 'eu-west-1', 'eu-west-2', 'eu-central-1', 'ap-south-1', 'ap-northeast-1', 'ap-southeast-2', 'sa-east-1', 'ca-central-1'];

for (const region of REGIONS) {
  const host = `aws-0-${region}.pooler.supabase.com`;
  const url = `postgresql://postgres.${ref}:${encodeURIComponent(password)}@${host}:5432/postgres`;
  try {
    const sql = postgres(url, { prepare: false, max: 1, connect_timeout: 6, idle_timeout: 1 });
    const r = await sql`select current_database() as db, current_user as usr, version() as v`;
    console.log(`✅ WORKS: ${host}`);
    console.log(`   database=${r[0].db} user=${r[0].usr}`);
    console.log(`   ${String(r[0].v).split(',')[0]}`);
    console.log(`\nUse this DATABASE_URL:\n${url}`);
    await sql.end();
    process.exit(0);
  } catch (e) {
    const msg = String(e.message || e).split('\n')[0];
    console.log(`✗ ${host}: ${msg.slice(0, 90)}`);
  }
}
console.log('No pooler region accepted the credentials — password may be wrong or project paused.');
