import { redirect } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { getSession } from '@/lib/auth';
import { getCart, getUserPhone } from '@/lib/db';
import { listAddresses } from '@/lib/adminDb';
import CheckoutClient from './CheckoutClient';

export const dynamic = 'force-dynamic';

export default async function CheckoutPage() {
  const session = await getSession();
  if (!session) redirect('/auth/login?next=/checkout');
  if (session.role !== 'customer') redirect('/');

  const [cart, addresses, profilePhone] = await Promise.all([
    getCart(session.id),
    listAddresses(session.id),
    getUserPhone(session.id),
  ]);
  const items = cart
    .filter((i) => i.product)
    .map((i) => ({
      cart_item_id: i.id,
      name: i.product!.name,
      price: i.purchase_type === 'workshop' ? Number(i.product!.tutorial_price ?? i.product!.price) : Number(i.product!.price),
      quantity: i.quantity,
      variant: i.selected_variant,
      purchase_type: i.purchase_type,
      product_id: i.product_id,
      artisan_id: i.product!.artisan_id,
    }));

  const addressRows = addresses.map((a) => ({
    id: a.id, label: a.label, full_name: a.full_name, phone: a.phone,
    address: a.address, landmark: a.landmark, is_default: a.is_default,
  }));

  return (
    <>
      <Header />
      <main className="mx-auto max-w-4xl px-4 py-10">
        <h1 className="font-serif text-3xl font-bold text-brand-900">Checkout</h1>
        <CheckoutClient
      items={items}
      profile={{ name: session.name, phone: profilePhone ?? '' }}
      addresses={addressRows}
    />
      </main>
      <Footer />
    </>
  );
}
