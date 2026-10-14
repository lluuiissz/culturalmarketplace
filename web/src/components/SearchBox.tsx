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
      placeholder="Search crafts, e.g. woven basket…"
      aria-label="Search crafts"
      className="input w-full rounded-full"
      style={{ paddingLeft: '2.25rem' }}
    />
  );
}
