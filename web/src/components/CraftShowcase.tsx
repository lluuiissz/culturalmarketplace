'use client';

import { useEffect, useRef, useState, type ReactElement } from 'react';

/**
 * CraftShowcase
 * Decorative column of arch-shaped "craft frames" shown beside the register
 * card on wide screens (xl and up).
 *
 *   <CraftShowcase side="left" />    baskets, headdresses, woven cloth
 *   <CraftShowcase side="right" />   beadwork, woven hats, woven bags
 *
 * Each frame shows a real photo if the file exists in /public/images/crafts/,
 * otherwise it falls back to an original animated illustration.
 *
 * Photo file names:
 *   left : basket.jpg   headdress.jpg   cloth.jpg
 *   right: beadwork.jpg hat.jpg         bag.jpg
 */

const CRIMSON = '#9E2A2B';
const DEEP = '#7A1F20';
const OCHRE = '#C5832B';
const GOLD = '#D9A24A';
const BROWN = '#7A4A12';
const CREAM = '#F6EBD3';
const CHARCOAL = '#2B2B2B';

/* ---------- Illustrations (left side) ---------- */

function BasketArt() {
  return (
    <svg viewBox="0 0 120 130" className="h-full w-full" fill="none">
      <defs>
        <clipPath id="basket-body">
          <path d="M16 52 H104 L92 118 Q60 126 28 118 Z" />
        </clipPath>
      </defs>

      {/* handle */}
      <path
        d="M30 52 C30 6, 90 6, 90 52"
        stroke={CHARCOAL}
        strokeWidth="5"
        strokeLinecap="round"
      />

      {/* body */}
      <path d="M16 52 H104 L92 118 Q60 126 28 118 Z" fill={OCHRE} />

      <g clipPath="url(#basket-body)">
        {/* diagonal weave */}
        <g stroke={BROWN} strokeOpacity="0.35" strokeWidth="2">
          {Array.from({ length: 12 }).map((_, i) => (
            <path key={`a${i}`} d={`M${i * 12 - 10} 52 L${i * 12 + 14} 126`} />
          ))}
          {Array.from({ length: 12 }).map((_, i) => (
            <path key={`b${i}`} d={`M${i * 12 + 20} 52 L${i * 12 - 4} 126`} />
          ))}
        </g>
        {/* horizontal bands */}
        <g stroke={BROWN} strokeOpacity="0.55" strokeWidth="2.5">
          <path d="M0 66H120" />
          <path d="M0 102H120" />
        </g>
        {/* diamond band */}
        <g fill={CRIMSON}>
          {[26, 40, 54, 68, 82, 96].map((x) => (
            <path key={x} d={`M${x} 84 l7 -8 l7 8 l-7 8 z`} />
          ))}
        </g>
      </g>

      {/* rim */}
      <rect x="12" y="46" width="96" height="10" rx="5" fill={CRIMSON} />
    </svg>
  );
}

const FEATHERS = [
  { angle: -30, delay: '0s' },
  { angle: 0, delay: '0.8s' },
  { angle: 30, delay: '1.6s' },
];

function HeaddressArt() {
  return (
    <svg viewBox="0 0 120 130" className="h-full w-full" fill="none">
      {/* swaying feathers */}
      {FEATHERS.map((f) => (
        <g
          key={f.angle}
          className="feather-sway"
          style={{ animationDelay: f.delay }}
        >
          <path
            transform={`rotate(${f.angle} 60 76)`}
            d="M60 76 C46 46, 50 18, 60 6 C70 18, 74 46, 60 76Z"
            fill={f.angle === 0 ? OCHRE : DEEP}
          />
          <path
            transform={`rotate(${f.angle} 60 76)`}
            d="M60 74 L60 14"
            stroke={CREAM}
            strokeOpacity="0.7"
            strokeWidth="1.5"
          />
        </g>
      ))}

      {/* woven band */}
      <path d="M12 86 Q60 66 108 86 L108 106 Q60 86 12 106Z" fill={CRIMSON} />
      <path
        d="M12 86 Q60 66 108 86"
        stroke={OCHRE}
        strokeWidth="2.5"
        fill="none"
      />
      <path
        d="M12 106 Q60 86 108 106"
        stroke={OCHRE}
        strokeWidth="2.5"
        fill="none"
      />
      <g fill={CREAM}>
        {[
          [28, 91],
          [44, 87],
          [60, 85],
          [76, 87],
          [92, 91],
        ].map(([x, y]) => (
          <path key={x} d={`M${x} ${y - 5} l5 5 l-5 5 l-5 -5z`} />
        ))}
      </g>

      {/* hanging beads */}
      {[22, 98].map((x) => (
        <g key={x}>
          <path d={`M${x} 101 V126`} stroke={CHARCOAL} strokeWidth="1" />
          <circle cx={x} cy="108" r="3" fill={OCHRE} />
          <circle cx={x} cy="116" r="3" fill={CRIMSON} />
          <circle cx={x} cy="124" r="3" fill={OCHRE} />
        </g>
      ))}
    </svg>
  );
}

function zigzag(y: number) {
  const pts: string[] = [];
  for (let i = 0; i <= 8; i++) {
    pts.push(`${i === 0 ? 'M' : 'L'}${14 + i * 11.5} ${y + (i % 2 ? -8 : 8)}`);
  }
  return pts.join(' ');
}

function ClothArt() {
  return (
    <svg viewBox="0 0 120 130" className="h-full w-full" fill="none">
      <rect x="14" y="12" width="92" height="104" rx="3" fill={DEEP} />

      <path d={zigzag(32)} stroke={OCHRE} strokeWidth="4" strokeLinejoin="round" />
      <path d={zigzag(98)} stroke={OCHRE} strokeWidth="4" strokeLinejoin="round" />

      {[34, 60, 86].map((x) => (
        <g key={x}>
          <path d={`M${x} 52 l17 14 l-17 14 l-17 -14z`} fill={CREAM} />
          <path d={`M${x} 58 l10 8 l-10 8 l-10 -8z`} fill={CRIMSON} />
        </g>
      ))}

      {/* fringe */}
      <g stroke={OCHRE} strokeWidth="2" strokeLinecap="round">
        {Array.from({ length: 16 }).map((_, i) => (
          <path key={i} d={`M${18 + i * 5.6} 116 v10`} />
        ))}
      </g>
    </svg>
  );
}

/* ---------- Illustrations (right side) ---------- */

const BEAD_ROWS = [
  { r: 34, step: 9, colors: [CRIMSON, CREAM] },
  { r: 46, step: 7.5, colors: [OCHRE, DEEP] },
  { r: 58, step: 6.5, colors: [CRIMSON, OCHRE, CREAM] },
];

function BeadsArt() {
  return (
    <svg viewBox="0 0 120 130" className="h-full w-full" fill="none">
      {/* rows of beads forming a collar necklace */}
      {BEAD_ROWS.map((row) => {
        const count = Math.floor(124 / row.step) + 1;
        return Array.from({ length: count }).map((_, i) => {
          const a = ((28 + i * row.step) * Math.PI) / 180;
          const x = (60 + row.r * Math.cos(a)).toFixed(1);
          const y = (24 + row.r * Math.sin(a)).toFixed(1);
          return (
            <circle
              key={`${row.r}-${i}`}
              cx={x}
              cy={y}
              r="3.2"
              fill={row.colors[i % row.colors.length]}
            />
          );
        });
      })}

      {/* pendant */}
      <path d="M60 84 l10 13 l-10 13 l-10 -13z" fill={CRIMSON} />
      <path d="M60 91 l5 6 l-5 6 l-5 -6z" fill={CREAM} />

      {/* tassel */}
      <path d="M60 110 V122" stroke={CHARCOAL} strokeWidth="1.2" />
      <circle cx="60" cy="125" r="3" fill={OCHRE} />
    </svg>
  );
}

function HatArt() {
  return (
    <svg viewBox="0 0 120 130" className="h-full w-full" fill="none">
      <defs>
        <clipPath id="hat-dome">
          <path d="M22 88 C22 32, 44 14, 60 14 C76 14, 98 32, 98 88 Z" />
        </clipPath>
      </defs>

      {/* brim */}
      <ellipse cx="60" cy="90" rx="54" ry="15" fill={OCHRE} />
      <ellipse cx="60" cy="90" rx="44" ry="11" stroke={BROWN} strokeOpacity="0.35" strokeWidth="1.5" />
      <ellipse cx="60" cy="90" rx="33" ry="7.5" stroke={BROWN} strokeOpacity="0.3" strokeWidth="1.5" />

      {/* dome */}
      <path d="M22 88 C22 32, 44 14, 60 14 C76 14, 98 32, 98 88 Z" fill={GOLD} />
      <g clipPath="url(#hat-dome)" stroke={BROWN} strokeOpacity="0.4" strokeWidth="1.8">
        {Array.from({ length: 10 }).map((_, i) => (
          <path key={`r${i}`} d={`M60 14 L${18 + i * 9} 92`} />
        ))}
        {[38, 54, 70].map((y) => (
          <path key={y} d={`M0 ${y} Q60 ${y - 10} 120 ${y}`} />
        ))}
      </g>

      {/* band with diamonds */}
      <path d="M22 84 Q60 98 98 84" stroke={CRIMSON} strokeWidth="8" />
      <g fill={CREAM}>
        {[
          [36, 88.2],
          [52, 90.7],
          [68, 90.7],
          [84, 88.2],
        ].map(([x, y]) => (
          <path key={x} d={`M${x} ${y - 4} l4 4 l-4 4 l-4 -4z`} />
        ))}
      </g>

      {/* chin straps */}
      <path d="M26 97 Q24 112 34 124" stroke={CHARCOAL} strokeWidth="1.5" />
      <path d="M94 97 Q96 112 86 124" stroke={CHARCOAL} strokeWidth="1.5" />
      <circle cx="34" cy="125" r="3" fill={OCHRE} />
      <circle cx="86" cy="125" r="3" fill={OCHRE} />
    </svg>
  );
}

function BagArt() {
  return (
    <svg viewBox="0 0 120 130" className="h-full w-full" fill="none">
      <defs>
        <clipPath id="bag-body">
          <path d="M24 54 H96 L104 114 Q60 124 16 114 Z" />
        </clipPath>
      </defs>

      {/* strap */}
      <path
        d="M38 54 C38 10, 82 10, 82 54"
        stroke={BROWN}
        strokeWidth="5"
        strokeLinecap="round"
      />

      {/* body */}
      <path d="M24 54 H96 L104 114 Q60 124 16 114 Z" fill={CRIMSON} />

      <g clipPath="url(#bag-body)">
        {/* woven grid */}
        <g stroke={OCHRE} strokeOpacity="0.35" strokeWidth="2">
          {Array.from({ length: 16 }).map((_, i) => (
            <path key={`v${i}`} d={`M${i * 8} 54 V126`} />
          ))}
          {Array.from({ length: 10 }).map((_, i) => (
            <path key={`h${i}`} d={`M0 ${54 + i * 8} H120`} />
          ))}
        </g>
        {/* zigzag bands */}
        <path d={zigzag(78)} stroke={OCHRE} strokeWidth="4" strokeLinejoin="round" />
        <path d={zigzag(98)} stroke={CREAM} strokeWidth="3" strokeLinejoin="round" />
      </g>

      {/* rim */}
      <rect x="20" y="48" width="80" height="9" rx="4.5" fill={DEEP} />
    </svg>
  );
}

/* ---------- Frames ---------- */

type CraftKey = 'basket' | 'headdress' | 'cloth' | 'beads' | 'hat' | 'bag';

type Craft = {
  key: CraftKey;
  caption: string;
  src: string;
  /** how far (px) the frame is pushed toward the card */
  shift: number;
  delay: string;
};

const ART: Record<CraftKey, () => ReactElement> = {
  basket: BasketArt,
  headdress: HeaddressArt,
  cloth: ClothArt,
  beads: BeadsArt,
  hat: HatArt,
  bag: BagArt,
};

const MAX_SHIFT = 44;

const LEFT_CRAFTS: Craft[] = [
  { key: 'basket', caption: 'Hand-woven Baskets', src: '/images/crafts/basket.jpg', shift: 0, delay: '0s' },
  { key: 'headdress', caption: 'Woven Headdresses', src: '/images/crafts/headdress.jpg', shift: 44, delay: '1.4s' },
  { key: 'cloth', caption: 'Traditional Weaves', src: '/images/crafts/cloth.jpg', shift: 8, delay: '2.8s' },
];

const RIGHT_CRAFTS: Craft[] = [
  { key: 'beads', caption: 'Beaded Jewelry', src: '/images/crafts/beadwork.jpg', shift: 0, delay: '0.7s' },
  { key: 'hat', caption: 'Necklace', src: '/images/crafts/hat.jpg', shift: 44, delay: '2.1s' },
  { key: 'bag', caption: 'Workshops', src: '/images/crafts/bag.jpg', shift: 8, delay: '3.5s' },
];

function CraftFrame({ craft, side }: { craft: Craft; side: 'left' | 'right' }) {
  const [photoOk, setPhotoOk] = useState(true);
  const imgRef = useRef<HTMLImageElement>(null);
  const Art = ART[craft.key];

  // Catch images that failed before React attached its error handler
  useEffect(() => {
    const el = imgRef.current;
    if (el && el.complete && el.naturalWidth === 0) setPhotoOk(false);
  }, []);

  // Left column hugs the card with marginLeft; right column mirrors it.
  const marginLeft = side === 'left' ? craft.shift : MAX_SHIFT - craft.shift;

  return (
    <figure
      className={`${side === 'left' ? 'craft-bob' : 'craft-bob-right'} w-[168px]`}
      style={{ marginLeft, animationDelay: craft.delay }}
    >
      <div className="relative h-[190px] w-full overflow-hidden rounded-b-2xl rounded-t-full border-2 border-ochre-600/50 bg-white/80 shadow-md">
        {photoOk ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              ref={imgRef}
              src={craft.src}
              alt=""
              onError={() => setPhotoOk(false)}
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#7A1F20]/25 via-transparent to-[#C5832B]/10" />
          </>
        ) : (
          <div className="flex h-full w-full items-end justify-center bg-gradient-to-b from-ochre-50 to-white px-6 pb-3 pt-8">
            <Art />
          </div>
        )}
      </div>

      <figcaption className="mt-2 text-center font-sculpted text-[11px] font-bold uppercase tracking-[0.18em] text-crimson-700/80">
        {craft.caption}
      </figcaption>
    </figure>
  );
}

const ASIDE_LEFT =
  'pointer-events-none absolute right-[calc(50%_+_288px_+_2.5rem)] top-1/2 hidden origin-right -translate-y-1/2 xl:block 2xl:scale-[1.15]';
const ASIDE_RIGHT =
  'pointer-events-none absolute left-[calc(50%_+_288px_+_2.5rem)] top-1/2 hidden origin-left -translate-y-1/2 xl:block 2xl:scale-[1.15]';

export default function CraftShowcase({
  side = 'left',
}: {
  side?: 'left' | 'right';
}) {
  const crafts = side === 'left' ? LEFT_CRAFTS : RIGHT_CRAFTS;
  const heading = side === 'left' ? 'Handcrafted Heritage' : 'Woven With Pride';

  return (
    <aside
      aria-hidden="true"
      className={side === 'left' ? ASIDE_LEFT : ASIDE_RIGHT}
    >
      <p className="mb-5 font-sculpted text-xs font-bold uppercase tracking-[0.28em] text-ochre-800">
        {heading}
      </p>

      <div className="flex flex-col gap-6">
        {crafts.map((c) => (
          <CraftFrame key={c.key} craft={c} side={side} />
        ))}
      </div>
    </aside>
  );
}
