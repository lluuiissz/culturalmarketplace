import Link from 'next/link';
import { redirect } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import WeaveDivider from '@/components/WeaveDivider';
import { getSession } from '@/lib/auth';
import { getCart, getUserPhone } from '@/lib/db';
import { listAddresses } from '@/lib/adminDb';
import CheckoutClient from './CheckoutClient';

export const dynamic = 'force-dynamic';

export default async function CheckoutPage({
  searchParams,
}: {
  searchParams?: Promise<{ items?: string }>;
}) {
  const session = await getSession();
  if (!session) redirect('/auth/login?next=/checkout');
  if (session.role !== 'customer') redirect('/');

  const sp = searchParams ? await searchParams : {};
  const selectedParam = sp.items;
  const selectedItemIds = selectedParam
    ? new Set(selectedParam.split(',').map((x) => Number(x.trim())).filter((n) => !isNaN(n) && n > 0))
    : null;

  const [cart, addresses, profilePhone] = await Promise.all([
    getCart(session.id),
    listAddresses(session.id),
    getUserPhone(session.id),
  ]);

  const items = cart
    .filter((i) => i.product && (!selectedItemIds || selectedItemIds.has(i.id)))
    .map((i) => {
      let itemPrice = Number(i.product!.price);
      if (i.purchase_type === 'workshop') {
        itemPrice = Number(i.product!.tutorial_price ?? i.product!.price);
      } else if (i.selected_variant && i.product!.variations_data) {
        const matching = i.product!.variations_data.filter((x) =>
          `${x.typeLabel}: ${x.name}` === i.selected_variant ||
          (i.selected_variant && i.selected_variant.includes(`${x.typeLabel}: ${x.name}`))
        );
        matching.forEach((v) => {
          if (v && v.price > 0) itemPrice += Number(v.price);
        });
      }
      return {
        cart_item_id: i.id,
        name: i.product!.name,
        price: itemPrice,
        quantity: i.quantity,
        variant: i.selected_variant,
        attendee_name: i.attendee_name ?? null,
        attendee_for: i.attendee_for ?? null,
        purchase_type: i.purchase_type,
        product_id: i.product_id,
        artisan_id: i.product!.artisan_id,
      };
    });

  const addressRows = addresses.map((a) => ({
    id: a.id,
    label: a.label,
    full_name: a.full_name,
    phone: a.phone,
    address: a.address,
    landmark: a.landmark,
    is_default: a.is_default,
  }));

  return (
    <div className="min-h-screen flex flex-col bg-canvas">
      <Header />

      <main className="mx-auto max-w-4xl px-4 py-8 flex-1 w-full">
        {/* Breadcrumb Navigation */}
        <div className="mb-4 flex items-center gap-2 text-xs text-stone-500">
          <Link href="/cart" className="hover:text-crimson-700">Artisan Basket</Link>
          <span>/</span>
          <span className="font-semibold text-charcoal-900">Secure Artisan Exchange</span>
        </div>

        <div className="flex items-center justify-between border-b border-abaca-200 pb-4">
          <div>
            <h1 className="font-sculpted text-2xl sm:text-3xl font-bold text-charcoal-900">
              Secure Artisan Exchange
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-stone-600">
              Confirm your delivery address and preferred settlement method.
            </p>
          </div>
          <Link href="/cart" className="text-xs font-semibold text-crimson-700 hover:underline">
            ← Return to Basket
          </Link>
        </div>

        {items.length === 0 ? (
          <div className="my-12 rounded-3xl border border-abaca-200 bg-white p-10 text-center shadow-xs max-w-md mx-auto">
            <div className="text-4xl mb-3">🧺</div>
            <h2 className="font-sculpted text-lg font-bold text-charcoal-900">
              No items selected for exchange
            </h2>
            <p className="mt-2 text-xs text-stone-500">
              Please choose at least one handcrafted item or workshop pass in your artisan basket.
            </p>
            <Link className="btn-primary mt-6 text-xs px-5 py-2.5 font-semibold inline-flex" href="/cart">
              ← Return to Artisan Basket
            </Link>
          </div>
        ) : (
          <div className="mt-6">
            <CheckoutClient
              items={items}
              profile={{ name: session.name, phone: profilePhone ?? '' }}
              addresses={addressRows}
            />
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
