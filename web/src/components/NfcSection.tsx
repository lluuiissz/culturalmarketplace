'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import NfcWriter from './NfcWriter';

// NFC section on the artisan product edit page. Lifecycle:
//   no tag -> [Attach NFC tag] -> awaiting_write (write card here) -> active
//   active -> [Replace tag] (new card lost/damaged) -> awaiting_write again
export default function NfcSection({
  productId, initialTag, initialStatus,
}: {
  productId: number;
  initialTag: string | null;
  initialStatus: string | null;
}) {
  const router = useRouter();
  const [tag, setTag] = useState(initialTag);
  const [status, setStatus] = useState(initialStatus);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function call(action: 'register' | 'activate' | 'replace') {
    setBusy(true);
    setError('');
    try {
      const res = await fetch(`/api/artisan/products/${productId}/nfc`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message ?? 'Something went wrong. Please try again.');
        return;
      }
      setTag(data.tag_id ?? tag);
      setStatus(data.nfc_tag_status ?? status);
      if (action === 'activate') router.refresh();
    } finally {
      setBusy(false);
    }
  }

  if (!tag) {
    return (
      <div className="card mt-6 p-5">
        <h2 className="font-serif text-xl font-bold text-brand-900">NFC authenticity tag</h2>
        <p className="mt-1 text-sm text-stone-600">
          Attach an NFC card to this product so buyers can tap it to verify it&apos;s an authentic handcrafted piece.
        </p>
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
        <button type="button" className="btn-primary mt-3" disabled={busy} onClick={() => call('register')}>
          {busy ? 'Preparing…' : '🏷️ Attach NFC tag'}
        </button>
      </div>
    );
  }

  const awaiting = status === 'awaiting_write';

  return (
    <div className="card mt-6 p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-serif text-xl font-bold text-brand-900">NFC authenticity tag</h2>
        <span className={`badge ${awaiting ? 'bg-amber-100 text-amber-700' : 'bg-leaf-500/10 text-leaf-700'}`}>
          {awaiting ? 'Awaiting write' : 'Active'}
        </span>
      </div>
      <p className="mt-1 font-mono text-sm text-stone-500">Tag ID: {tag}</p>

      {awaiting && (
        <>
          <p className="mt-2 text-sm text-stone-600">
            Hold a blank NFC card to your phone and write the link below onto it. Buyers tap that card to verify this product.
          </p>
          <div className="mt-3">
            <NfcWriter
              tagId={tag}
              onVerified={() => call('activate')}
            />
          </div>
          <p className="mt-2 text-xs text-stone-400">
            Writing on an iPhone or without HTTPS? Copy the link and use the NFC Tools app — then tap your card once to test.
          </p>
        </>
      )}

      {awaiting && (
        <div className="mt-3 flex flex-wrap gap-2">
          <button type="button" className="btn-outline px-3 py-1.5 text-xs" disabled={busy} onClick={() => call('activate')}>
            ✓ I tested the card — mark active
          </button>
        </div>
      )}

      {status === 'active' && (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <p className="text-sm text-leaf-700">✅ Buyers who tap this card see the authentic-craft verify page.</p>
          <button type="button" className="btn-outline px-3 py-1.5 text-xs" disabled={busy} onClick={() => call('replace')}>
            Replace tag (new card)
          </button>
        </div>
      )}

      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}
