import Link from 'next/link';
import { redirect } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import WeaveDivider from '@/components/WeaveDivider';
import { getSession } from '@/lib/auth';
import { getCart } from '@/lib/db';
import CartClient from './CartClient';

export const dynamic = 'force-dynamic';

export default async function CartPage() {
  const session = await getSession();
  if (!session) redirect('/auth/login?next=/cart');
  if (session.role !== 'customer') {
    return (
      <div className="min-h-screen flex flex-col bg-canvas">
        <Header />
        <main className="mx-auto max-w-2xl px-4 py-20 text-center flex-1 flex flex-col justify-center">
          <div className="rounded-3xl border border-abaca-200 bg-white p-8 shadow-xs">
            <p className="text-3xl mb-2">🧺</p>
            <h1 className="font-sculpted text-xl font-bold text-charcoal-900">Patron Basket Notice</h1>
            <p className="mt-2 text-xs text-stone-600">The artisan basket is exclusively available for customer patron accounts.</p>
            <Link className="btn-primary mt-5 text-xs px-4 py-2" href="/">Back to Storefront</Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const cart = await getCart(session.id);

  return (
    <div className="min-h-screen flex flex-col bg-canvas">
      <Header />

      <main className="mx-auto max-w-4xl px-4 py-10 flex-1 w-full">
        {/* Page Header */}
        <div className="border-b border-abaca-200 pb-5">
          <div className="flex items-center gap-2 text-xs text-stone-500 mb-1">
            <Link href="/" className="hover:text-crimson-700">Home</Link>
            <span>/</span>
            <Link href="/customer/browse" className="hover:text-crimson-700">Discover the Craft</Link>
            <span>/</span>
            <span className="font-semibold text-charcoal-900">Artisan Basket</span>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-sculpted text-2xl sm:text-3xl font-bold text-charcoal-900">
                Your Artisan Basket
              </h1>
              <p className="mt-1 text-xs sm:text-sm text-stone-600">
                Review your handcrafted selections and workshop passes before completing the secure exchange.
              </p>
            </div>
            <div className="text-2xl text-ochre-600 hidden sm:block">🧺</div>
          </div>
        </div>

        <div className="mt-6">
          <CartClient
            initialItems={cart.map((i) => {
              let itemPrice = Number(i.product?.price ?? 0);
              if (i.purchase_type === 'workshop') {
                itemPrice = Number(i.product?.tutorial_price ?? i.product?.price ?? 0);
              } else if (i.selected_variant && i.product?.variations_data) {
                const matching = i.product.variations_data.filter((x) =>
                  `${x.typeLabel}: ${x.name}` === i.selected_variant ||
                  (i.selected_variant && i.selected_variant.includes(`${x.typeLabel}: ${x.name}`))
                );
                matching.forEach((v) => {
                  if (v && v.price > 0) itemPrice += Number(v.price);
                });
              }
              return {
                id: i.id,
                product_id: i.product_id,
                quantity: i.quantity,
                name: i.product?.name ?? 'Unknown product',
                price: itemPrice,
                variant: i.selected_variant,
                purchase_type: i.purchase_type,
                session: i.selected_session,
                image_path: i.product?.image_path ?? null,
                attendee_name: i.attendee_name ?? null,
                attendee_for: i.attendee_for ?? null,
              };
            })}
          />
        </div>
      </main>

      <Footer />
    </div>
  );
}
