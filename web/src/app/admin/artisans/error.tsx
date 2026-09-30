'use client';

// Segment error boundary for admin artisan pages: a failure while loading an
// artisan's evidence/checklist shouldn't kick the admin out of the portal.
import { useEffect } from 'react';

export default function ArtisanAdminError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error('[admin artisans error]', error);
  }, [error]);

  return (
    <div className="card mx-auto mt-8 max-w-md p-6 text-center">
      <div className="text-4xl">⚠️</div>
      <h1 className="mt-2 font-serif text-xl font-bold text-brand-900">Couldn&apos;t load this review</h1>
      <p className="mt-1 text-sm text-stone-600">The artisan&apos;s verification data failed to load. You can retry without losing your place.</p>
      {error.digest && <p className="mt-2 text-xs text-stone-400">Error ID: {error.digest}</p>}
      <div className="mt-4 flex justify-center gap-2">
        <button className="btn-primary" onClick={reset}>Try again</button>
        <a href="/admin/artisans" className="btn-outline">Back to artisans</a>
      </div>
    </div>
  );
}
