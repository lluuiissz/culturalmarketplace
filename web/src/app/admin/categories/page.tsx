import { listCategories } from '@/lib/db';
import CategoriesClient from './CategoriesClient';

export const dynamic = 'force-dynamic';

export default async function AdminCategoriesPage() {
  const categories = await listCategories();
  return (
    <div>
      <h1 className="font-serif text-2xl font-bold text-brand-900">Categories</h1>
      <CategoriesClient initial={categories.map((c) => ({ id: c.id, name: c.name, type: c.type }))} />
    </div>
  );
}
