import { listPendingArtisans, listApprovedArtisans } from '@/lib/db';
import { getProductCountsByArtisan } from '@/lib/db';
import ArtisansClient from './ArtisansClient';

export const dynamic = 'force-dynamic';

export default async function AdminArtisansPage() {
  const [pending, approved] = await Promise.all([listPendingArtisans(), listApprovedArtisans()]);
  // ONE batched counts query (N+1 fix) — was a full products query per artisan.
  const counts = await getProductCountsByArtisan(approved.map((a) => a.id));
  const withProducts = approved.map((a) => ({
    ...a,
    productCount: counts.get(a.id) ?? 0,
  }));

  return (
    <div>
      <h1 className="font-serif text-2xl font-bold text-brand-900">Artisan management</h1>
      <ArtisansClient
        pending={pending.map((a) => ({ id: a.id, name: a.name, email: a.email, craft_type: a.craft_type, location: a.location }))}
        approved={withProducts.map((a) => ({ id: a.id, name: a.name, email: a.email, craft_type: a.craft_type, productCount: a.productCount }))}
      />
    </div>
  );
}
