// Horizontal bar list rendered with plain divs — no chart library, no client JS.
// Used for demographics and statistics on the admin analytics page.
export default function BarList({
  items, formatValue = (v) => String(v), emptyText = 'No data yet.',
}: {
  items: Array<{ label: string; value: number; sub?: string }>;
  formatValue?: (v: number) => string;
  emptyText?: string;
}) {
  if (items.length === 0) {
    return <p className="text-sm text-stone-400">{emptyText}</p>;
  }
  const max = Math.max(...items.map((i) => i.value), 1);
  return (
    <div className="space-y-2">
      {items.map((it) => (
        <div key={it.label}>
          <div className="flex items-baseline justify-between gap-2 text-sm">
            <span className="min-w-0 truncate text-stone-700" title={it.label}>{it.label}</span>
            <span className="shrink-0 font-semibold text-stone-600">
              {formatValue(it.value)}
              {it.sub && <span className="ml-1 font-normal text-stone-400">{it.sub}</span>}
            </span>
          </div>
          <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-brand-50">
            <div
              className="h-full rounded-full bg-brand-500 transition-all"
              style={{ width: `${Math.max((it.value / max) * 100, 2)}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
