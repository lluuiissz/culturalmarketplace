import Link from 'next/link';
import Image from 'next/image';
import type { Product } from '@/lib/types';

export default function ProductCard({ product, priority = false }: { product: Product; priority?: boolean }) {
  return (
    <Link href={`/customer/browse/${product.id}`} className="card group overflow-hidden transition-shadow hover:shadow-md">
      {product.image_path ? (
        // Product photos are external Supabase Storage URLs — use next/image (unoptimized
        // since we have no image CDN locally, but it still lazy-loads below-fold cards).
        <Image
          src={product.image_path}
          alt={product.name}
          width={640}
          height={320}
          sizes="(max-width: 768px) 50vw, 25vw"
          className="h-40 w-full object-cover transition-transform group-hover:scale-105"
          priority={priority}
        />
      ) : (
        <div className="flex h-40 items-center justify-center bg-brand-100 text-5xl">
          {product.has_tutorial ? '🧺' : '🧶'}
        </div>
      )}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="line-clamp-1 font-semibold text-stone-800 group-hover:text-brand-700">{product.name}</h3>
          {product.has_tutorial && <span className="badge bg-leaf-500/10 text-leaf-700">Workshop</span>}
        </div>
        <p className="mt-1 line-clamp-2 text-sm text-stone-500">{product.description ?? ''}</p>
        <div className="mt-3 flex items-center justify-between">
          <span className="font-bold text-brand-700">₱{Number(product.price).toFixed(2)}</span>
          <span className="text-xs text-stone-400">
            {product.has_variations && product.variations_data?.length ? `${product.variations_data.length} variants` : `${product.stock_quantity} in stock`}
          </span>
        </div>
      </div>
    </Link>
  );
}
