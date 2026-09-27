import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { getSession } from '@/lib/auth';
import { getOrder, getOrderItems } from '@/lib/db';

export const dynamic = 'force-dynamic';

export default async function OrderSuccessPage({ params }: { params: Promise<{ orderId: string }> }) {
  const session = await getSession();
  if (!session) redirect('/auth/login');
  const { orderId } = await params;
  const order = await getOrder(Number(orderId));
  if (!order) notFound();
  if (session.role !== 'admin' && order.customer_id !== session.id) notFound();

  const items = await getOrderItems(order.id);

  return (
    <>
      <Header />
      <main className="mx-auto max-w-2xl px-4 py-12">
        <div className="card p-8 text-center">
          <div className="text-5xl">🎉</div>
          <h1 className="mt-3 font-serif text-3xl font-bold text-leaf-700">Order placed!</h1>
          <p className="mt-2 text-stone-600">
            Order #{order.id} · {order.payment_method === 'gcash' ? 'GCash' : 'Cash on Delivery'} ·{' '}
            <span className="font-semibold capitalize">{order.status.replace(/_/g, ' ')}</span>
          </p>
          {order.status === 'awaiting_payment' && (
            <p className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
              Your GCash payment is being verified. You&apos;ll get a notification once confirmed.
            </p>
          )}
        </div>

        <div className="card mt-6 divide-y divide-stone-100">
          {items.map((i) => (
            <div key={i.id} className="flex items-center justify-between gap-3 p-4">
              <div>
                <p className="font-semibold text-stone-800">{i.product_name}</p>
                <p className="text-sm text-stone-500">
                  × {i.quantity} · ₱{Number(i.price).toFixed(2)}
                  {i.selected_variant ? ` · ${i.selected_variant}` : ''}
                </p>
                {i.ticket_code && (
                  <p className="mt-1 text-sm text-brand-700">🎟 Ticket: <b>{i.ticket_code}</b></p>
                )}
              </div>
              <span className="badge bg-stone-100 capitalize text-stone-600">{i.status.replace(/_/g, ' ')}</span>
            </div>
          ))}
        </div>

        <div className="mt-6 flex justify-center gap-3">
          <Link className="btn-primary" href="/customer/account/orders">My orders</Link>
          <Link className="btn-outline" href="/customer/browse">Keep shopping</Link>
        </div>
      </main>
      <Footer />
    </>
  );
}
