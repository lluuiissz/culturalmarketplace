import Link from 'next/link';
import type { Order, OrderItem } from '@/lib/types';
import PrintReceiptButton from '@/app/order/success/[orderId]/PrintReceiptButton';
import ExperienceMap from '@/app/customer/browse/[id]/ExperienceMap';

export interface OfficialReceiptTicketViewProps {
  order: Order;
  items: OrderItem[];
  customer: {
    name: string;
    email: string;
  };
  artisanMap?: Record<number, { name: string; business_name: string | null; phone: string | null; email: string | null }>;
  productMap?: Record<number, { tutorial_location?: string | null; tutorial_lat?: number | null; tutorial_lng?: number | null; image_path?: string | null }>;
  showCelebration?: boolean;
}

export default function OfficialReceiptTicketView({
  order,
  items,
  customer,
  artisanMap = {},
  productMap = {},
  showCelebration = false,
}: OfficialReceiptTicketViewProps) {
  const formattedDate = new Date(order.created_at).toLocaleString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });

  const receiptNumber = `CM-${new Date(order.created_at).getFullYear()}-${String(order.id).padStart(6, '0')}`;
  const workshopItems = items.filter((i) => i.purchase_type === 'workshop' || i.ticket_code);
  const hasWorkshop = workshopItems.length > 0;

  return (
    <div className="space-y-6">
      {/* 1. Header Navigation or Celebration Banner */}
      {showCelebration ? (
        <div className="card p-6 text-center print:hidden border-brand-200 bg-gradient-to-b from-brand-50 to-white shadow-sm">
          <div className="text-4xl">🎉</div>
          <h1 className="mt-2 font-serif text-2xl font-bold text-brand-900">
            {hasWorkshop ? 'Booking & Order Confirmed!' : 'Order Placed Successfully!'}
          </h1>
          <p className="mt-1 text-sm text-stone-600">
            Thank you, <b>{customer.name}</b>. Your order details and official printable receipt & tickets are ready below.
          </p>

          <div className="mt-4 flex flex-wrap justify-center gap-3">
            <PrintReceiptButton />
            <Link className="btn-primary text-sm px-4 py-2" href="/customer/account/orders">
              View My Orders →
            </Link>
            {hasWorkshop && (
              <Link className="btn-outline text-sm px-4 py-2 border-leaf-300 text-leaf-800 hover:bg-leaf-50" href="/customer/account/bookings">
                View My Bookings →
              </Link>
            )}
            <Link className="btn-outline text-sm px-4 py-2" href="/customer/browse">
              Keep Shopping
            </Link>
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap items-center justify-between gap-3 print:hidden border-b border-stone-200 pb-4">
          <div className="flex items-center gap-2 text-sm text-stone-600">
            <Link href="/customer/account/orders" className="hover:text-brand-700 font-semibold transition">
              ← My Orders
            </Link>
            <span className="text-stone-300">/</span>
            {hasWorkshop && (
              <>
                <Link href="/customer/account/bookings" className="hover:text-brand-700 font-semibold transition">
                  My Bookings
                </Link>
                <span className="text-stone-300">/</span>
              </>
            )}
            <span className="text-stone-800 font-bold">Receipt & Admission Ticket</span>
          </div>
          <PrintReceiptButton />
        </div>
      )}

      {/* 2. Official Customer Receipt */}
      <div className="card p-5 sm:p-8 print:shadow-none print:border-none print:m-0 print:p-2 bg-white border border-stone-300 shadow-md">
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
            <p className="text-xs text-stone-400">registry@culturalmarketplace.local</p>
          </div>

          <div className="text-right sm:text-right">
            <span className="inline-block rounded bg-brand-100 px-2.5 py-1 text-xs font-bold text-brand-800 uppercase tracking-wider print:border print:border-stone-300">
              Official Customer Receipt
            </span>
            <p className="mt-2 text-base font-mono font-bold text-stone-800">
              {receiptNumber}
            </p>
            <p className="text-xs text-stone-500">Date: {formattedDate}</p>
          </div>
        </div>

        {/* Customer & Billing / Delivery Info */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 py-5 border-b border-stone-200 text-sm">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-stone-400">
              Billed To:
            </h3>
            <p className="mt-1 font-semibold text-stone-800">{customer.name}</p>
            <p className="text-xs text-stone-500">{customer.email}</p>
            {order.shipping_address ? (
              <div className="mt-2 text-xs text-stone-600 whitespace-pre-line bg-stone-50 p-2.5 rounded-lg border border-stone-200">
                <p className="font-semibold text-stone-700">📦 Delivery Address:</p>
                {order.shipping_address}
              </div>
            ) : (
              <p className="text-xs text-stone-400 mt-1 italic">
                Digital Cultural Workshop Booking (No physical shipping required)
              </p>
            )}
          </div>

          <div className="sm:text-right">
            <h3 className="text-xs font-bold uppercase tracking-wider text-stone-400">
              Payment & Fulfillment:
            </h3>
            <p className="mt-1 font-semibold text-stone-800">
              {order.payment_method === 'gcash' ? '📱 GCash Digital Payment' : '💵 Cash on Delivery'}
            </p>
            <p className="text-xs text-stone-600 mt-0.5">
              Status: <span className="font-bold uppercase text-leaf-700">{order.status.replace(/_/g, ' ')}</span>
            </p>
            {order.payment_reference && (
              <p className="text-xs text-stone-500 mt-1 font-mono">
                Ref: {order.payment_reference}
              </p>
            )}
            {order.notes && (
              <p className="text-xs text-stone-500 mt-2 italic bg-stone-50 p-2 rounded border border-stone-100">
                Note to Artisan: &ldquo;{order.notes}&rdquo;
              </p>
            )}
          </div>
        </div>

        {/* Itemized Table */}
        <div className="py-5">
          <h3 className="text-xs font-bold uppercase tracking-wider text-stone-400 mb-3">
            Itemized Purchase Summary
          </h3>
          <div className="overflow-x-auto -mx-1 sm:mx-0">
            <table className="w-full min-w-[500px] sm:min-w-0 text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-stone-200 text-xs font-semibold text-stone-500 uppercase">
                  <th className="py-2.5">Item / Description</th>
                  <th className="py-2.5 text-center">Type</th>
                  <th className="py-2.5 text-center">Qty</th>
                  <th className="py-2.5 text-right">Price</th>
                  <th className="py-2.5 text-right">Total</th>
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
                          <p className="text-xs text-stone-500 mt-0.5">
                            🎨 Selected Variation: <span className="font-medium text-stone-700">{i.selected_variant}</span>
                          </p>
                        )}
                        {isWorkshop && (
                          <div className="mt-1 space-y-0.5 text-xs text-leaf-800 bg-leaf-50/70 p-2 rounded-lg border border-leaf-200/60">
                            {i.ticket_code && (
                              <p className="font-mono font-bold">🎟️ Admission Ticket: {i.ticket_code}</p>
                            )}
                            {i.selected_session && (
                              <p>
                                📅 Session: {i.selected_session.date} ({i.selected_session.time_start}–{i.selected_session.time_end})
                                {i.selected_session.location ? ` · 📍 ${i.selected_session.location}` : ''}
                              </p>
                            )}
                            {i.attendee_name && (
                              <div className="pt-0.5 flex items-center gap-1.5 flex-wrap">
                                <span className="text-stone-500">👤 Attendee(s):</span>
                                {i.attendee_name.includes(',') ? (
                                  <span className="inline-flex flex-wrap gap-1 align-middle">
                                    {i.attendee_name.split(',').map((name, idx) => (
                                      <span key={idx} className="rounded bg-stone-100 border border-stone-200 px-1.5 py-0.2 font-semibold text-stone-800 text-[11px]">
                                        {name.trim()}
                                      </span>
                                    ))}
                                  </span>
                                ) : (
                                  <span className="font-semibold text-stone-800">{i.attendee_name}</span>
                                )}
                                {i.attendee_for === 'others' && (
                                  <span className="rounded bg-leaf-200/70 px-1.5 py-0.5 text-[10px] font-bold text-leaf-900">
                                    Guest / Group
                                  </span>
                                )}
                              </div>
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
          <div className="w-72 space-y-2 text-sm">
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

        {/* Cultural Heritage Authenticity Seal */}
        <div className="mt-8 rounded-xl border border-amber-200 bg-amber-50/50 p-4 text-center text-xs text-amber-900 space-y-1">
          <div className="flex items-center justify-center gap-1.5 font-serif font-bold text-sm text-brand-900">
            <span>🛡️</span>
            <span>Cultural Heritage Authenticity Seal</span>
          </div>
          <p className="font-medium">
            ✔ Certified Authentic Agusan del Sur Handicraft & Indigenous Cultural Heritage
          </p>
          <p className="text-[11px] text-stone-500">
            Official receipt issued by the Cultural Marketplace Registry. Supporting indigenous artisans & preservation of cultural arts.
          </p>
        </div>
      </div>

      {/* 3. Official Admission Ticket Pass (If Order contains Workshop / Experience) */}
      {hasWorkshop && (
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-stone-200 pb-2">
            <div>
              <h2 className="font-serif text-xl font-bold text-brand-900 flex items-center gap-2">
                <span>🎟️</span>
                <span>Official Workshop Admission Tickets</span>
              </h2>
              <p className="text-xs text-stone-500">
                Present your admission ticket code upon arrival at the artisan studio venue.
              </p>
            </div>
            <span className="badge bg-leaf-100 text-leaf-800 text-xs font-semibold">
              {workshopItems.length} {workshopItems.length === 1 ? 'Pass' : 'Passes'}
            </span>
          </div>

          {workshopItems.map((item, idx) => {
            const artisan = artisanMap[item.artisan_id];
            const product = productMap[item.product_id];
            const venue = item.selected_session?.location || product?.tutorial_location || 'Cultural Workshop Studio, Agusan del Sur';

            return (
              <div
                key={item.id || idx}
                id={`ticket-${item.id}`}
                className="card overflow-hidden border-2 border-leaf-500/80 bg-white shadow-md print:shadow-none print:border-stone-400"
              >
                {/* Ticket Top Ribbon */}
                <div className="flex flex-wrap items-center justify-between gap-3 bg-gradient-to-r from-leaf-800 to-brand-900 px-6 py-3.5 text-white">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">🌿</span>
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-wider text-leaf-200">
                        Cultural Heritage Masterclass Admission Pass
                      </p>
                      <p className="font-serif text-base font-bold text-white">
                        {item.product_name}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="rounded-md bg-white/20 px-3 py-1 font-mono text-sm font-bold text-white border border-white/30">
                      🎟️ {item.ticket_code || `TKT-${order.id}-${item.id}`}
                    </span>
                  </div>
                </div>

                {/* Ticket Pass Core Body */}
                <div className="p-6 space-y-5">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    {/* Session Schedule */}
                    <div className="rounded-xl bg-stone-50 p-3.5 border border-stone-200">
                      <p className="text-[11px] font-bold uppercase tracking-wide text-stone-500">
                        📅 Scheduled Date & Time
                      </p>
                      <p className="mt-1 font-serif text-base font-bold text-stone-800">
                        {item.selected_session?.date || 'Confirmed Reservation'}
                      </p>
                      {item.selected_session?.time_start && (
                        <p className="text-xs font-medium text-stone-600 mt-0.5">
                          ⏰ {item.selected_session.time_start} – {item.selected_session.time_end}
                        </p>
                      )}
                    </div>

                    {/* Venue Studio */}
                    <div className="rounded-xl bg-stone-50 p-3.5 border border-stone-200">
                      <p className="text-[11px] font-bold uppercase tracking-wide text-stone-500">
                        📍 Studio Venue Location
                      </p>
                      <p className="mt-1 font-semibold text-stone-800 text-sm line-clamp-2">
                        {venue}
                      </p>
                      <p className="text-[11px] text-stone-500 mt-0.5">Agusan del Sur, Philippines</p>
                    </div>

                    {/* Master Artisan Instructor */}
                    <div className="rounded-xl bg-stone-50 p-3.5 border border-stone-200">
                      <p className="text-[11px] font-bold uppercase tracking-wide text-stone-500">
                        🧑‍🎨 Master Artisan Instructor
                      </p>
                      <p className="mt-1 font-semibold text-stone-800 text-sm">
                        {artisan?.name ?? 'Master Artisan'}
                      </p>
                      {artisan?.business_name && (
                        <p className="text-xs text-brand-700">{artisan.business_name}</p>
                      )}
                      {artisan?.phone && (
                        <p className="text-[11px] text-stone-500 mt-0.5">📞 {artisan.phone}</p>
                      )}
                    </div>
                  </div>

                  {/* Registered Attendees & Passes */}
                  <div className="flex flex-wrap items-center justify-between gap-4 border-t border-b border-stone-200 py-3 text-sm">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <p className="text-xs text-stone-500 uppercase tracking-wider font-semibold">
                          Registered Attendee(s)
                        </p>
                        {item.attendee_for === 'others' && (
                          <span className="rounded bg-leaf-100 text-leaf-800 px-1.5 py-0.5 text-[10px] font-bold border border-leaf-200">
                            Booked for Others / Group
                          </span>
                        )}
                      </div>
                      {item.attendee_name && item.attendee_name.includes(',') ? (
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {item.attendee_name.split(',').map((name, i) => (
                            <span key={i} className="inline-flex items-center gap-1 rounded-md bg-stone-100 px-2 py-0.5 text-xs font-bold text-stone-800 border border-stone-200">
                              <span>👤</span> {name.trim()}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="font-bold text-stone-900 text-base flex items-center gap-2">
                          <span>👤</span>
                          <span>{item.attendee_name || customer.name}</span>
                          {item.selected_variant && (
                            <span className="text-xs font-normal text-stone-500">
                              (Variant: {item.selected_variant})
                            </span>
                          )}
                        </p>
                      )}
                      <p className="text-xs text-stone-500">
                        Booking Contact / Buyer: {customer.name} ({customer.email})
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="text-xs text-stone-500 uppercase tracking-wider font-semibold">
                        Total Passes
                      </p>
                      <p className="font-mono text-lg font-bold text-brand-900">
                        {item.quantity} seat{item.quantity > 1 ? 's' : ''}
                      </p>
                      <p className="text-xs text-leaf-700 font-semibold">✔ Admission Confirmed</p>
                    </div>
                  </div>

                  {/* Live Venue Map Pathfinding (Screen only) */}
                  <div className="print:hidden space-y-2 pt-1">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold text-stone-700 uppercase tracking-wide flex items-center gap-1.5">
                        <span>🧭</span> Live Studio Pathfinding & GPS Navigation
                      </p>
                      <span className="text-[11px] text-stone-400">Agusan del Sur Interactive Map</span>
                    </div>

                    <ExperienceMap
                      lat={product?.tutorial_lat ?? 8.5085}
                      lng={product?.tutorial_lng ?? 125.9789}
                      locationName={venue}
                      artisanPhone={artisan?.phone ?? undefined}
                    />
                  </div>
                </div>

                {/* Ticket Footer Tear-Off Bar */}
                <div className="border-t border-dashed border-stone-300 bg-stone-50 px-6 py-2.5 flex flex-wrap items-center justify-between text-[11px] text-stone-500">
                  <span>Present digital pass or printed copy upon arrival.</span>
                  <span className="font-mono font-semibold text-stone-700">AUTH-CODE: {item.ticket_code}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
