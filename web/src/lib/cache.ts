// Tiny TTL cache for hot, rarely-changing reference data (settings, categories,
// artisan list). Every DB read costs ~100ms to Supabase (Singapore) from local
// dev, so caching these cuts 1-2 round-trips per page render.
//
// Invalidation: mutator functions call the matching invalidate() so writes are
// visible immediately; the TTL is only a safety net.
// The Map lives on globalThis so Next.js dev hot-reload reuses it instead of
// starting cold on every module re-evaluation.

type Entry<T> = { value: T; expires: number };

const TTL_MS = 30_000;

declare global {
  // eslint-disable-next-line no-var
  var __refCache: Map<string, Entry<unknown>> | undefined;
}

function cache(): Map<string, Entry<unknown>> {
  if (!globalThis.__refCache) globalThis.__refCache = new Map();
  return globalThis.__refCache;
}

/** Get-or-load a cached value. `load` only runs on miss/expiry. */
export async function cached<T>(key: string, load: () => Promise<T>, ttlMs: number = TTL_MS): Promise<T> {
  const hit = cache().get(key);
  if (hit && hit.expires > Date.now()) return hit.value as T;
  const value = await load();
  cache().set(key, { value, expires: Date.now() + ttlMs });
  return value;
}

/** Drop one key or the whole cache (prefix match when key ends with '*'). */
export function invalidate(key: string): void {
  const c = cache();
  if (key === '*') return void c.clear();
  if (key.endsWith('*')) {
    const prefix = key.slice(0, -1);
    for (const k of c.keys()) if (k.startsWith(prefix)) c.delete(k);
    return;
  }
  c.delete(key);
}
