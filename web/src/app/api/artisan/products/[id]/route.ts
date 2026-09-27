import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { updateProduct, listCategories, logActivity, getProduct } from '@/lib/db';

// Full product edit — every field the create form offers (tutorial,
// variations, materials included), ownership-enforced.
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || session.role !== 'artisan') {
    return NextResponse.json({ status: 'error' }, { status: 401 });
  }
  const { id } = await params;
  const productId = Number(id);
  const existing = await getProduct(productId);
  if (!existing || existing.artisan_id !== session.id) {
    return NextResponse.json({ status: 'error', message: 'Product not found.' }, { status: 404 });
  }

  const b = (await req.json()) as Record<string, unknown>;
  // Same curated-category rule as create: trim + case-insensitive match.
  let category: string | undefined;
  if (b.category !== undefined) {
    if (b.category === null || b.category === '') {
      return NextResponse.json({ status: 'error', message: 'Please select a category.' }, { status: 422 });
    }
    const wanted = String(b.category).trim().toLowerCase();
    const cats = await listCategories('product');
    const hit = cats.find((c) => c.name.toLowerCase() === wanted);
    if (!hit) return NextResponse.json({ status: 'error', message: 'That category is no longer available — please pick one from the list.' }, { status: 422 });
    category = hit.name;
  }
  await updateProduct(session.id, productId, {
    name: (b.name as string) ?? undefined,
    description: (b.description as string) ?? undefined,
    price: b.price != null ? Number(b.price) : undefined,
    stock_quantity: b.stock_quantity != null ? Number(b.stock_quantity) : undefined,
    category,
    has_tutorial: typeof b.has_tutorial === 'boolean' ? b.has_tutorial : undefined,
    tutorial_title: (b.tutorial_title as string) ?? undefined,
    tutorial_description: (b.tutorial_description as string) ?? undefined,
    tutorial_price: b.tutorial_price !== undefined ? (b.tutorial_price === null ? null : Number(b.tutorial_price)) : undefined,
    tutorial_capacity: b.tutorial_capacity !== undefined ? (b.tutorial_capacity === null ? null : Number(b.tutorial_capacity)) : undefined,
    tutorial_fee_type: (b.tutorial_fee_type as 'paid' | 'free') ?? undefined,
    has_variations: typeof b.has_variations === 'boolean' ? b.has_variations : undefined,
    variation_pricing: typeof b.has_variations === 'boolean' ? b.has_variations : undefined,
    variations_data: b.variations_data !== undefined ? (b.variations_data as never) : undefined,
    materials_used: (b.materials_used as string) ?? undefined,
  });
  await logActivity({ userId: session.id, role: 'artisan', userName: session.name, action: 'product_updated', description: `Artisan ${session.name} updated product "${(b.name as string) || existing.name}"` });
  return NextResponse.json({ status: 'success' });
}
