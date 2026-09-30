import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { createProduct, listCategories, logActivity, getArtisan } from '@/lib/db';

// Categories are curated (admin-managed). Free-text would fragment the browse
// filter, so submissions must match an existing category (case-insensitive).
async function resolveCategory(raw: unknown): Promise<{ value: string | null; error?: string }> {
  if (raw == null || raw === '') return { value: null, error: 'Please select a category.' };
  const wanted = String(raw).trim().toLowerCase();
  const cats = await listCategories('product');
  const hit = cats.find((c) => c.name.toLowerCase() === wanted);
  return hit ? { value: hit.name } : { value: null, error: 'That category is no longer available — please pick one from the list.' };
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session || session.role !== 'artisan') {
    return NextResponse.json({ status: 'error', message: 'Unauthorized.' }, { status: 401 });
  }
  try {
    // Verification gating: only APPROVED artisans can publish products.
    // Pending/rejected/suspended artisans get a clear, honest message instead
    // of a product that silently never appears for buyers.
    const artisan = await getArtisan(session.id);
    if (!artisan || artisan.verification_status !== 'approved') {
      return NextResponse.json({ status: 'error', message: 'Your artisan account must be approved by an admin before you can list products.' }, { status: 403 });
    }
    const b = (await req.json()) as {
      name?: string; description?: string; price?: number; stock_quantity?: number; category?: string;
      has_tutorial?: boolean; tutorial_title?: string; tutorial_description?: string; tutorial_price?: number;
      tutorial_capacity?: number; tutorial_dates?: object[]; tutorial_fee_type?: 'paid' | 'free';
      has_variations?: boolean; variations_data?: object[];
    };
    if (!b.name) return NextResponse.json({ status: 'error', message: 'Product name is required.' }, { status: 400 });
    const cat = await resolveCategory(b.category);
    if (cat.error) return NextResponse.json({ status: 'error', message: cat.error }, { status: 422 });

    const id = await createProduct(session.id, {
      name: b.name,
      description: b.description ?? null,
      price: Number(b.price) || 0,
      stock_quantity: Number(b.stock_quantity) || 0,
      category: cat.value,
      has_tutorial: Boolean(b.has_tutorial),
      tutorial_title: b.tutorial_title ?? null,
      tutorial_description: b.tutorial_description ?? null,
      tutorial_price: b.tutorial_price != null ? Number(b.tutorial_price) : null,
      tutorial_capacity: b.tutorial_capacity != null ? Number(b.tutorial_capacity) : null,
      tutorial_dates: (b.tutorial_dates as never) ?? null,
      tutorial_fee_type: b.tutorial_fee_type ?? null,
      has_variations: Boolean(b.has_variations),
      variation_pricing: Boolean(b.has_variations),
      variations_data: (b.variations_data as never) ?? null,
    });
    await logActivity({ userId: session.id, role: 'artisan', userName: session.name, action: 'product_added', description: `Artisan ${session.name} added product "${b.name}"` });
    return NextResponse.json({ status: 'success', id });
  } catch {
    return NextResponse.json({ status: 'error', message: 'Could not save product.' }, { status: 500 });
  }
}
