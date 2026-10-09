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
      await sql`update products set image_path = ${image_path}, product_gallery = ${product_gallery ?? null} where id = ${productId}`;
    } else {
      const { updateProductMediaDemo } = await import('@/lib/db');
      updateProductMediaDemo(productId, image_path, product_gallery);
    }

    return NextResponse.json({
      status: 'success',
      image_path,
      product_gallery,
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
