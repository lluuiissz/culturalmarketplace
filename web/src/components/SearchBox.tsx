'use client';

import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';

// Header search input that pre-fills with the active query on results pages,
// and automatically restores all products when the search text is cleared.
export default function SearchBox() {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const currentQ = params.get('q') ?? '';
  const [val, setVal] = useState(currentQ);

  useEffect(() => {
    setVal(currentQ);
  }, [currentQ]);

  function handleClearIfNeeded(newVal: string) {
    if (newVal.trim() === '' && currentQ !== '') {
      const sp = new URLSearchParams(params.toString());
      sp.delete('q');
      const qs = sp.toString();
      const targetUrl = pathname === '/customer/browse'
        ? (qs ? `/customer/browse?${qs}` : '/customer/browse')
        : '/customer/browse';
      router.push(targetUrl);
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const nextVal = e.target.value;
    setVal(nextVal);
    handleClearIfNeeded(nextVal);
  }

  function handleSearch(e: React.SyntheticEvent<HTMLInputElement>) {
    // Native search input 'x' button trigger
    const target = e.currentTarget;
    setVal(target.value);
    handleClearIfNeeded(target.value);
  }

  return (
    <input
      type="search"
      name="q"
      value={val}
      onChange={handleChange}
      placeholder="Search traditional crafts…"
      aria-label="Search traditional crafts"
      className="w-full rounded-full border border-abaca-300 bg-white/95 text-xs sm:text-sm pl-9 pr-3 py-1.5 text-charcoal-900 placeholder:text-stone-400 focus:border-ochre-600 focus:outline-none focus:ring-1 focus:ring-ochre-600 shadow-2xs"
    />
  );
}
