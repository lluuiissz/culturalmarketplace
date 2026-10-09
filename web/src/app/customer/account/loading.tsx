export default function CustomerAccountLoading() {
  return (
    <div className="mx-auto max-w-4xl animate-pulse space-y-6 py-4">
      {/* Title skeleton */}
      <div className="space-y-2 border-b border-stone-200/60 pb-4">
        <div className="h-8 w-64 rounded-lg bg-stone-200" />
        <div className="h-4 w-96 rounded bg-stone-100" />
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="card p-4 border border-stone-100 bg-white space-y-2">
            <div className="h-3 w-20 rounded bg-stone-200" />
            <div className="h-7 w-12 rounded bg-stone-300" />
          </div>
        ))}
      </div>

      {/* Main Content Cards */}
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-stone-200 bg-white p-5 space-y-3 shadow-xs">
            <div className="flex items-center justify-between">
              <div className="h-5 w-48 rounded bg-stone-200" />
              <div className="h-6 w-20 rounded-full bg-stone-100" />
            </div>
            <div className="h-4 w-3/4 rounded bg-stone-100" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
              <div className="h-14 rounded-lg bg-stone-100" />
              <div className="h-14 rounded-lg bg-stone-100" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
