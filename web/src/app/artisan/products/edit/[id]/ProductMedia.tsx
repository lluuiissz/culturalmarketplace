'use client';

import { useRef, useState } from 'react';

// Product media manager shown on the edit page (needs the product to exist).
// Main image + up to 8 gallery images; uploads go to /api/artisan/products/[id]/media.

export default function ProductMedia({
  productId, initialMain, initialGallery,
}: {
  productId: number;
  initialMain: string | null;
  initialGallery: string[] | null;
}) {
  const [main, setMain] = useState<string | null>(initialMain);
  const [gallery, setGallery] = useState<string[]>(initialGallery ?? []);
  const [busy, setBusy] = useState<string>('');
  const [error, setError] = useState('');
  const mainInput = useRef<HTMLInputElement>(null);
  const galleryInput = useRef<HTMLInputElement>(null);

  async function upload(file: File, kind: 'main' | 'gallery') {
    setError('');
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setError('Only JPEG, PNG, or WebP images are allowed.');
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      setError('Image must be under 8 MB.');
      return;
    }
    setBusy(kind === 'main' ? 'Uploading main image…' : 'Uploading…');
    const fd = new FormData();
    fd.append('productId', String(productId));
    fd.append('kind', kind);
    fd.append('file', file);

    // Async pipeline: POST returns instantly with a jobId; the server checks
    // the photo (size, duplicates, NSFW, craft relevance) in the background
    // and we poll until done. The browser request never blocks on the classifier.
    const res = await fetch(`/api/artisan/products/${productId}/media`, { method: 'POST', body: fd });
    const ack = await res.json();
    if (res.status !== 202 || !ack.jobId) {
      setBusy('');
      setError(ack.message || 'Upload failed.');
      return;
    }

    const started = Date.now();
    for (;;) {
      await new Promise((r) => setTimeout(r, 1200));
      if (Date.now() - started > 60_000) {
        setBusy('');
        setError('The check is taking unusually long — try again in a minute.');
        return;
      }
      const poll = await fetch(`/api/artisan/products/${productId}/media?jobId=${ack.jobId}`);
      const data = await poll.json();
      if (data.status === 'pending') continue;
      setBusy('');
      if (data.status === 'success') {
        setMain(data.image_path);
        setGallery(data.product_gallery ?? []);
        if (data.moderation === 'pending_review') {
          setError('Photo received — it will appear to buyers after a quick admin review.');
        }
      } else {
        setError(data.message || 'Upload failed.');
      }
      return;
    }
  }

  async function removeMain() {
    setBusy('Removing…');
    // Main image removal: set image_path to null via gallery endpoint semantics
    const res = await fetch(`/api/artisan/products/${productId}/media?productId=${productId}&kind=main-remove`, { method: 'DELETE' });
    setBusy('');
    if (res.ok) setMain(null);
  }

  async function removeGallery(url: string) {
    setBusy('Removing…');
    const res = await fetch(`/api/artisan/products/${productId}/media?productId=${productId}&url=${encodeURIComponent(url)}`, { method: 'DELETE' });
    const data = await res.json();
    setBusy('');
    if (data.status === 'success') setGallery(data.product_gallery ?? []);
  }

  return (
    <div className="card space-y-4 p-5">
      <h2 className="font-serif text-lg font-bold text-brand-900">Photos</h2>
      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      {busy && <p className="text-sm text-stone-500">{busy}</p>}

      <div>
        <label className="mb-1 block text-sm font-medium text-stone-700">Main image</label>
        <div className="flex items-center gap-4">
          {main ? (
            <div className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={main} alt="Main product image" className="h-28 w-28 rounded-xl object-cover" />
              <button type="button" onClick={removeMain}
                className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-xs text-white" aria-label="Remove main image">✕</button>
            </div>
          ) : (
            <button type="button" className="flex h-28 w-28 flex-col items-center justify-center rounded-xl border-2 border-dashed border-stone-300 text-stone-400 hover:border-brand-400 hover:text-brand-600"
              onClick={() => mainInput.current?.click()}>
              <span className="text-2xl">🖼️</span>
              <span className="mt-1 text-xs">Upload</span>
            </button>
          )}
          <p className="text-xs text-stone-400">Shown on cards and search results.<br />JPEG / PNG / WebP, up to 8&nbsp;MB.</p>
        </div>
        <input ref={mainInput} type="file" accept="image/jpeg,image/png,image/webp" className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) upload(f, 'main'); e.target.value = ''; }} />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-stone-700">Gallery ({gallery.length}/8)</label>
        <div className="flex flex-wrap gap-3">
          {gallery.map((url) => (
            <div key={url} className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt="Gallery image" className="h-20 w-20 rounded-lg object-cover" />
              <button type="button" onClick={() => removeGallery(url)}
                className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] text-white" aria-label="Remove image">✕</button>
            </div>
          ))}
          {gallery.length < 8 && (
            <button type="button" className="flex h-20 w-20 flex-col items-center justify-center rounded-lg border-2 border-dashed border-stone-300 text-stone-400 hover:border-brand-400 hover:text-brand-600"
              onClick={() => galleryInput.current?.click()}>
              <span className="text-xl">＋</span>
              <span className="text-[10px]">Add photo</span>
            </button>
          )}
        </div>
        <input ref={galleryInput} type="file" accept="image/jpeg,image/png,image/webp" className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) upload(f, 'gallery'); e.target.value = ''; }} />
      </div>
    </div>
  );
}
