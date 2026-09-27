'use client';

import Image from 'next/image';
import { useState } from 'react';

// Product media viewer: main image + clickable gallery thumbnails that swap it.
// Falls back to the craft-emoji placeholder when no images are uploaded yet.
export default function ProductGallery({
  main, gallery, name, hasTutorial,
}: {
  main: string | null;
  gallery: string[] | null;
  name: string;
  hasTutorial: boolean;
}) {
  const images = [main, ...(gallery ?? [])].filter((x): x is string => Boolean(x));
  const [active, setActive] = useState(0);
  const current = images[active] ?? null;

  if (images.length === 0) {
    return (
      <div className="card flex h-80 items-center justify-center bg-brand-100 text-7xl">
        {hasTutorial ? '🧺' : '🧶'}
      </div>
    );
  }

  return (
    <div>
      <div className="card relative h-80 overflow-hidden">
        <Image
          src={current as string}
          alt={name}
          fill
          sizes="(max-width: 768px) 100vw, 50vw"
          className="object-cover"
          priority
        />
      </div>
      {images.length > 1 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {images.map((url, i) => (
            <button
              key={url}
              type="button"
              onClick={() => setActive(i)}
              aria-label={`Show photo ${i + 1}`}
              className={`relative h-16 w-16 overflow-hidden rounded-lg border-2 transition ${i === active ? 'border-brand-600' : 'border-transparent opacity-70 hover:opacity-100'}`}
            >
              <Image src={url} alt="" fill sizes="64px" className="object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
