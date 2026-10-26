import Link from 'next/link';
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
      <main className="mx-auto max-w-4xl px-4 py-10 space-y-6">
        {/* Breadcrumb Navigation & Quick Actions */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-200 pb-3 text-xs">
          <div className="flex items-center gap-2">
            <Link
              href="/artisan/products"
              className="font-medium text-brand-700 hover:text-brand-900 hover:underline"
            >
              ← Back to My Products
            </Link>
            <span className="text-stone-300">/</span>
            <Link
              href="/artisan/experiences"
              className="text-stone-600 hover:text-stone-800 hover:underline"
            >
              Workshops List
            </Link>
          </div>

          <div className="flex items-center gap-2">
            {product.has_tutorial && (
              <Link
                href={`/artisan/tutorial-attendees/${product.id}`}
                className="btn-outline px-2.5 py-1 text-xs"
              >
                👥 Attendees Roster
              </Link>
            )}
            <Link
              href={`/customer/browse/${product.id}`}
              target="_blank"
              className="btn-outline px-2.5 py-1 text-xs text-stone-600 hover:text-stone-900"
            >
              👁️ View as Buyer ↗
            </Link>
          </div>
        </div>

        {/* Page Title & Status Pill */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="font-serif text-3xl font-bold text-brand-900">
              Edit “{product.name}”
            </h1>
            <p className="mt-1 text-sm text-stone-500">
              Update craft pricing, inventory, cultural workshop sessions, custom variations, and photos.
            </p>
          </div>
          <span
            className={`badge uppercase font-bold text-xs px-3 py-1 ${
              product.status === 'active'
                ? 'bg-ochre-100 text-ochre-900 border border-ochre-300'
                : 'bg-stone-100 text-stone-600'
            }`}
          >
            ● {product.status}
          </span>
        </div>

        {/* Product Media Uploader */}
        <ProductMedia
          productId={product.id}
          initialMain={product.image_path}
          initialGallery={product.product_gallery}
        />

        {/* NFC Authenticity Tag Section */}
        <NfcSection
          productId={product.id}
          initialTag={product.nfc_tag_id}
          initialStatus={product.nfc_tag_status}
        />

        {/* Main Product Edit Form */}
        <div className="mt-6">
          <ProductForm
            mode="edit"
            productId={product.id}
            categories={categories}
            initial={{
              name: product.name,
              description: product.description ?? '',
              price: String(Number(product.price)),
              stock_quantity: String(product.stock_quantity),
              category: product.category ?? '',
              materials_used: product.materials_used ?? '',
              has_tutorial: product.has_tutorial,
              tutorial_title: product.tutorial_title ?? '',
              tutorial_description: product.tutorial_description ?? '',
              tutorial_price:
                product.tutorial_price != null ? String(Number(product.tutorial_price)) : '',
              tutorial_capacity:
                product.tutorial_capacity != null ? String(product.tutorial_capacity) : '',
              tutorial_fee_type: product.tutorial_fee_type ?? 'paid',
              tutorial_location: product.tutorial_location ?? '',
              tutorial_lat: product.tutorial_lat != null ? Number(product.tutorial_lat) : null,
              tutorial_lng: product.tutorial_lng != null ? Number(product.tutorial_lng) : null,
            }}
            initialHasVariations={product.has_variations}
            initialVariations={product.variations_data ?? []}
            initialTutorialDates={product.tutorial_dates ?? []}
          />
        </div>
      </main>
    </>
  );
}
