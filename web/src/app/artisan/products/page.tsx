import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { listArtisanProducts } from '@/lib/db';
import ProductsClient from './ProductsClient';

export const dynamic = 'force-dynamic';

export default async function ArtisanProductsPage() {
  const session = await getSession();
  if (!session || session.role !== 'artisan') redirect('/auth/login?next=/artisan/products');

  const products = await listArtisanProducts(session.id);
  return (
    <>
      <main className="mx-auto max-w-5xl px-4 py-10">
        <div className="flex items-center justify-between">
          <h1 className="font-serif text-3xl font-bold text-brand-900">My products</h1>
          <Link className="btn-primary" href="/artisan/products/new">+ Add product</Link>
        </div>
        <ProductsClient
          initial={products.map((p) => ({
            id: p.id, name: p.name, price: Number(p.price), stock: p.stock_quantity,
            status: p.status, has_tutorial: p.has_tutorial, nfc_tag_id: p.nfc_tag_id,
          }))}
        />
      </main>
    </>
  );
}
