// MariaDB → Postgres importer. See README.md in this folder.
// Requires: npm i mysql2 postgres dotenv

import mysql from 'mysql2/promise';
import postgres from 'postgres';
import 'dotenv/config';

const MARIA = {
  host: process.env.MARIA_HOST ?? '127.0.0.1',
  port: Number(process.env.MARIA_PORT ?? 3306),
  user: process.env.MARIA_USER ?? 'root',
  password: process.env.MARIA_PASSWORD ?? '',
  database: process.env.MARIA_DB ?? 'online_marketplace',
};
const PG = process.env.DATABASE_URL;
if (!PG) {
  console.error('DATABASE_URL (target Postgres/Supabase) is required.');
  process.exit(1);
}

const mysql = await mysql.createConnection(MARIA);
const pg = postgres(PG, { prepare: false, max: 2 });

// tables in FK-safe insertion order
const TABLES = [
  'users', 'artisans', 'customers', 'admins', 'categories', 'products',
  'cart_items', 'orders', 'order_items', 'customer_addresses',
  'chat_conversations', 'chat_messages', 'notifications',
  'activity_logs', 'reports', 'settings', 'face_embeddings',
];

// MariaDB enum → text values pass straight through; datetime strings parse as
// ISO for timestamptz; JSON-in-text columns parsed to objects for jsonb.
const JSON_COLS = new Set([
  'attributes', 'variations_data', 'selected_session', 'nfc_tag_history',
  'tutorial_dates', 'product_gallery', 'tutorial_gallery', 'tutorial_learnings',
  'embedding', 'data',
]);
const TINYINT_BOOL_COLS = new Set(['is_verified', 'is_read', 'has_tutorial', 'has_variations', 'variation_pricing', 'is_default']);

function transform(table, row) {
  const out = {};
  for (const [k, v] of Object.entries(row)) {
    if (v === undefined) { out[k] = null; continue; }
    if (JSON_COLS.has(k) && typeof v === 'string') {
      try { out[k] = JSON.parse(v); } catch { out[k] = null; }
      continue;
    }
    if (TINYINT_BOOL_COLS.has(k)) { out[k] = v == null ? null : Boolean(Number(v)); continue; }
    // MariaDB datetimes come as JS Date objects from mysql2 → ISO strings
    if (v instanceof Date) { out[k] = v.toISOString(); continue; }
    out[k] = v;
  }
  return out;
}

async function copyTable(table) {
  const [rows] = await mysql.query(`SELECT * FROM \`${table}\``);
  if (!rows.length) { console.log(`• ${table}: 0 rows`); return 0; }

  const cols = Object.keys(rows[0]);
  const colList = cols.map((c) => `"${c}"`).join(', ');
  let count = 0;

  for (let i = 0; i < rows.length; i += 200) {
    const batch = rows.slice(i, i + 200).map((r) => transform(table, r));
    await pg`insert into ${pg(table)} ${pg(batch, ...cols)} on conflict do nothing`;
    count += batch.length;
  }
  console.log(`• ${table}: ${count} rows copied`);
  return count;
}

try {
  console.log(`Copying from MariaDB ${MARIA.database} → Postgres…`);
  await pg`truncate table ${pg(TABLES.filter((t) => t !== 'settings'))} restart identity cascade`;
  for (const t of TABLES) {
    try {
      await copyTable(t);
    } catch (e) {
      console.warn(`! ${t}: skipped — ${e.message}`);
    }
  }
  // Postgres identity columns need a bump after explicit-id inserts
  for (const t of TABLES) {
    if (t === 'settings') continue;
    try {
      await pg`select setval(pg_get_serial_sequence(${t}, 'id'), coalesce((select max(id) from ${pg(t)}), 1))`;
    } catch { /* settings has text PK; ok */ }
  }
  console.log('✅ Migration complete.');
} finally {
  await mysql.end();
  await pg.end();
}
