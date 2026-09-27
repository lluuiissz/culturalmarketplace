import { notFound, redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { getProduct } from '@/lib/db';
import NfcSection from '@/components/NfcSection';

export const dynamic = 'force-dynamic';

export default async function NfcSetupPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || session.role !== 'artisan') redirect('/auth/login?next=/artisan/products');
  const { id } = await params;
  const product = await getProduct(Number(id));
  if (!product || product.artisan_id !== session.id) notFound();

  return (
    <>
      <main className="mx-auto max-w-xl px-4 py-10">
        <h1 className="font-serif text-3xl font-bold text-brand-900">NFC authenticity tag</h1>
        <p className="mt-1 text-stone-500">Product: {product.name}</p>
        <p className="mt-2 rounded-lg bg-brand-50 px-3 py-2 text-xs text-stone-500">
          Completely optional — NFC lets buyers tap a card on the product to verify it&apos;s authentic. Skip it if you prefer; your listing works either way.
        </p>
        <NfcSection productId={product.id} initialTag={product.nfc_tag_id} initialStatus={product.nfc_tag_status} />
      </main>
    </>
  );
}
