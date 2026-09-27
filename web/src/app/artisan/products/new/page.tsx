import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { listCategories } from '@/lib/db';
import ProductForm from '../ProductForm';

export const dynamic = 'force-dynamic';

export default async function NewProductPage() {
  const session = await getSession();
  if (!session || session.role !== 'artisan') redirect('/auth/login?next=/artisan/products/new');

  const categories = await listCategories('product');
  return (
    <>
      <main className="mx-auto max-w-3xl px-4 py-10">
        <h1 className="font-serif text-3xl font-bold text-brand-900">Add a product</h1>
        <ProductForm mode="create" categories={categories} />
      </main>
    </>
  );
}
