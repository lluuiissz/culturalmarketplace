import Link from 'next/link';
import { redirect } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { getSession } from '@/lib/auth';
import { getCart } from '@/lib/db';
import CartClient from './CartClient';

export const dynamic = 'force-dynamic';

export default async function CartPage() {
  const session = await getSession();
  if (!session) redirect('/auth/login?next=/cart');
  if (session.role !== 'customer') {
    return (
      <>
        <Header />
        <main className="mx-auto max-w-2xl px-4 py-20 text-center">
          <p className="text-stone-600">Only customer accounts have a cart.</p>
          <Link className="btn-primary mt-4" href="/">Back to marketplace</Link>
        </main>
        <Footer />
      </>
    );
  }
  const cart = await getCart(session.id);
  return (
    <>
      <Header />
      <main className="mx-auto max-w-4xl px-4 py-10">
        <h1 className="font-serif text-3xl font-bold text-brand-900">Your cart</h1>
        <CartClient
          initialItems={cart.map((i) => ({
            id: i.id,
            product_id: i.product_id,
            quantity: i.quantity,
            name: i.product?.name ?? 'Unknown product',
            price: Number(i.product?.price ?? 0),
            variant: i.selected_variant,
            purchase_type: i.purchase_type,
            session: i.selected_session,
          }))}
        />
      </main>
      <Footer />
    </>
  );
}
