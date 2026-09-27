import { notFound, redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { getProduct } from '@/lib/db';
import ProductMedia from '../../edit/[id]/ProductMedia';

export const dynamic = 'force-dynamic';

// Intermediate step in the create flow: photos first. NFC is offered as an
// optional next step — never required.
export default async function NewProductMediaPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || session.role !== 'artisan') redirect('/auth/login?next=/artisan/products');
  const { id } = await params;
  const product = await getProduct(Number(id));
  if (!product || product.artisan_id !== session.id) notFound();

  return (
    <>
      <main className="mx-auto max-w-3xl px-4 py-10">
        <h1 className="font-serif text-3xl font-bold text-brand-900">Add photos to “{product.name}”</h1>
        <p className="mt-1 text-stone-500">
          Buyers are far more likely to order when they can see the craft. You can always change these later.
        </p>
        <ProductMedia productId={product.id} initialMain={product.image_path} initialGallery={product.product_gallery} />
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <a href="/artisan/products" className="btn-primary px-6 py-2.5">
            Done — go to my products
          </a>
          <a href={`/artisan/products/${product.id}/nfc`} className="btn-outline px-6 py-2.5">
            🏷️ Add an NFC tag (optional)
          </a>
        </div>
        <p className="mt-2 text-xs text-stone-400">
          NFC is optional — it lets buyers tap a card to verify authenticity. You can add or skip it any time.
        </p>
      </main>
    </>
  );
}
