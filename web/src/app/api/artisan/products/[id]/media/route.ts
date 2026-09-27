import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getProduct, pushNotification } from '@/lib/db';
import { uploadFile, objectPath } from '@/lib/storage';
import { moderateUpload, saveMediaHashRef } from '@/lib/imageModeration';

// Product media upload (artisan-owned). Stores under product-media bucket:
//   products/<artisanId>/<productId>/<file>
// Updates the product row (image_path / product_gallery) in the same request.
//
// Moderation pipeline (NSFW + duplicate + craft-relevance) runs on EVERY upload
// but ASYNCHRONOUSLY: POST validates cheaply, queues the job, and returns 202
// with a jobId in well under a second — the artisan sees an instant UI while
// the classifier (3-8s cold) works in the background. GET ?jobId= polls:
//   { status: 'pending' }                     — still processing
//   { status: 'success', image_path, ... }    — stored (moderation: ok|pending_review)
//   { status: 'error', message, code }        — rejected (too small/dup/NSFW/unlikely craft)
const MAX_BYTES = 8 * 1024 * 1024;
const ALLOWED = ['image/jpeg', 'image/png', 'image/webp'];

interface JobResult {
  status: 'success' | 'error';
  code?: number;
  message?: string;
  image_path?: string | null;
  product_gallery?: string[] | null;
  url?: string;
  moderation?: 'ok' | 'pending_review';
  // Advisory CLIP handicraft-relevance score (0..1) — informational only.
  craft?: number | null;
}

// Completed job results, GC'd after 2 minutes (client polls every ~1.2s).
const jobs = new Map<string, JobResult>();

function gcJob(id: string) {
  setTimeout(() => jobs.delete(id), 120_000);
}

// Heavy native libs (libvips/sharp, tfjs, ONNX-CLIP) must not run concurrently
// in one Node process on Windows — races there can abort libvips and take the
// whole server down. Workers chain onto this promise: POSTs still return
// instantly; the moderation/storage work itself runs one upload at a time.
let workerChain: Promise<void> = Promise.resolve();

export async function POST(req: Request) {
  const session = await getSession();
  if (!session || session.role !== 'artisan') {
    return NextResponse.json({ status: 'error', message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const form = await req.formData();
    const productId = Number(form.get('productId'));
    const kind = String(form.get('kind') ?? 'main'); // 'main' | 'gallery'
    const file = form.get('file') as File | null;

    if (!productId || !file) {
      return NextResponse.json({ status: 'error', message: 'productId and file are required.' }, { status: 400 });
    }
    if (!ALLOWED.includes(file.type)) {
      return NextResponse.json({ status: 'error', message: 'Only JPEG, PNG, or WebP images are allowed.' }, { status: 415 });
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json({ status: 'error', message: 'Image must be under 8 MB.' }, { status: 413 });
    }

    const product = await getProduct(productId);
    if (!product) {
      return NextResponse.json({ status: 'error', message: 'Product not found.' }, { status: 404 });
    }
    if (product.artisan_id !== session.id) {
      return NextResponse.json({ status: 'error', message: 'This product belongs to another artisan.' }, { status: 403 });
    }

    // Snapshot the bytes now — the request body dies when we return 202.
    const buf = Buffer.from(await file.arrayBuffer());
    const contentType = file.type;
    const fileName = file.name || 'image.jpg';
    const jobId = crypto.randomUUID();
    // No placeholder: a jobId absent from the map simply polls as "pending".
    // The worker below sets the final result exactly once.

    // Fire-and-forget worker: moderation → storage → DB row update (serialized).
    const work = async (): Promise<void> => {
      try {
        const verdict = await moderateUpload({ arrayBuffer: async () => buf, type: contentType });
        if (verdict.kind === 'reject') {
          jobs.set(jobId, { status: 'error', code: 422, message: verdict.reasons.join(' ') });
          return;
        }

        const p = objectPath(`products/${session.id}/${productId}`, fileName);
        const { publicUrl } = await uploadFile('product-media', p, buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) as ArrayBuffer, contentType);        if (!publicUrl) {
          jobs.set(jobId, { status: 'error', code: 500, message: 'Upload produced no URL.' });
          return;
        }

        let image_path = product.image_path ?? null;
        let product_gallery = product.product_gallery ?? null;
        if (kind === 'main') {
          image_path = publicUrl;
        } else {
          const list = Array.isArray(product_gallery) ? [...product_gallery] : [];
          if (!list.includes(publicUrl)) list.push(publicUrl);
          product_gallery = list.slice(0, 8); // cap gallery at 8 images
        }

        const { sql, usingPg } = await import('@/lib/dbPg');
        if (usingPg) {
          if (verdict.kind === 'flag') {
            await sql`update products set image_path = ${image_path}, product_gallery = ${product_gallery ?? null}, status = 'pending_review' where id = ${productId}`;
            await pushNotification({ userId: session.id, role: 'artisan', type: 'moderation', message: `Your photo for “${product.name}” was uploaded and is awaiting a quick review before it becomes visible to buyers. This usually takes under 24 hours.` });
          } else {
            await sql`update products set image_path = ${image_path}, product_gallery = ${product_gallery ?? null} where id = ${productId}`;
          }
        } else {
          const { updateProductMediaDemo } = await import('@/lib/db');
          updateProductMediaDemo(productId, image_path, product_gallery);
        }
        if (verdict.kind !== 'flag') {
          await saveMediaHashRef(productId, verdict.hash);
        }

        jobs.set(jobId, {
          status: 'success', image_path, product_gallery, url: publicUrl,
          moderation: verdict.kind === 'flag' ? 'pending_review' : 'ok',
          craft: verdict.craft,
        });
      } catch (e) {
        jobs.set(jobId, { status: 'error', code: 500, message: e instanceof Error ? e.message : 'Upload failed.' });
      } finally {
        gcJob(jobId);
      }
    };
    workerChain = workerChain.then(work, work);

    return NextResponse.json({ status: 'pending', jobId }, { status: 202 });
  } catch (e) {
    return NextResponse.json(
      { status: 'error', message: e instanceof Error ? e.message : 'Upload failed.' },
      { status: 500 },
    );
  }
}

export async function GET(req: Request) {
  const session = await getSession();
  if (!session || session.role !== 'artisan') {
    return NextResponse.json({ status: 'error', message: 'Unauthorized' }, { status: 401 });
  }
  const { searchParams } = new URL(req.url);
  const jobId = searchParams.get('jobId');
  if (!jobId) return NextResponse.json({ status: 'error', message: 'jobId required' }, { status: 400 });

  const job = jobs.get(jobId);
  if (!job) return NextResponse.json({ status: 'pending' });
  const { ...rest } = job;
  return NextResponse.json({ ...rest, status: job.status });
}

export async function DELETE(req: Request) {
  const session = await getSession();
  if (!session || session.role !== 'artisan') {
    return NextResponse.json({ status: 'error', message: 'Unauthorized' }, { status: 401 });
  }
  const { searchParams } = new URL(req.url);
  const productId = Number(searchParams.get('productId'));
  const kind = searchParams.get('kind');
  const url = searchParams.get('url');
  if (!productId) return NextResponse.json({ status: 'error', message: 'productId required' }, { status: 400 });

  const product = await getProduct(productId);
  if (!product || product.artisan_id !== session.id) {
    return NextResponse.json({ status: 'error', message: 'Not found.' }, { status: 404 });
  }

  // kind=main-remove clears the main image; otherwise remove a gallery URL.
  let image_path = product.image_path;
  let gallery = product.product_gallery ?? [];
  if (kind === 'main-remove') {
    image_path = null;
  } else if (url) {
    gallery = gallery.filter((g) => g !== url);
  } else {
    return NextResponse.json({ status: 'error', message: 'url or kind=main-remove required' }, { status: 400 });
  }

  const { sql, usingPg } = await import('@/lib/dbPg');
  if (usingPg) {
    await sql`update products set image_path = ${image_path}, product_gallery = ${gallery} where id = ${productId}`;
  } else {
    const { updateProductMediaDemo } = await import('@/lib/db');
    updateProductMediaDemo(productId, image_path, gallery);
  }
  return NextResponse.json({ status: 'success', image_path, product_gallery: gallery });
}
