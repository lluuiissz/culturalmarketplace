import { listTaggedProducts, listUntaggedProducts } from '@/lib/adminDb';
import NfcAdminClient from './NfcAdminClient';

export const dynamic = 'force-dynamic';

export default async function AdminNfcPage() {
  const [tagged, untagged] = await Promise.all([listTaggedProducts(), listUntaggedProducts()]);
  return (
    <div>
      <h1 className="font-serif text-2xl font-bold text-brand-900">NFC tags</h1>
      <div className="card mt-4 border-brand-200 bg-brand-50/60 p-4 text-sm text-stone-600">
        <p className="font-semibold text-brand-800">Writing NFC cards</p>
        <ol className="mt-2 list-decimal space-y-1 pl-5">
          <li><b>On Android Chrome (best):</b> open this page on your phone, press <b>Write to card</b>, and hold the round card to the phone. Written and verified in one step.</li>
          <li><b>On iPhone / any device:</b> press <b>Copy link</b>, then use the free <b>NFC Tools</b> app: <b>Write → Add a record → URL</b> → paste → tap the card.</li>
          <li>Test by tapping the card — the verify page should open by itself.</li>
        </ol>
        <p className="mt-2 text-xs text-stone-500">
          In-browser writing needs Chrome on Android over HTTPS — it works here on localhost for testing, and on Vercel once deployed.
          Artisans write tags for their own products from the product edit page; this page is for oversight and replacements.
        </p>
      </div>
      <NfcAdminClient
        tagged={tagged.map((p) => ({
          id: p.id, name: p.name, tag: p.nfc_tag_id ?? '', status: p.nfc_tag_status ?? 'active',
        }))}
        untagged={untagged.map((p) => ({ id: p.id, name: p.name }))}
      />
    </div>
  );
}
