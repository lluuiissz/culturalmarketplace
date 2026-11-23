export interface DonutSlice { label: string; value: number; color: string }

// Donut with the total in the centre and a legend showing value and share.
export default function DonutChart({
  slices, centerLabel = 'total', formatValue = (v: number) => String(v),
}: {
  slices: DonutSlice[];
  centerLabel?: string;
  formatValue?: (v: number) => string;
}) {
  const total = slices.reduce((s, x) => s + x.value, 0);
  if (total === 0) return <p className="py-10 text-center text-sm text-[#000000]/60">No data yet.</p>;

  let acc = 0;
  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row">
      <svg viewBox="0 0 42 42" className="h-36 w-36 shrink-0" role="img" aria-label="Share breakdown">
        <circle cx="21" cy="21" r="15.9155" fill="none" stroke="#000000" strokeOpacity="0.1" strokeWidth="6" />
        {slices.map((s) => {
          const pct = (s.value / total) * 100;
          const offset = 25 - acc;
          acc += pct;
          return (
            <circle
              key={s.label} cx="21" cy="21" r="15.9155" fill="none"
              stroke={s.color} strokeWidth="6"
              strokeDasharray={`${pct} ${100 - pct}`} strokeDashoffset={offset}
            >
              <title>{`${s.label}: ${formatValue(s.value)} (${pct.toFixed(0)}%)`}</title>
            </circle>
          );
        })}
        <text x="21" y="21.5" textAnchor="middle" fontSize="6" fontWeight="700" fill="#000000">{formatValue(total)}</text>
        <text x="21" y="26" textAnchor="middle" fontSize="2.8" fill="#000000" fillOpacity="0.6">{centerLabel}</text>
      </svg>

      <ul className="w-full min-w-0 space-y-1.5 text-sm">
        {slices.map((s) => (
          <li key={s.label} className="flex items-center justify-between gap-2">
            <span className="flex min-w-0 items-center gap-2 text-[#000000]/70">
              <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: s.color }} />
              <span className="truncate capitalize">{s.label}</span>
            </span>
            <span className="shrink-0 text-[#000000]/70">
              <b className="text-[#000000]">{formatValue(s.value)}</b> · {((s.value / total) * 100).toFixed(0)}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}