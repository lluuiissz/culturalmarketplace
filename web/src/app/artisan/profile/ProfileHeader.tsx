'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { compressImage } from '@/lib/imageCompress';

export default function ProfileHeader({
  artisanId,
  name,
  businessName,
  profilePicture,
}: {
  artisanId: number;
  name: string;
  businessName: string;
  profilePicture: string | null;
}) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [msg, setMsg] = useState<{ text: string; error?: boolean } | null>(null);

  async function onSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setPreview(URL.createObjectURL(file));
    setUploading(true);
    setMsg(null);

    try {
      const compressed = await compressImage(file, 800, 800, 0.85);
      const fd = new FormData();
      fd.append('file', compressed);

      const res = await fetch('/api/artisan/profile/photo', { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok || data.status !== 'success') {
        throw new Error(data.message || 'Failed to upload photo.');
      }

      setMsg({ text: 'Photo updated.' });
      router.refresh();
    } catch (err: unknown) {
      setMsg({ text: (err as Error).message || 'Failed to upload photo.', error: true });
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  const photo = preview || profilePicture;

  return (
    <section className="border-b border-[#E8DCCB] px-4 py-6 md:px-8">
      <div className="mx-auto flex max-w-5xl flex-col items-center gap-4 sm:flex-row sm:justify-center sm:gap-6">
        {/* PROFILE PHOTO */}
        <div className="relative h-28 w-28 shrink-0 overflow-hidden rounded-full border border-[#D8C8B5] bg-white">
          {photo ? (
            <img src={photo} alt={`${name}'s profile`} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-4xl font-bold text-[#8B0000]">
              {name?.charAt(0)?.toUpperCase() || 'A'}
            </div>
          )}
          {uploading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/60 text-[11px] font-semibold text-white">
              Uploading…
            </div>
          )}
        </div>

        {/* ARTISAN INFORMATION */}
        <div className="min-w-0 text-center sm:text-left">
          <h1 className="font-serif text-xl font-bold text-[#3D3028] md:text-2xl">{businessName}</h1>
          <p className="mt-1 text-sm font-semibold text-[#D18A00]">{name}</p>
          <p className="mt-1 text-sm text-[#71675F]">
            Manage your artisan profile and showcase your cultural crafts.
          </p>

          <div className="mt-2 flex flex-wrap justify-center gap-2 sm:justify-start">
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={onSelect}
            />
            <button
              type="button"
              disabled={uploading}
              onClick={() => fileRef.current?.click()}
              className="rounded-md border border-[#D6B56D] bg-white px-4 py-1 text-[10px] font-medium text-[#9A681D] transition hover:bg-[#FFF5E4] disabled:opacity-60"
            >
              {uploading ? 'Uploading…' : 'Change Photo'}
            </button>

            <Link
              href={`/artisans/${artisanId}`}
              target="_blank"
              className="rounded-md border border-[#D9A6A6] bg-white px-4 py-1 text-[10px] font-medium text-[#8B0000] transition hover:bg-[#FCEEEE]"
            >
              View Public Profile
            </Link>
          </div>

          {msg && (
            <p className={`mt-2 text-xs font-semibold ${msg.error ? 'text-red-700' : 'text-[#9A681D]'}`}>
              {msg.text}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}