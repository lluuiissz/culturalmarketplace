import { notFound, redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { getProduct, listCategories } from '@/lib/db';
import ProductForm from '../../ProductForm';
import ProductMedia from './ProductMedia';
import NfcSection from '@/components/NfcSection';

export const dynamic = 'force-dynamic';

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || session.role !== 'artisan') redirect('/auth/login?next=/artisan/products');
  const { id } = await params;
  const product = await getProduct(Number(id));
  if (!product || product.artisan_id !== session.id) notFound();
  const categories = await listCategories('product');

  return (
    <>
      <main className="mx-auto max-w-3xl px-4 py-10">
        <h1 className="font-serif text-3xl font-bold text-brand-900">Edit “{product.name}”</h1>
        <ProductMedia productId={product.id} initialMain={product.image_path} initialGallery={product.product_gallery} />
        <NfcSection productId={product.id} initialTag={product.nfc_tag_id} initialStatus={product.nfc_tag_status} />
        <div className="mt-6">
        <ProductForm
          mode="edit"
          productId={product.id}
          categories={categories}
          initial={{
            name: product.name, description: product.description ?? '', price: String(Number(product.price)),
            stock_quantity: String(product.stock_quantity), category: product.category ?? '',
            has_tutorial: product.has_tutorial, tutorial_title: product.tutorial_title ?? '',
            tutorial_description: product.tutorial_description ?? '',
            tutorial_price: product.tutorial_price != null ? String(Number(product.tutorial_price)) : '',
            tutorial_capacity: product.tutorial_capacity != null ? String(product.tutorial_capacity) : '',
            tutorial_fee_type: product.tutorial_fee_type ?? 'paid',
          }}
          initialHasVariations={product.has_variations}
          initialVariations={product.variations_data ?? []}
        />
        </div>
      </main>
    </>
  );
}
