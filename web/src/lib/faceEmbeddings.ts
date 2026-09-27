// Read/store artisan face embeddings for duplicate-face detection.
// Postgres: face_embeddings table (0001). Demo mode: seedArtisans metadata.
import { sql, usingPg } from './dbPg';
import type { Artisan } from './types';

export type StoredEmbedding = { artisan_id: number; embedding: number[] };

export async function listFaceEmbeddings(): Promise<StoredEmbedding[]> {
  if (usingPg) {
    const rows = await sql`select artisan_id, embedding from face_embeddings`;
    return (rows as unknown as Array<{ artisan_id: unknown; embedding: unknown }>).map((r) => ({
      artisan_id: Number(r.artisan_id),
      embedding: r.embedding as number[],
    }));
  }
  return (seedArtisansDemo() ?? [])
    .filter((a) => Array.isArray(a.face_embedding) && a.face_embedding.length === 128)
    .map((a) => ({ artisan_id: a.id, embedding: a.face_embedding as number[] }));
}

export async function saveFaceEmbedding(artisanId: number, embedding: number[]): Promise<void> {
  if (usingPg) {
    // Pass the array as-is: the pool's json type serializer produces proper
    // jsonb. (Pre-stringifying here double-encodes into a jsonb string.)
    await sql`insert into face_embeddings (artisan_id, embedding) values (${artisanId}, ${embedding})`;
    return;
  }
  const list = seedArtisansDemo() ?? [];
  const a = list.find((x) => x.id === artisanId);
  if (a) a.face_embedding = embedding;
}

// The demo store keeps artisans in db.ts's in-memory store; import lazily to
// avoid a cycle. listApprovedArtisans lives in db.ts which already imports us.
import { seedArtisans } from './seed';

type WithEmbedding = Artisan & { face_embedding?: number[] | null };

function seedArtisansDemo(): Array<Artisan & { face_embedding?: number[] | null }> | null {
  return usingPg ? null : (seedArtisans as unknown as Array<Artisan & { face_embedding?: number[] | null }>);
}

export type { WithEmbedding };
