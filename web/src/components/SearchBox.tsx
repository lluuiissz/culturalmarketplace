'use client';

import { useSearchParams } from 'next/navigation';

// Header search input that pre-fills with the active query on results pages,
// so there's exactly ONE visible search box per screen (no duplicates).
export default function SearchBox() {
  const params = useSearchParams();
  return (
    <input
      type="search"
      name="q"
      defaultValue={params.get('q') ?? ''}
      placeholder="Search crafts, e.g. woven basket…"
      aria-label="Search crafts"
      className="input w-full rounded-full"
      style={{ paddingLeft: '2.25rem' }}
    />
  );
}
