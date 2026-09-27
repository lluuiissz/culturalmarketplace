import { listAllReviews } from '@/lib/db';
import ReviewsClient from './ReviewsClient';

export const dynamic = 'force-dynamic';

export default async function AdminReviewsPage() {
  const reviews = await listAllReviews();
  return (
    <div>
      <h1 className="font-serif text-2xl font-bold text-brand-900">Reviews</h1>
      <ReviewsClient
        initial={reviews.map((r) => ({
          item_id: r.id, product: r.product_name, customer: r.customer_name ?? 'Customer',
          rating: r.review_rating ?? 0, comment: r.review_comment,
          visible: r.review_visible ?? true,
          reviewed: r.reviewed_at ? new Date(r.reviewed_at).toLocaleString() : '',
        }))}
      />
    </div>
  );
}
