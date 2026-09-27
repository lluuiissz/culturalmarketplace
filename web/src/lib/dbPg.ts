// Single shared Postgres pool for the whole app.
//
// Why a globalThis singleton:
//  - Next.js dev hot-reload re-evaluates modules, which would otherwise create
//    a new pool (and new DB connections) on every edit.
//  - Supabase Supavisor SESSION mode caps clients (default 15), so multiple
//    module-level pools quickly exhaust it with EMAXCONNSESSION.
// One pool, max 3, reused across reloads -> well under the cap.
import postgres from 'postgres';

const DATABASE_URL = process.env.DATABASE_URL || '';

declare global {
  // eslint-disable-next-line no-var
  var __pgPool: ReturnType<typeof postgres> | null;
}

function getPool(): ReturnType<typeof postgres> | null {
  if (!DATABASE_URL) return null;
  if (!globalThis.__pgPool) {
    globalThis.__pgPool = postgres(DATABASE_URL, {
      prepare: false, // required by Supavisor/pgbouncer transaction+session modes
      max: 3,
      // KEEP CONNECTIONS WARM — LCP critical. Every new TCP+TLS+auth handshake
      // to Supabase (Singapore) costs ~650ms, and a cold connection was being
      // paid on nearly every navigation: idle_timeout 20s tore connections down
      // after a 20s pause, and max_lifetime 5min rotated even busy sessions.
      // idle_timeout 0 keeps established connections open (bounded by Supavisor's
      // own server-side idle limit); max_lifetime 30min only rotates truly
      // long-lived busy connections. Still ≤3 conns, well under the 15 cap.
      idle_timeout: 0,
      max_lifetime: 60 * 30,
      // Through Supavisor the driver cannot fetch column type metadata, so jsonb
      // values arrive as raw JSON strings. Register explicit parsers for the json
      // (114) and jsonb (3802) OIDs so every query gets real JS objects back.
      types: {
        json: {
          to: 114,
          from: [114, 3802],
          serialize: (x: unknown) => JSON.stringify(x),
          parse: (x: string) => JSON.parse(x),
        },
      },
    });
  }
  return globalThis.__pgPool;
}

const sql = getPool() as unknown as ReturnType<typeof postgres>;

const usingPg = DATABASE_URL.length > 0;

/** timestamptz values arrive as JS Date through the pooler — normalize to ISO strings. */
export function tsString(v: unknown): string | null {
  if (v == null) return null;
  if (v instanceof Date) return v.toISOString();
  return String(v);
}

/** jsonb safety net: the pool's type parser should return objects, but if a raw
 *  JSON string ever slips through (older cached pools, raw queries), parse it. */
export function parseJsonish<T>(v: unknown): T | null {
  if (v == null) return null;
  if (typeof v === 'string') {
    try { return JSON.parse(v) as T; } catch { return null; }
  }
  return v as T;
}

export { sql, usingPg };
