import ReportForm from './ReportForm';
import { getProduct, getArtisan, listActiveProducts, listApprovedArtisans } from '@/lib/db';

export const dynamic = 'force-dynamic';

const TYPES = ['product', 'artisan', 'experience'] as const;
type ReportType = (typeof TYPES)[number];

export default async function CustomerReportPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; id?: string }>;
}) {
  const sp = await searchParams;

  const [products, artisans] = await Promise.all([listActiveProducts(), listApprovedArtisans()]);

  // Prefill when the customer arrives from a "Report" button
  let prefill: { type: ReportType; id: number; name: string } | null = null;
  const type = TYPES.find((t) => t === sp.type);
  const id = Number(sp.id);
  if (type && Number.isFinite(id) && id > 0) {
    const name =
      type === 'artisan' ? (await getArtisan(id))?.name : (await getProduct(id))?.name;
    if (name) prefill = { type, id, name };
  }

  return (
    <main className="min-h-screen bg-[#FCF9F4]">
      <section className="px-4 py-6 md:px-8">
        <div className="mx-auto max-w-5xl text-center">
          <h1 className="font-serif text-xl font-bold text-[#3D3028] md:text-2xl">Report an issue</h1>
          <p className="mt-1 text-sm text-[#71675F]">
            Report a listing or artisan that violates our community rules.
          </p>
        </div>
      </section>

      <div className="h-px w-full bg-gray-300" />

      <section className="px-4 py-5 md:px-8 md:py-6">
        <div className="mx-auto max-w-xl">
          <ReportForm
            prefill={prefill}
            options={{
              product: products.map((p) => ({ id: p.id, name: p.name })),
              experience: products
                .filter((p) => p.has_tutorial)
                .map((p) => ({ id: p.id, name: p.tutorial_title || p.name })),
              artisan: artisans.map((a) => ({ id: a.id, name: a.name })),
            }}
          />
        </div>
      </section>
    </main>
  );
}