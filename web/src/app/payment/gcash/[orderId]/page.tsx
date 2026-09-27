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
    <main className="flex min-h-screen items-center justify-center bg-sky-50 px-4">
      <div className="w-full max-w-md rounded-2xl border border-sky-100 bg-white p-8 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-600 text-xl font-bold text-white">G</div>
          <div>
            <p className="font-bold text-sky-800">GCash</p>
            <p className="text-xs text-stone-500">Simulated payment · PAYMENTS_MODE=mock</p>
          </div>
        </div>
        <div className="mt-6">
          <p className="text-sm text-stone-500">Amount to pay</p>
          <p className="text-4xl font-bold text-sky-800">₱{Number(order.total_amount).toFixed(2)}</p>
          <p className="mt-1 text-sm text-stone-500">Order #{order.id}</p>
        </div>
        <GcashClient orderId={order.id} total={Number(order.total_amount)} />
      </div>
    </main>
  );
}
