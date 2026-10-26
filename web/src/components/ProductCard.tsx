import Link from 'next/link';
import Image from 'next/image';
import type { Product } from '@/lib/types';

export default function ProductCard({ product, priority = false }: { product: Product; priority?: boolean }) {
  return (
    <Link
      href={`/customer/browse/${product.id}`}
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-abaca-200/90 bg-white shadow-xs transition-all duration-200 hover:-translate-y-1 hover:border-ochre-400 hover:shadow-md"
    >
      {/* Photo with aspect ratio & subtle abaca texture fallback */}
      <div className="relative h-48 w-full overflow-hidden bg-abaca-100/60">
        {product.image_path ? (
          <Image
            src={product.image_path}
            alt={product.name}
            width={640}
            height={360}
            sizes="(max-width: 768px) 50vw, 25vw"
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            priority={priority}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-abaca-100 to-canvas text-5xl">
            {product.has_tutorial ? '🧺' : '🧶'}
          </div>
        )}

        {/* Top Badges */}
        <div className="absolute top-2.5 left-2.5 flex flex-wrap gap-1.5">
          {product.has_tutorial && (
            <span className="badge bg-ochre-400 text-charcoal-950 font-bold border border-ochre-500 shadow-xs text-[10px] py-0.5 px-2">
              🌿 Living Workshop
            </span>
          )}
          {product.nfc_tag_id && (
            <span className="badge bg-charcoal-900/90 text-ochre-300 shadow-xs text-[10px] font-bold py-0.5 px-2 backdrop-blur-xs">
              ✔ Verified NFC
            </span>
          )}
        </div>
      </div>

      {/* Card Content */}
      <div className="flex flex-1 flex-col justify-between p-4 bg-white/95">
        <div>
          <h3 className="line-clamp-1 font-sculpted text-base font-bold text-charcoal-900 group-hover:text-crimson-700 transition-colors">
            {product.name}
          </h3>

          {product.materials_used && (
            <p className="mt-0.5 line-clamp-1 text-[11px] font-medium text-ochre-700">
              🧵 {product.materials_used}
            </p>
          )}

          <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-stone-500">
            {product.description ?? ''}
          </p>
        </div>

        <div className="mt-4 flex items-center justify-between border-t border-abaca-100 pt-3">
          <div>
            <span className="text-[10px] uppercase tracking-wider text-stone-400 block font-semibold">Exchange</span>
            <span className="text-lg font-bold text-crimson-700">
              ₱{Number(product.price).toFixed(2)}
            </span>
          </div>
          <span className="text-right text-xs text-stone-400 font-medium">
            {product.has_variations && product.variations_data?.length
              ? `${product.variations_data.length} variants`
              : `${product.stock_quantity} available`}
          </span>
        </div>
      </div>
    </Link>
  );
}
