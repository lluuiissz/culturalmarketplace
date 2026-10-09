import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { getSession } from '@/lib/auth';
import { getOrder, getOrderItems, getProduct, getArtisan } from '@/lib/db';
import PrintReceiptButton from './PrintReceiptButton';
import ExperienceMap from '@/app/customer/browse/[id]/ExperienceMap';

export const dynamic = 'force-dynamic';

export default async function OrderSuccessPage({ params }: { params: Promise<{ orderId: string }> }) {
  const session = await getSession();
  if (!session) redirect('/auth/login');
  const { orderId } = await params;
  const order = await getOrder(Number(orderId));
  if (!order) notFound();
  if (session.role !== 'admin' && order.customer_id !== session.id) notFound();

  const items = await getOrderItems(order.id);
  const formattedDate = new Date(order.created_at).toLocaleString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });

  const hasWorkshop = items.some((i) => i.purchase_type === 'workshop' || i.ticket_code);
  const workshopItem = items.find((i) => i.purchase_type === 'workshop' || i.ticket_code);
  const [workshopProduct, workshopArtisan] = workshopItem
    ? await Promise.all([getProduct(workshopItem.product_id), getArtisan(workshopItem.artisan_id)])
    : [null, null];
  const receiptNumber = `CM-${new Date(order.created_at).getFullYear()}-${String(order.id).padStart(6, '0')}`;

  return (
    <>
      <div className="print:hidden">
        <Header />
      </div>

      <main className="mx-auto max-w-3xl px-4 py-10 print:p-0 print:max-w-none">
        {/* Screen-only Celebration Notice */}
        <div className="card p-6 text-center print:hidden border-brand-200 bg-gradient-to-b from-brand-50 to-white shadow-sm">
          <div className="text-4xl">🎉</div>
          <h1 className="mt-2 font-serif text-2xl font-bold text-brand-900">
            {hasWorkshop ? 'Booking & Order Confirmed!' : 'Order Placed Successfully!'}
          </h1>
          <p className="mt-1 text-sm text-stone-600">
            Thank you, <b>{session.name}</b>. Your order details and official printable receipt are ready below.
          </p>

          <div className="mt-4 flex flex-wrap justify-center gap-3">
            <PrintReceiptButton />
            <Link className="btn-primary text-sm px-4 py-2" href="/customer/account/orders">
              View My Orders →
            </Link>
            <Link className="btn-outline text-sm px-4 py-2" href="/customer/browse">
              Keep Shopping
            </Link>
          </div>
        </div>

        {/* Printable Official Receipt / Booking Document */}
        <div className="card mt-6 p-4 sm:p-8 print:shadow-none print:border-none print:m-0 print:p-4 bg-white border border-stone-300 shadow-md">
          {/* Receipt Header */}
          <div className="flex flex-wrap items-start justify-between border-b-2 border-brand-900/20 pb-5 gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-2xl print:text-xl">🧶</span>
                <span className="font-serif text-2xl font-bold text-brand-900 print:text-xl">
                  Cultural Marketplace
                </span>
              </div>
              <p className="mt-1 text-xs text-stone-500">
                Preserving Cultural Heritage · Agusan del Sur, Philippines
              </p>
              <p className="text-xs text-stone-400">support@culturalmarketplace.local</p>
            </div>

            <div className="text-right sm:text-right">
              <span className="inline-block rounded bg-brand-100 px-2.5 py-1 text-xs font-bold text-brand-800 uppercase tracking-wider print:border print:border-stone-300">
                Official Customer Receipt
              </span>
              <p className="mt-2 text-sm font-mono font-bold text-stone-800">
                {receiptNumber}
              </p>
              <p className="text-xs text-stone-500">Date: {formattedDate}</p>
            </div>
          </div>

          {/* Customer & Delivery / Venue Snapshot */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 py-5 border-b border-stone-200 text-sm">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-stone-400">
                Billed & Delivered To:
              </h3>
              <p className="mt-1 font-semibold text-stone-800">{session.name}</p>
              <p className="text-xs text-stone-500">{session.email}</p>
              {order.shipping_address ? (
                <div className="mt-2 text-xs text-stone-600 whitespace-pre-line bg-stone-50 p-2.5 rounded border border-stone-200">
                  <p className="font-medium text-stone-700">📦 Delivery Address:</p>
                  {order.shipping_address}
                </div>
              ) : (
                <p className="text-xs text-stone-400 mt-1 italic">No physical shipping address required (Digital Workshop Booking).</p>
              )}
            </div>

            <div className="sm:text-right">
              <h3 className="text-xs font-bold uppercase tracking-wider text-stone-400">
                Payment Details:
              </h3>
              <p className="mt-1 font-semibold text-stone-800">
                {order.payment_method === 'gcash' ? '📱 GCash Payment' : '💵 Cash on Delivery'}
              </p>
              <p className="text-xs text-stone-600">
                Status: <span className="font-bold capitalize text-leaf-700">{order.status.replace(/_/g, ' ')}</span>
              </p>
              {order.payment_reference && (
                <p className="text-xs text-stone-500 mt-1 font-mono">
                  Ref: {order.payment_reference}
                </p>
              )}
              {order.notes && (
                <p className="text-xs text-stone-500 mt-2 italic">
                  Note to Artisan: &ldquo;{order.notes}&rdquo;
                </p>
              )}
            </div>
          </div>

          {/* Itemized Order & Workshop Breakdown */}
          <div className="py-5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-stone-400 mb-3">
              Order Items & Bookings Summary
            </h3>
            <div className="overflow-x-auto -mx-1 sm:mx-0">
              <table className="w-full min-w-[480px] sm:min-w-0 text-left text-sm border-collapse">
                <thead>
                  <tr className="border-b border-stone-200 text-xs font-semibold text-stone-500 uppercase">
                    <th className="py-2">Item / Description</th>
                    <th className="py-2 text-center">Type</th>
                    <th className="py-2 text-center">Qty</th>
                    <th className="py-2 text-right">Price</th>
                    <th className="py-2 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {items.map((i) => {
                    const itemTotal = Number(i.price) * i.quantity;
                    const isWorkshop = i.purchase_type === 'workshop';
                    return (
                      <tr key={i.id} className="align-top">
                        <td className="py-3">
                          <p className="font-semibold text-stone-800">{i.product_name}</p>
                          {i.selected_variant && (
                            <p className="text-xs text-stone-500">Variant: {i.selected_variant}</p>
                          )}
                          {isWorkshop && (
                            <div className="mt-1 space-y-0.5 text-xs text-leaf-800 bg-leaf-500/10 p-2 rounded border border-leaf-500/20">
                              {i.ticket_code && (
                                <p className="font-mono font-bold">🎟️ Ticket Code: {i.ticket_code}</p>
                              )}
                              {i.selected_session && (
                                <p>
                                  📅 Session: {i.selected_session.date} ({i.selected_session.time_start}–{i.selected_session.time_end})
                                  {i.selected_session.location ? ` · 📍 ${i.selected_session.location}` : ''}
                                </p>
                              )}
                              {i.attendee_name && (
                                <p>👤 Attendee: {i.attendee_name}</p>
                              )}
                            </div>
                          )}
                        </td>
                        <td className="py-3 text-center text-xs text-stone-600">
                          {isWorkshop ? (
                            <span className="badge bg-leaf-100 text-leaf-800">Workshop</span>
                          ) : (
                            <span className="badge bg-stone-100 text-stone-700">Craft</span>
                          )}
                        </td>
                        <td className="py-3 text-center text-stone-700">{i.quantity}</td>
                        <td className="py-3 text-right text-stone-700 font-mono">
                          ₱{Number(i.price).toFixed(2)}
                        </td>
                        <td className="py-3 text-right font-bold text-stone-900 font-mono">
                          ₱{itemTotal.toFixed(2)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Totals Section */}
          <div className="border-t-2 border-stone-200 pt-4 flex justify-end">
            <div className="w-64 space-y-2 text-sm">
              <div className="flex justify-between text-stone-600">
                <span>Subtotal:</span>
                <span className="font-mono">₱{Number(order.total_amount).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-stone-600">
                <span>Shipping / Booking Fee:</span>
                <span className="text-leaf-700 font-medium">Included / Free</span>
              </div>
              <div className="border-t border-stone-200 pt-2 flex justify-between text-base font-bold text-brand-900">
                <span>Grand Total:</span>
                <span className="font-mono text-xl">₱{Number(order.total_amount).toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Authenticity Certificate & Terms Notice */}
          <div className="mt-8 border-t border-stone-100 pt-4 text-center text-[11px] text-stone-400 space-y-1">
            <p className="font-semibold text-stone-600">
              ✔ Verified Authentic Agusan del Sur Handicraft & Indigenous Cultural Heritage
            </p>
            <p>
              Please present this receipt or ticket code upon courier parcel delivery or workshop entry.
            </p>
            <p>Thank you for supporting indigenous Filipino artisans!</p>
          </div>
        </div>

        {/* Customer Interactive Venue Pathfinding & GPS Navigation Guide */}
        {hasWorkshop && (
          <div id="venue-guide" className="card mt-6 p-6 border-2 border-leaf-600/30 bg-white print:hidden shadow-sm space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🧭</span>
              <div>
                <h2 className="font-serif text-lg font-bold text-brand-900">
                  Workshop Venue & Live Pathfinding Guide
                </h2>
                <p className="text-xs text-stone-500">
                  Not familiar with the venue? Use the map below to locate your position, trace your travel path, and launch turn-by-turn voice navigation.
                </p>
              </div>
            </div>

            <ExperienceMap
              lat={workshopProduct?.tutorial_lat ?? 8.5085}
              lng={workshopProduct?.tutorial_lng ?? 125.9789}
              locationName={workshopItem?.selected_session?.location || workshopProduct?.tutorial_location || 'Cultural Workshop Studio'}
              artisanPhone={workshopArtisan?.phone}
            />
          </div>
        )}
      </main>

      <div className="print:hidden">
        <Footer />
      </div>
    </>
  );
}
