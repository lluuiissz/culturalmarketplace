'use client';

import Image from 'next/image';
import { useState } from 'react';

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
      <div className="flex h-52 items-center justify-center rounded-xl border border-[#D6D0C9] bg-[#FFF5E4] text-6xl">
        {hasTutorial ? '🧺' : '🧶'}
      </div>
    );
  }

  return (
    <div>
      <div className="relative h-52 w-full overflow-hidden rounded-xl border border-[#D6D0C9] sm:h-56">
        <Image
          src={current as string}
          alt={name}
          fill
          sizes="(max-width: 768px) 100vw, 340px"
          className="object-cover"
          priority
        />
      </div>

      {images.length > 1 && (
        <div className="mt-2 flex flex-wrap gap-2">
          {images.map((url, i) => (
            <button
              key={url}
              type="button"
              onClick={() => setActive(i)}
              aria-label={`Show photo ${i + 1}`}
              className={`relative h-9 w-9 overflow-hidden rounded-md border transition ${
                i === active
                  ? 'border-[#8B0000] ring-1 ring-[#8B0000]'
                  : 'border-[#D6D0C9] opacity-80 hover:opacity-100'
              }`}
            >
              <Image src={url} alt="" fill sizes="36px" className="object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}