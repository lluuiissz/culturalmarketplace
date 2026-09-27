import { listActiveProducts, getArtisan } from '@/lib/db';
import { sql } from '@/lib/dbPg';
import AdminProductsClient from './AdminProductsClient';

export const dynamic = 'force-dynamic';

export default async function AdminProductsPage() {
  let products: Array<{ id: number; name: string; price: number; status: string; artisan: string; category: string | null }> = [];
  if (process.env.DATABASE_URL) {
    const rows = await sql`select p.*, a.name as artisan_name from products p join artisans a on a.id = p.artisan_id order by p.created_at desc limit 200`;
    products = (rows as unknown as Record<string, unknown>[]).map((r) => ({
      id: Number(r.id), name: String(r.name), price: Number(r.price), status: String(r.status),
      artisan: String(r.artisan_name), category: (r.category as string) ?? null,
    }));
  } else {
    const all = await listActiveProducts();
    const withArtisans = await Promise.all(all.map(async (p) => ({
      id: p.id, name: p.name, price: Number(p.price), status: p.status,
      artisan: (await getArtisan(p.artisan_id))?.name ?? '—', category: p.category,
    })));
    products = withArtisans;
  }

  return (
    <div>
      <h1 className="font-serif text-2xl font-bold text-brand-900">All products</h1>
      <AdminProductsClient initial={products} />
    </div>
  );
}
