// Route-level loading skeleton: shown instead of a blank screen whenever a
// server component is fetching (data-heavy portals get instant feedback
// instead of a frozen page).
export default function Loading() {
  return (
    <div className="mx-auto max-w-6xl animate-pulse px-4 py-10">
      <div className="h-8 w-64 rounded bg-stone-200" />
      <div className="mt-4 h-4 w-40 rounded bg-stone-100" />
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-stone-100 bg-white p-4">
            <div className="h-32 rounded-lg bg-stone-200" />
            <div className="mt-3 h-4 w-3/4 rounded bg-stone-100" />
            <div className="mt-2 h-4 w-1/2 rounded bg-stone-100" />
          </div>
        ))}
      </div>
    </div>
  );
}
