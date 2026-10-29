import { notFound, redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { getOrder } from '@/lib/db';
import GcashClient from './GcashClient';

export const dynamic = 'force-dynamic';

export default async function GcashPaymentPage({ params }: { params: Promise<{ orderId: string }> }) {
  const session = await getSession();
  if (!session || session.role !== 'customer') redirect('/auth/login?next=/cart');
  const { orderId } = await params;
  const order = await getOrder(Number(orderId));
  if (!order || order.customer_id !== session.id) notFound();

  return (
    <main className="flex min-h-screen items-center justify-center bg-canvas px-4 py-8">
      <div className="w-full max-w-md rounded-2xl border border-abaca-300 bg-white p-6 sm:p-8 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-charcoal-900 border border-ochre-500/50 text-xl font-bold text-ochre-400 shadow-xs">G</div>
          <div>
            <p className="font-bold text-charcoal-900 font-sculpted">GCash Payment</p>
            <p className="text-xs text-stone-500">Secure simulated patron checkout</p>
          </div>
        </div>
        <div className="mt-6 rounded-xl bg-canvas p-4 border border-abaca-200">
          <p className="text-xs font-semibold text-stone-500 uppercase tracking-wider">Amount to pay</p>
          <p className="mt-1 text-3xl sm:text-4xl font-bold text-crimson-600 font-sculpted">₱{Number(order.total_amount).toFixed(2)}</p>
          <p className="mt-1 text-xs text-stone-500">Order #{order.id}</p>
        </div>
        <GcashClient orderId={order.id} total={Number(order.total_amount)} />
      </div>
    </main>
  );
}
