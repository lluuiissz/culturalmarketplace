import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import WeaveDivider from '@/components/WeaveDivider';
import { getProductByNfc, getArtisan } from '@/lib/db';

export const dynamic = 'force-dynamic';

export default async function VerifyPage({ params }: { params: Promise<{ tagId: string }> }) {
  const { tagId } = await params;
  const decoded = decodeURIComponent(tagId);
  const product = await getProductByNfc(decoded);
  const artisan = product ? await getArtisan(product.artisan_id) : null;

  return (
    <div className="min-h-screen flex flex-col bg-canvas">
      <Header />

      <main className="mx-auto max-w-2xl px-4 py-16 text-center flex-1 flex flex-col justify-center">
        {product && product.status === 'active' && product.nfc_tag_status === 'active' ? (
          <div className="rounded-3xl border-2 border-ochre-400 bg-white p-8 sm:p-12 shadow-md relative overflow-hidden text-center">
            <WeaveDivider pattern="diamond" className="absolute top-0 left-0 right-0 opacity-40" />

            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-ochre-500 to-forest-600 text-4xl text-white shadow-sm">
              <span>🛡️</span>
            </div>

            <div className="inline-flex items-center gap-1.5 rounded-full bg-forest-50 px-3.5 py-1 text-xs font-bold text-forest-700 border border-forest-200 mb-3">
              <span>✔</span>
              <span>Authentic Cultural Provenance Verified</span>
            </div>

            <h1 className="font-sculpted text-2xl sm:text-3xl font-bold text-charcoal-900">
              Sacred Seal of Authenticity
            </h1>

            <p className="mt-3 text-sm text-stone-600 leading-relaxed max-w-md mx-auto">
              This physical NFC tag certifies that <b className="text-charcoal-900">{product.name}</b> was handcrafted using verified traditional methods by master artisan <b className="text-charcoal-900">{artisan?.name ?? 'an indigenous master'}</b> of Agusan del Sur.
            </p>

            {product.materials_used && (
              <div className="mt-4 inline-block rounded-xl bg-abaca-100/70 px-4 py-2 text-xs font-medium text-charcoal-900 border border-abaca-200">
                🧵 Materials: <span className="font-bold">{product.materials_used}</span>
              </div>
            )}

            <div className="mt-6 rounded-2xl bg-canvas p-3 border border-abaca-200 text-xs text-stone-500 max-w-xs mx-auto">
              Cryptographic NFC Tag ID:
              <p className="font-mono font-bold text-charcoal-900 text-xs mt-0.5">{decoded}</p>
            </div>

            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link href={`/customer/browse/${product.id}`} className="btn-primary text-xs px-5 py-2.5 font-semibold">
                Explore this Authentic Piece →
              </Link>
              {artisan && (
                <Link href={`/artisans/${artisan.id}`} className="btn-outline text-xs px-5 py-2.5 font-semibold">
                  View Artisan Atelier
                </Link>
              )}
            </div>
          </div>
        ) : (
          <div className="rounded-3xl border border-ochre-300 bg-white p-8 sm:p-12 shadow-xs text-center max-w-md mx-auto">
            <div className="text-5xl mb-3">⚠️</div>
            <h1 className="font-sculpted text-2xl font-bold text-charcoal-900">
              Tag Not Recognized
            </h1>
            <p className="mt-2 text-xs text-stone-600 leading-relaxed">
              We couldn&apos;t match this NFC tag to an active registered craft piece. It may be unregistered, archived, or currently pending authentication.
            </p>
            <p className="mt-4 text-xs font-mono text-stone-400 bg-stone-50 py-1.5 px-3 rounded-xl border border-stone-200">
              Scanned ID: {decoded}
            </p>
            <Link href="/" className="btn-outline mt-6 text-xs px-5 py-2.5 font-semibold">
              Return to Marketplace
            </Link>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
