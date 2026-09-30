'use client';

// Route-level error boundary: catches render/data failures in any segment
// beneath the root layout (e.g. a Supabase hiccup) and shows a friendly,
// recoverable screen instead of the raw "Application error" page.
import Link from 'next/link';
import { useEffect } from 'react';

export default function GlobalRouteError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error('[app error boundary]', error);
  }, [error]);

  return (
    <main className="flex min-h-[70vh] items-center justify-center px-4">
      <div className="card max-w-md p-8 text-center">
        <div className="text-5xl">🧶</div>
        <h1 className="mt-3 font-serif text-2xl font-bold text-brand-900">Something went wrong</h1>
        <p className="mt-2 text-sm text-stone-600">
          We had trouble loading this page. It may be a temporary connection issue — try again in a moment.
        </p>
        {error.digest && <p className="mt-2 text-xs text-stone-400">Error ID: {error.digest}</p>}
        <div className="mt-6 flex justify-center gap-3">
          <button className="btn-primary" onClick={reset}>Try again</button>
          <Link href="/" className="btn-outline">Back to home</Link>
        </div>
      </div>
    </main>
  );
}
