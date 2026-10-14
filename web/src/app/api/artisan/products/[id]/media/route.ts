import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getProduct } from '@/lib/db';
import { uploadFile, objectPath } from '@/lib/storage';
import { moderateUpload } from '@/lib/imageModeration';

// Fast, direct product media upload (artisan-owned).
// Stores under product-media bucket: products/<artisanId>/<productId>/<file>
// Directly updates the product row (image_path / product_gallery) in the database.
const MAX_BYTES = 8 * 1024 * 1024;
const ALLOWED = ['image/jpeg', 'image/png', 'image/webp'];

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

    const buf = Buffer.from(await file.arrayBuffer());
    const contentType = file.type;
    const fileName = `${Date.now()}-${file.name ? file.name.replace(/[^a-zA-Z0-9._-]/g, '_') : 'image.jpg'}`;

    // Fast resolution check
    const verdict = await moderateUpload({ arrayBuffer: async () => buf, type: contentType });
    if (verdict.kind === 'reject') {
      return NextResponse.json({ status: 'error', message: verdict.reasons.join(' ') }, { status: 422 });
    }

    // Direct upload to Supabase Storage
    const p = objectPath(`products/${session.id}/${productId}`, fileName);
    const { publicUrl } = await uploadFile(
      'product-media',
      p,
      buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) as ArrayBuffer,
      contentType
    );

    if (!publicUrl) {
      return NextResponse.json({ status: 'error', message: 'Upload failed to produce a public URL.' }, { status: 500 });
    }

    const { sql, usingPg } = await import('@/lib/dbPg');
    const { invalidate } = await import('@/lib/cache');

    // Fetch fresh database state directly to prevent stale cached image_path from overwriting main image
    let currentRows = usingPg
      ? await sql`select image_path, product_gallery from products where id = ${productId}`
      : [{ image_path: product.image_path, product_gallery: product.product_gallery }];

    let new_image_path = (currentRows[0]?.image_path as string) ?? null;
    let new_gallery: string[] = Array.isArray(currentRows[0]?.product_gallery)
      ? (currentRows[0].product_gallery as string[])
      : [];

    if (kind === 'main') {
      new_image_path = publicUrl;
    } else {
      if (!new_gallery.includes(publicUrl)) new_gallery.push(publicUrl);
      new_gallery = new_gallery.slice(0, 20); // support up to 20 gallery images
    }

    if (usingPg) {
      const updated = await sql`
        update products
        set image_path = ${new_image_path}, product_gallery = ${JSON.stringify(new_gallery)}::jsonb
        where id = ${productId}
        returning image_path, product_gallery
      `;
      new_image_path = (updated[0]?.image_path as string) ?? null;
      new_gallery = Array.isArray(updated[0]?.product_gallery)
        ? (updated[0].product_gallery as string[])
        : [];
    } else {
      const { updateProductMediaDemo } = await import('@/lib/db');
      updateProductMediaDemo(productId, new_image_path, new_gallery);
    }

    // Invalidate product caches so fresh images are immediately served everywhere
    invalidate(`product:${productId}`);
    invalidate('active_products*');

    return NextResponse.json({
      status: 'success',
      image_path: new_image_path,
      product_gallery: new_gallery,
      url: publicUrl,
    });
  } catch (e) {
    return NextResponse.json(
      { status: 'error', message: e instanceof Error ? e.message : 'Upload failed.' },
      { status: 500 },
    );
  }
}

export async function GET() {
  return NextResponse.json({ status: 'success' });
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

  const { sql, usingPg } = await import('@/lib/dbPg');
  const { invalidate } = await import('@/lib/cache');

  let currentRows = usingPg
    ? await sql`select image_path, product_gallery from products where id = ${productId}`
    : [{ image_path: product.image_path, product_gallery: product.product_gallery }];

  let new_image_path: string | null = (currentRows[0]?.image_path as string | null) ?? null;
  let new_gallery: string[] = Array.isArray(currentRows[0]?.product_gallery)
    ? (currentRows[0].product_gallery as string[])
    : [];

  // kind=main-remove clears the main image; otherwise remove a gallery URL.
  if (kind === 'main-remove') {
    new_image_path = null;
  } else if (url) {
    new_gallery = new_gallery.filter((g) => g !== url);
  } else {
    return NextResponse.json({ status: 'error', message: 'url or kind=main-remove required' }, { status: 400 });
  }

  if (usingPg) {
    await sql`update products set image_path = ${new_image_path}, product_gallery = ${JSON.stringify(new_gallery)}::jsonb where id = ${productId}`;
  } else {
    const { updateProductMediaDemo } = await import('@/lib/db');
    updateProductMediaDemo(productId, new_image_path, new_gallery);
  }

  invalidate(`product:${productId}`);
  invalidate('active_products*');

  return NextResponse.json({ status: 'success', image_path: new_image_path, product_gallery: new_gallery });
}
