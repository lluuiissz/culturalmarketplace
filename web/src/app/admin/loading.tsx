export default function AdminLoading() {
  return (
    <div className="animate-pulse space-y-6 py-2">
      <div className="space-y-2 border-b border-stone-200/60 pb-4">
        <div className="h-7 w-48 rounded-lg bg-stone-200" />
        <div className="h-4 w-80 rounded bg-stone-100" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="card p-5 border border-stone-100 bg-white space-y-2">
            <div className="h-3 w-24 rounded bg-stone-200" />
            <div className="h-8 w-16 rounded bg-stone-300" />
          </div>
        ))}
      </div>

      <div className="card mt-6 p-4 border border-stone-100 bg-white space-y-3">
        <div className="h-5 w-36 rounded bg-stone-200" />
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-10 rounded bg-stone-50" />
        ))}
      </div>
    </div>
  );
}
