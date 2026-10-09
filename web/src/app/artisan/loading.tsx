export default function ArtisanLoading() {
  return (
    <div className="mx-auto max-w-5xl animate-pulse space-y-6 px-4 py-8">
      {/* Header bar skeleton */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-200/60 pb-4">
        <div className="space-y-2">
          <div className="h-8 w-56 rounded-lg bg-stone-200" />
          <div className="h-4 w-72 rounded bg-stone-100" />
        </div>
        <div className="h-9 w-28 rounded-lg bg-stone-200" />
      </div>

      {/* Metric Cards Grid */}
      <div className="grid gap-4 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="card p-5 border border-stone-100 bg-white space-y-2">
            <div className="h-3 w-24 rounded bg-stone-200" />
            <div className="h-8 w-14 rounded bg-stone-300" />
          </div>
        ))}
      </div>

      {/* List items skeleton */}
      <div className="space-y-3 pt-4">
        <div className="h-6 w-36 rounded bg-stone-200" />
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="card flex items-center justify-between p-4 border border-stone-100 bg-white">
            <div className="space-y-2 flex-1">
              <div className="h-4 w-1/3 rounded bg-stone-200" />
              <div className="h-3 w-1/4 rounded bg-stone-100" />
            </div>
            <div className="h-6 w-20 rounded-full bg-stone-100" />
          </div>
        ))}
      </div>
    </div>
  );
}
