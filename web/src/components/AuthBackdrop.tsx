/**
 * AuthBackdrop
 * Decorative, non-interactive background for the auth pages.
 * Inspired by woven diamond / zigzag motifs of Agusan del Sur
 * Indigenous textiles. Place it as the FIRST child of a `relative
 * overflow-hidden` wrapper; it fills the wrapper and sits behind
 * everything that comes after it.
 *
 * Reuses --weave-diamond and --weave-kalinga from globals.css.
 */

const CRIMSON = '#9E2A2B';
const OCHRE = '#C5832B';

function Medallion({
  tone,
  className = '',
}: {
  tone: 'crimson' | 'ochre';
  className?: string;
}) {
  const a = tone === 'crimson' ? CRIMSON : OCHRE;
  const b = tone === 'crimson' ? OCHRE : CRIMSON;

  return (
    <svg
      viewBox="-12 -12 224 224"
      fill="none"
      aria-hidden="true"
      className={className}
    >
      <g stroke={a} strokeWidth="1.5">
        <path d="M100 4 196 100 100 196 4 100Z" />
        <path d="M100 28 172 100 100 172 28 100Z" />
        <path d="M100 52 148 100 100 148 52 100Z" />
      </g>
      {/* diamond tips */}
      <g fill={b}>
        <path d="M100 -8 108 0 100 8 92 0Z" />
        <path d="M208 100 200 108 192 100 200 92Z" />
        <path d="M100 192 108 200 100 208 92 200Z" />
        <path d="M-8 100 0 92 8 100 0 108Z" />
      </g>
      <path d="M100 76 124 100 100 124 76 100Z" fill={b} />
      <path d="M100 90 110 100 100 110 90 100Z" fill="#FFFFFF" fillOpacity="0.6" />
    </svg>
  );
}

const FLOATERS = [
  { left: '7%', top: '18%', size: 14, color: OCHRE, delay: '0s' },
  { left: '14%', top: '62%', size: 10, color: CRIMSON, delay: '1.2s' },
  { left: '22%', top: '84%', size: 16, color: OCHRE, delay: '2.4s' },
  { left: '88%', top: '14%', size: 12, color: CRIMSON, delay: '0.6s' },
  { left: '93%', top: '48%', size: 16, color: OCHRE, delay: '1.8s' },
  { left: '80%', top: '80%', size: 10, color: CRIMSON, delay: '3s' },
];

const FADE_RIGHT = 'linear-gradient(to right, #000, transparent)';
const FADE_LEFT = 'linear-gradient(to left, #000, transparent)';

export default function AuthBackdrop() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 overflow-hidden"
    >
      {/* Warm glows */}
      <div
        className="absolute -left-40 -top-40 h-[520px] w-[520px] rounded-full"
        style={{
          background:
            'radial-gradient(circle, rgba(197,131,43,0.24), transparent 70%)',
        }}
      />
      <div
        className="absolute -bottom-48 -right-40 h-[560px] w-[560px] rounded-full"
        style={{
          background:
            'radial-gradient(circle, rgba(158,42,43,0.18), transparent 70%)',
        }}
      />

      {/* Woven diamond columns (large screens), fading toward the card */}
      <div
        className="absolute inset-y-0 left-0 hidden w-28 lg:block"
        style={{
          backgroundImage: 'var(--weave-diamond)',
          backgroundSize: '28px 28px',
          maskImage: FADE_RIGHT,
          WebkitMaskImage: FADE_RIGHT,
        }}
      />
      <div
        className="absolute inset-y-0 right-0 hidden w-28 lg:block"
        style={{
          backgroundImage: 'var(--weave-diamond)',
          backgroundSize: '28px 28px',
          maskImage: FADE_LEFT,
          WebkitMaskImage: FADE_LEFT,
        }}
      />

      {/* Slowly turning medallions */}
      <Medallion
        tone="crimson"
        className="backdrop-spin absolute -right-28 -top-28 w-[340px] opacity-[0.16] sm:w-[440px]"
      />
      <Medallion
        tone="ochre"
        className="backdrop-spin-reverse absolute -bottom-32 -left-28 w-[340px] opacity-[0.20] sm:w-[440px]"
      />

      {/* Floating diamonds */}
      {FLOATERS.map((f, i) => (
        <span
          key={i}
          className="backdrop-float absolute hidden opacity-30 sm:block"
          style={{
            left: f.left,
            top: f.top,
            width: f.size,
            height: f.size,
            backgroundColor: f.color,
            animationDelay: f.delay,
          }}
        />
      ))}

      {/* Woven strips along top and bottom edges */}
      <div
        className="backdrop-drift absolute inset-x-0 top-0 h-6 opacity-80"
        style={{
          backgroundImage: 'var(--weave-kalinga)',
          backgroundSize: '48px 24px',
          backgroundRepeat: 'repeat-x',
        }}
      />
      <div
        className="backdrop-drift-reverse absolute inset-x-0 bottom-0 h-6 opacity-80"
        style={{
          backgroundImage: 'var(--weave-kalinga)',
          backgroundSize: '48px 24px',
          backgroundRepeat: 'repeat-x',
        }}
      />
    </div>
  );
}
