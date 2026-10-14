'use client';

import { useRef, useState } from 'react';
import { compressImage } from '@/lib/imageCompress';

// Product media manager shown on the edit page (needs the product to exist).
// Main image + up to 20 gallery images with automatic client-side canvas compression.
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

  async function upload(file: File, kind: 'main' | 'gallery', clearBusyOnFinish = true): Promise<boolean> {
    setError('');
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setError('Only JPEG, PNG, or WebP images are allowed.');
      return false;
    }

    try {
      setBusy(`Compressing ${kind === 'main' ? 'main' : 'gallery'} photo…`);
      // Client-side canvas compression (1200x1200px max, 80% quality JPEG)
      // Reduces 8MB-12MB down to ~150KB to preserve Supabase storage
      const compressedFile = await compressImage(file, 1200, 1200, 0.8);

      setBusy(kind === 'main' ? 'Uploading main photo…' : 'Uploading to gallery…');
      const fd = new FormData();
      fd.append('productId', String(productId));
      fd.append('kind', kind);
      fd.append('file', compressedFile);

      const res = await fetch(`/api/artisan/products/${productId}/media`, { method: 'POST', body: fd });
      const data = await res.json();
      if (clearBusyOnFinish) setBusy('');

      if (!res.ok || data.status !== 'success') {
        setError(data.message || 'Upload failed.');
        return false;
      }

      if (kind === 'main') {
        setMain(data.image_path);
      }
      setGallery(data.product_gallery ?? []);
      return true;
    } catch {
      if (clearBusyOnFinish) setBusy('');
      setError('Upload failed. Please check your connection and try again.');
      return false;
    }
  }

  async function handleGalleryFiles(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return;
    const remaining = 20 - gallery.length;
    if (remaining <= 0) {
      setError('You have reached the maximum of 20 gallery photos.');
      return;
    }
    const files = Array.from(fileList).slice(0, remaining);
    for (let i = 0; i < files.length; i++) {
      setBusy(`Processing & uploading photo ${i + 1} of ${files.length}…`);
      const ok = await upload(files[i], 'gallery', false);
      if (!ok) break;
    }
    setBusy('');
  }

  async function removeMain() {
    setBusy('Removing main image…');
    const res = await fetch(`/api/artisan/products/${productId}/media?productId=${productId}&kind=main-remove`, { method: 'DELETE' });
    setBusy('');
    if (res.ok) setMain(null);
  }

  async function removeGallery(url: string) {
    setBusy('Removing gallery image…');
    const res = await fetch(`/api/artisan/products/${productId}/media?productId=${productId}&url=${encodeURIComponent(url)}`, { method: 'DELETE' });
    const data = await res.json();
    setBusy('');
    if (data.status === 'success') setGallery(data.product_gallery ?? []);
  }

  return (
    <div className="card space-y-4 p-5">
      <div className="border-b border-brand-100 pb-2">
        <h2 className="font-serif text-lg font-bold text-brand-900">Product Media & Gallery</h2>
        <p className="text-xs text-stone-500">
          Upload crisp craft photos. All photos are automatically compressed before upload to preserve storage. Max 20 photos total.
        </p>
      </div>

      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      {busy && <p className="text-sm font-medium text-brand-700 animate-pulse">{busy}</p>}

      <div>
        <label className="mb-1 block text-sm font-medium text-stone-700">Main Cover Image</label>
        <div className="flex items-center gap-4">
          {main ? (
            <div className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={main} alt="Main product cover" className="h-28 w-28 rounded-xl object-cover border border-stone-200 shadow-xs" />
              <button
                type="button"
                onClick={removeMain}
                className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white shadow-xs hover:bg-red-600"
                aria-label="Remove main image"
              >
                ✕
              </button>
            </div>
          ) : (
            <button
              type="button"
              className="flex h-28 w-28 flex-col items-center justify-center rounded-xl border-2 border-dashed border-stone-300 text-stone-400 hover:border-brand-400 hover:text-brand-600 transition"
              onClick={() => mainInput.current?.click()}
            >
              <span className="text-2xl">🖼️</span>
              <span className="mt-1 text-xs font-medium">Upload Cover</span>
            </button>
          )}
          <p className="text-xs text-stone-400">
            Featured on marketplace catalog and search results.<br />
            JPEG, PNG, or WebP. Automatically optimized for web.
          </p>
        </div>
        <input
          ref={mainInput}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) upload(f, 'main');
            e.target.value = '';
          }}
        />
      </div>

      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="text-sm font-medium text-stone-700">
            Gallery Showcase ({gallery.length}/20)
          </label>
          <span className="text-xs text-stone-400">
            {20 - gallery.length} slot{20 - gallery.length === 1 ? '' : 's'} remaining
          </span>
        </div>
        <div className="flex flex-wrap gap-3">
          {gallery.map((url) => (
            <div key={url} className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt="Gallery item" className="h-20 w-20 rounded-lg object-cover border border-stone-200 shadow-2xs" />
              <button
                type="button"
                onClick={() => removeGallery(url)}
                className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow-xs hover:bg-red-600"
                aria-label="Remove image"
              >
                ✕
              </button>
            </div>
          ))}
          {gallery.length < 20 && (
            <button
              type="button"
              className="flex h-20 w-20 flex-col items-center justify-center rounded-lg border-2 border-dashed border-stone-300 text-stone-400 hover:border-brand-400 hover:text-brand-600 transition"
              onClick={() => galleryInput.current?.click()}
            >
              <span className="text-xl">＋</span>
              <span className="text-[10px] font-medium">Add photos</span>
            </button>
          )}
        </div>
        <input
          ref={galleryInput}
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={(e) => {
            handleGalleryFiles(e.target.files);
            e.target.value = '';
          }}
        />
      </div>
    </div>
  );
}
