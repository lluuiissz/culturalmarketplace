// Media storage, dual backend like the database layer:
//   1. Supabase Storage  - when SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY are set
//     (service key from Dashboard -> Project Settings -> API; keys derived from
//      JWT_SECRET do not work - it is a separate dashboard secret)
//   2. Local disk        - fallback writing into public/uploads/<bucket>/...,
//     served by Next.js at /uploads/... (works in dev and on the VPS;
//     Vercel would need S3/Supabase instead - noted in .env.example)
//
// Buckets: product-media (public), profile-pictures (public), verification-docs (private).
// Private files are read back by admins via getVerificationDocUrl (signed URL on
// Supabase; the local fallback only supports the public buckets for display).

import { createClient } from '@supabase/supabase-js';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';

const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export const storageEnabled = Boolean(SUPABASE_URL && SERVICE_KEY);

export type Bucket = 'product-media' | 'profile-pictures' | 'verification-docs';

const PUBLIC_BUCKETS: Bucket[] = ['product-media', 'profile-pictures'];

function client() {
  return createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });
}

export type UploadResult = { path: string | null; publicUrl: string | null };

/** Sanitized, collision-free object path: <prefix>/<timestamp>-<rand>-<safe-name> */
export function objectPath(prefix: string, originalName: string): string {
  const safe = originalName.toLowerCase().replace(/[^a-z0-9.\-_]/g, '_').replace(/_{2,}/g, '_').slice(-80) || 'file';
  const rand = crypto.randomBytes(4).toString('hex');
  return `${prefix}/${Date.now()}-${rand}-${safe}`;
}

/** Upload bytes; returns storage path plus a displayable URL when the bucket is public. */
export async function uploadFile(bucket: Bucket, objectPathStr: string, data: ArrayBuffer, contentType: string): Promise<UploadResult> {
  if (storageEnabled) {
    const sb = client();
    const { error } = await sb.storage.from(bucket).upload(objectPathStr, data, { contentType, upsert: true });
    if (error) throw new Error(`Storage upload failed: ${error.message}`);
    const publicUrl = PUBLIC_BUCKETS.includes(bucket)
      ? sb.storage.from(bucket).getPublicUrl(objectPathStr).data.publicUrl
      : null;
    return { path: `${bucket}/${objectPathStr}`, publicUrl };
  }

  // Local disk fallback
  const isPrivate = bucket === 'verification-docs';
  // Private docs stay OUTSIDE public/ (never web-served locally); admins review
  // them in the Supabase dashboard or via a future admin download route.
  const dir = isPrivate ? 'verification-uploads' : path.join('public', 'uploads');
  const rel = path.join(dir, objectPathStr);
  const abs = path.join(process.cwd(), rel);
  await mkdir(path.dirname(abs), { recursive: true });
  await writeFile(abs, Buffer.from(data));
  const url = isPrivate ? null : `/${['uploads', objectPathStr].join('/')}`;
  return { path: `${bucket}/${objectPathStr}`, publicUrl: url };
}

/** URL to display a previously uploaded object (public buckets only). */
export async function getPublicUrlFor(bucket: Bucket, objectPathStr: string): Promise<string | null> {
  if (storageEnabled) {
    const sb = client();
    return PUBLIC_BUCKETS.includes(bucket)
      ? sb.storage.from(bucket).getPublicUrl(objectPathStr).data.publicUrl
      : null;
  }
  return `/${['uploads', objectPathStr].join('/')}`;
}

/** Short-lived signed URL for admins to view private verification documents. */
export async function getVerificationDocUrl(path: string, expiresInSeconds = 300): Promise<string | null> {
  if (!storageEnabled) return null;
  const sb = client();
  const prefix = 'verification-docs/';
  const object = path.startsWith(prefix) ? path.slice(prefix.length) : path;
  const { data } = await sb.storage.from('verification-docs').createSignedUrl(object, expiresInSeconds);
  return data?.signedUrl ?? null;
}
