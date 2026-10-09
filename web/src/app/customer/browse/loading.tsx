export default function BrowseLoading() {
  return (
    <div className="mx-auto max-w-6xl animate-pulse px-4 py-10 space-y-6">
      <div className="space-y-2">
        <div className="h-8 w-48 rounded-lg bg-stone-200" />
        <div className="h-9 w-64 rounded-lg bg-stone-100" />
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 pt-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="card overflow-hidden border border-stone-100 bg-white shadow-xs">
            <div className="h-40 w-full bg-stone-200" />
            <div className="p-4 space-y-2.5">
              <div className="h-4 w-3/4 rounded bg-stone-200" />
              <div className="h-3 w-full rounded bg-stone-100" />
              <div className="flex justify-between items-center pt-2">
                <div className="h-5 w-16 rounded bg-stone-200" />
                <div className="h-3 w-12 rounded bg-stone-100" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
