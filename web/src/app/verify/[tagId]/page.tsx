import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { getProductByNfc } from '@/lib/db';

export const dynamic = 'force-dynamic';

export default async function VerifyPage({ params }: { params: Promise<{ tagId: string }> }) {
  const { tagId } = await params;
  const decoded = decodeURIComponent(tagId);
  const product = await getProductByNfc(decoded);

  return (
    <>
      <Header />
      <main className="mx-auto max-w-2xl px-4 py-16 text-center">
        {product && product.status === 'active' && product.nfc_tag_status === 'active' ? (
          <div className="card p-10">
            <div className="text-6xl">✅</div>
            <h1 className="mt-4 font-serif text-3xl font-bold text-leaf-700">Authentic Craft Verified</h1>
            <p className="mt-2 text-stone-600">
              This NFC tag belongs to <b>{product.name}</b>, handcrafted by a verified artisan of the Cultural Marketplace.
            </p>
            <p className="mt-4 text-sm text-stone-400">Tag ID: <code>{decoded}</code></p>
            <Link href={`/customer/browse/${product.id}`} className="btn-primary mt-8">View this craft</Link>
          </div>
        ) : (
          <div className="card p-10">
            <div className="text-6xl">⚠️</div>
            <h1 className="mt-4 font-serif text-3xl font-bold text-amber-700">Tag not recognized</h1>
            <p className="mt-2 text-stone-600">
              We couldn&apos;t match this tag to an active product. It may be unregistered, replaced, or the listing may be unavailable.
            </p>
            <p className="mt-4 text-sm text-stone-400">Tag ID: <code>{decoded}</code></p>
            <Link href="/" className="btn-outline mt-8">Back to marketplace</Link>
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}
