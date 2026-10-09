import Link from 'next/link';
import { redirect } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
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
        const v = i.product!.variations_data.find((x) => `${x.typeLabel}: ${x.name}` === i.selected_variant);
        if (v && v.price > 0) itemPrice += Number(v.price);
      }
      return {
        cart_item_id: i.id,
        name: i.product!.name,
        price: itemPrice,
        quantity: i.quantity,
        variant: i.selected_variant,
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
    <>
      <Header />
      <main className="mx-auto max-w-4xl px-4 py-10">
        <div className="flex items-center justify-between">
          <h1 className="font-serif text-3xl font-bold text-brand-900">Checkout</h1>
          <Link href="/cart" className="text-sm font-medium text-brand-600 hover:underline">
            ← Back to cart
          </Link>
        </div>

        {items.length === 0 ? (
          <div className="card mt-8 p-10 text-center">
            <div className="text-5xl">🛒</div>
            <h2 className="mt-4 font-serif text-xl font-bold text-stone-800">No items selected for checkout</h2>
            <p className="mt-2 text-stone-500">
              Please mark at least one item in your shopping cart before checking out.
            </p>
            <Link className="btn-primary mt-6 inline-flex" href="/cart">
              ← Return to Cart
            </Link>
          </div>
        ) : (
          <CheckoutClient
            items={items}
            profile={{ name: session.name, phone: profilePhone ?? '' }}
            addresses={addressRows}
          />
        )}
      </main>
      <Footer />
    </>
  );
}
