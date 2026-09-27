// Perceptual-hash storage for upload dedup. Postgres-backed (the demo store
// is ephemeral, so dedup simply isn't enforced there — acceptable for previews).
import { sql, usingPg } from './dbPg';

const NEAR_DUP_CANDIDATES = `
  select hash, product_id from product_media_hashes
  where hash ~ '^[0-9a-f]{16}$'
`;

export async function isDuplicateMediaHash(hash: string, maxHamming: number): Promise<string | null> {
  if (!usingPg) return null;
  // Exact match first (index hit), then a bounded scan for near-duplicates.
  const exact = await sql`select product_id from product_media_hashes where hash = ${hash} limit 1`;
  if (exact.length) return hash;
  const all = await sql.unsafe(NEAR_DUP_CANDIDATES);
  for (const row of all) {
    let x = BigInt('0x' + row.hash) ^ BigInt('0x' + hash);
    let dist = 0;
    while (x) { dist += Number(x & 1n); x >>= 1n; }
    if (dist <= maxHamming) return row.hash;
  }
  return null;
}

export async function saveMediaHash(productId: number, hash: string): Promise<void> {
  if (!usingPg || !hash) return;
  await sql`insert into product_media_hashes (product_id, hash) values (${productId}, ${hash}) on conflict (hash) do nothing`;
}

export async function removeMediaHashes(productId: number, hashes: string[]): Promise<void> {
  if (!usingPg || hashes.length === 0) return;
  await sql`delete from product_media_hashes where product_id = ${productId} and hash = any(${hashes})`;
}
