import Link from 'next/link';

// Route-level 404: unknown URLs get a friendly, brand-consistent page with
// paths back into the marketplace.
export default function NotFound() {
  return (
    <main className="flex min-h-[70vh] items-center justify-center px-4">
      <div className="card max-w-md p-8 text-center">
        <div className="text-5xl">🧭</div>
        <h1 className="mt-3 font-serif text-2xl font-bold text-brand-900">Page not found</h1>
        <p className="mt-2 text-sm text-stone-600">
          The page you&apos;re looking for doesn&apos;t exist or may have been moved.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Link href="/" className="btn-primary">Back to home</Link>
          <Link href="/customer/browse" className="btn-outline">Browse crafts</Link>
        </div>
      </div>
    </main>
  );
}
