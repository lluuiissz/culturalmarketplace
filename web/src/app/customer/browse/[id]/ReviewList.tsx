import type { ProductReview } from '@/lib/types';

function Stars({ n }: { n: number }) {
  return (
    <span className="text-[#F5A000]" aria-label={`${n} out of 5`}>
      {'★'.repeat(n)}
      <span className="text-[#D6D0C9]">{'★'.repeat(5 - n)}</span>
    </span>
  );
}

export default function ReviewList({ reviews, empty }: { reviews: ProductReview[]; empty: string }) {
  if (reviews.length === 0) return <p className="mt-3 text-xs text-[#71675F]">{empty}</p>;

  const avg = reviews.reduce((s, r) => s + r.review_rating, 0) / reviews.length;

  return (
    <div className="mt-3">
      <p className="text-xs text-[#71675F]">
        <span className="text-sm font-bold text-[#3D3028]">{avg.toFixed(1)}</span> / 5 ·{' '}
        {reviews.length} review{reviews.length > 1 ? 's' : ''}
      </p>
      <div className="mt-2 max-h-[240px] space-y-3 overflow-y-auto pr-1">
        {reviews.map((r) => (
          <div key={r.id} className="border-b border-[#E8DCCB] pb-2 last:border-0">
            <div className="flex items-center justify-between gap-2 text-xs">
              <span className="font-semibold text-[#3D3028]">{r.customer_name || 'Customer'}</span>
              <Stars n={r.review_rating} />
            </div>
            {r.review_comment && (
              <p className="mt-1 text-xs leading-snug text-[#5A5048]">“{r.review_comment}”</p>
            )}
            {r.reviewed_at && (
              <p className="mt-0.5 text-[10px] text-stone-400">
                {new Date(r.reviewed_at).toLocaleDateString()}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}