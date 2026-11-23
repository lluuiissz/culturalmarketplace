// Tiny TTL cache for hot, rarely-changing reference data (settings, categories,
// artisan list). Every DB read costs ~100ms to Supabase (Singapore) from local
// dev, so caching these cuts 1-2 round-trips per page render.
//
// Invalidation: mutator functions call the matching invalidate() so writes are
// visible immediately; the TTL is only a safety net.
// The Map lives on globalThis so Next.js dev hot-reload reuses it instead of
// starting cold on every module re-evaluation.

type Entry<T> = { value: T; expires: number } | { promise: Promise<T> };

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
  const entries = cache();
  const existing = entries.get(key);
  if (existing && 'promise' in existing) return existing.promise as Promise<T>;
  if (existing && existing.expires > Date.now()) return existing.value as T;

  const entry: Entry<T> = { promise: Promise.resolve().then(load) };
  entries.set(key, entry);
  try {
    const value = await entry.promise;
    if (entries.get(key) === entry) {
      entries.set(key, { value, expires: Date.now() + ttlMs });
    }
    return value;
  } catch (error) {
    if (entries.get(key) === entry) entries.delete(key);
    throw error;
  }
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
