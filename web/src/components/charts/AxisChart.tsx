export interface ChartSeries { name: string; values: number[]; color: string }

const compact = (v: number) =>
  v >= 1_000_000 ? `${(v / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`
  : v >= 1000 ? `${(v / 1000).toFixed(1).replace(/\.0$/, '')}k`
  : String(Math.round(v));

function niceMax(v: number) {
  if (v <= 0) return 1;
  const exp = 10 ** Math.floor(Math.log10(v));
  const f = v / exp;
  const nf = f <= 1 ? 1 : f <= 2 ? 2 : f <= 5 ? 5 : 10;
  return nf * exp;
}

// Line/area or grouped-bar chart with y-axis, gridlines, x labels and a legend.
export default function AxisChart({
  labels, series, variant = 'line', formatY = compact, formatTip = (v: number) => String(v), ariaLabel = 'Chart',
}: {
  labels: string[];
  series: ChartSeries[];
  variant?: 'line' | 'bars';
  formatY?: (v: number) => string;
  formatTip?: (v: number) => string;
  ariaLabel?: string;
}) {
  const maxVal = Math.max(...series.flatMap((s) => s.values), 0);
  if (maxVal === 0 || labels.length === 0) {
    return <p className="py-10 text-center text-sm text-[#000000]/60">No activity in this period yet.</p>;
  }

  const W = 600, H = 240, L = 46, R = 12, T = 14, B = 30;
  const pw = W - L - R, ph = H - T - B;
  const top = niceMax(maxVal);
  const ticks = [0, 1, 2, 3, 4].map((i) => (top / 4) * i);
  const n = labels.length;
  const y = (v: number) => T + ph - (v / top) * ph;
  const lineX = (i: number) => (n > 1 ? L + (i * pw) / (n - 1) : L + pw / 2);
  const gw = pw / n;
  const step = Math.ceil(n / 7);

  // Peak marker (single-series line charts only).
  const s0 = series[0];
  const peakIdx = s0.values.indexOf(Math.max(...s0.values));
  const showPeak = variant === 'line' && series.length === 1;

  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label={ariaLabel}>
        {ticks.map((t) => (
          <g key={t}>
            <line x1={L} x2={W - R} y1={y(t)} y2={y(t)} stroke="#000000" strokeOpacity="0.1" strokeDasharray={t === 0 ? undefined : '3 3'} />
            <text x={L - 6} y={y(t) + 3} textAnchor="end" fontSize="10" fill="#000000" fillOpacity="0.6">{formatY(t)}</text>
          </g>
        ))}

        {labels.map((lb, i) =>
          i % step === 0 || i === n - 1 ? (
            <text key={i} x={variant === 'bars' ? L + gw * i + gw / 2 : lineX(i)} y={H - 10} textAnchor="middle" fontSize="10" fill="#000000" fillOpacity="0.6">{lb}</text>
          ) : null,
        )}

        {variant === 'line' &&
          series.map((s) => {
            const pts = s.values.map((v, i) => `${lineX(i).toFixed(1)},${y(v).toFixed(1)}`);
            const area = `${lineX(0).toFixed(1)},${y(0)} ${pts.join(' ')} ${lineX(n - 1).toFixed(1)},${y(0)}`;
            return (
              <g key={s.name}>
                <polygon points={area} fill={s.color} opacity="0.12" />
                <polyline points={pts.join(' ')} fill="none" stroke={s.color} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
                {s.values.map((v, i) => (
                  <circle key={i} cx={lineX(i)} cy={y(v)} r="3" fill="#fdfbf9" stroke={s.color} strokeWidth="2">
                    <title>{`${labels[i]} · ${s.name}: ${formatTip(v)}`}</title>
                  </circle>
                ))}
              </g>
            );
          })}

        {showPeak && (
          <text
            x={Math.min(Math.max(lineX(peakIdx), L + 30), W - R - 30)}
            y={Math.max(y(s0.values[peakIdx]) - 10, 10)}
            textAnchor="middle" fontSize="10" fontWeight="600" fill={s0.color}
          >
            Peak {formatY(s0.values[peakIdx])}
          </text>
        )}

        {variant === 'bars' &&
          labels.map((lb, i) => {
            const sc = series.length;
            const totalW = Math.min(gw * 0.72, 36 * sc);
            const bw = totalW / sc;
            const start = L + gw * i + (gw - totalW) / 2;
            return series.map((s, j) => {
              const v = s.values[i] ?? 0;
              const bh = (v / top) * ph;
              return (
                <rect key={`${i}-${s.name}`} x={start + j * bw} y={T + ph - bh} width={Math.max(bw - 1, 1)} height={bh} rx="2" fill={s.color}>
                  <title>{`${lb} · ${s.name}: ${formatTip(v)}`}</title>
                </rect>
              );
            });
          })}
      </svg>

      {series.length > 1 && (
        <div className="mt-2 flex flex-wrap gap-4 text-xs text-[#000000]/70">
          {series.map((s) => (
            <span key={s.name} className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: s.color }} />
              {s.name}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}