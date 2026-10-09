import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import {
  getCart,
  createOrder,
  clearCart,
  pushNotification,
  logActivity,
  approvedArtisanIds,
  getBookedSeatsCount,
} from '@/lib/db';

export async function POST(req: Request) {
  const session = await getSession();
  if (!session || session.role !== 'customer') {
    return NextResponse.json({ status: 'error', message: 'Please sign in as a customer.' }, { status: 401 });
  }
  try {
    const body = (await req.json()) as {
      address?: string;
      notes?: string;
      payment_method?: string;
      phone?: string;
      cart_item_ids?: number[];
    };
    const address = (body.address ?? '').trim();
    if (!address) return NextResponse.json({ status: 'error', message: 'Shipping address is required.' }, { status: 400 });
    // Server-side customer-info gate (mirrors the client-side validation)
    const phone = (body.phone ?? '').trim();
    if (!/^(09\d{9}|\+639\d{9})$/.test(phone)) {
      return NextResponse.json({ status: 'error', message: 'A valid Philippine mobile number (09xxxxxxxxx) is required for delivery.' }, { status: 400 });
    }

    const requestedIds = Array.isArray(body.cart_item_ids) && body.cart_item_ids.length
      ? new Set(body.cart_item_ids.map(Number))
      : null;

    const cart = await getCart(session.id);
    const items = cart.filter((i) => i.product && (!requestedIds || requestedIds.has(i.id)));
    if (!items.length) return NextResponse.json({ status: 'error', message: 'No items selected or your cart is empty.' }, { status: 400 });

    // Visibility + verification re-validation (fix #7): a stale cart must not
    // be able to order a product that has since been deactivated, hidden by
    // moderation, or whose artisan is no longer approved.
    const approved = await approvedArtisanIds([...new Set(items.map((i) => i.product!.artisan_id))]);
    for (const i of items) {
      const p = i.product!;
      if (p.status !== 'active') {
        return NextResponse.json({ status: 'error', message: `${p.name} is no longer available. Please remove it from your cart.` }, { status: 409 });
      }
      if (!approved.has(p.artisan_id)) {
        return NextResponse.json({ status: 'error', message: `${p.name} can no longer be purchased — the seller's account is under review. Please remove it from your cart.` }, { status: 409 });
      }
    }

    // Capacity & Stock validation BEFORE creating the order
    for (const i of items) {
      const p = i.product!;
      if (i.purchase_type === 'workshop') {
        if (p.tutorial_capacity !== null && p.tutorial_capacity > 0) {
          const booked = await getBookedSeatsCount(p.id);
          const available = p.tutorial_capacity - booked;
          if (available < i.quantity) {
            return NextResponse.json(
              {
                status: 'error',
                message:
                  available <= 0
                    ? `Workshop “${p.name}” is sold out. Please remove it from your cart.`
                    : `Only ${available} seat(s) remaining for workshop “${p.name}”. Please adjust your quantity.`,
              },
              { status: 409 }
            );
          }
        }
        continue;
      }

      if (i.selected_variant) {
        const entry = (p.variations_data ?? []).find((v) => `${v.typeLabel}: ${v.name}` === i.selected_variant);
        if (entry && entry.stock < i.quantity) {
          return NextResponse.json({ status: 'error', message: `Only ${entry.stock} left of ${p.name} (${i.selected_variant}). Please adjust your cart.` }, { status: 409 });
        }
      } else if (p.stock_quantity < i.quantity) {
        return NextResponse.json({ status: 'error', message: `Only ${p.stock_quantity} left of ${p.name}. Please adjust your cart.` }, { status: 409 });
      }
    }

    function getUnitPrice(item: (typeof items)[0]) {
      const p = item.product!;
      if (item.purchase_type === 'workshop') {
        if (p.tutorial_fee_type === 'free') return 0;
        return Number(p.tutorial_price ?? p.price);
      }
      let price = Number(p.price);
      if (item.selected_variant && p.variations_data) {
        const v = p.variations_data.find((x) => `${x.typeLabel}: ${x.name}` === item.selected_variant);
        if (v && v.price > 0) price += Number(v.price);
      }
      return price;
    }

    const total = items.reduce((s, i) => s + getUnitPrice(i) * i.quantity, 0);
    const isFreeOrder = total === 0;

    let method = body.payment_method === 'gcash' ? 'gcash' : 'cash_on_delivery';
    if (isFreeOrder) {
      method = 'free';
    } else if (items.some((i) => i.purchase_type !== 'product') && method !== 'gcash') {
      return NextResponse.json({ status: 'error', message: 'Paid workshop bookings must be paid via GCash.' }, { status: 400 });
    }

    const status = isFreeOrder ? 'pending' : (method === 'gcash' ? 'awaiting_payment' : 'pending');

    const orderId = await createOrder({
      customerId: session.id,
      total,
      paymentMethod: method,
      status,
      shippingAddress: address,
      notes: body.notes,
      items: items.map((i) => ({
        productId: i.product_id,
        artisanId: i.product!.artisan_id,
        productName: i.product!.name,
        purchaseType: i.purchase_type,
        quantity: i.quantity,
        price: getUnitPrice(i),
        selectedVariant: i.selected_variant,
        selectedSession: i.selected_session ?? null,
        attendeeName: i.attendee_name || (i.purchase_type === 'workshop' ? session.name : null),
      })),
    });

    // Notify each artisan with items in this order
    const artisanIds = [...new Set(items.map((i) => i.product!.artisan_id))];
    for (const aid of artisanIds) {
      if (isFreeOrder) {
        await pushNotification({
          userId: aid, role: 'artisan', type: 'new_order',
          message: `New free workshop registration #${orderId} from ${session.name}! Session attendee: ${session.name}.`,
          data: { order_id: orderId, customer_name: session.name },
        });
      } else if (method !== 'gcash') {
        await pushNotification({
          userId: aid, role: 'artisan', type: 'new_order',
          message: `New order #${orderId} from ${session.name}! Items: ${items.map((i) => i.product!.name).join(', ')}. Payment: Cash on Delivery.`,
          data: { order_id: orderId, customer_name: session.name },
        });
      }
    }

    await clearCart(session.id, items.map((i) => i.id));
    await logActivity({ userId: session.id, role: 'customer', userName: session.name, action: 'order_placed', description: `Order #${orderId} placed (${method})` });

    return NextResponse.json({
      status: 'success',
      redirect: isFreeOrder || method !== 'gcash' ? `/order/success/${orderId}` : `/payment/gcash/${orderId}`,
    });
  } catch {
    return NextResponse.json({ status: 'error', message: 'Could not place the order. Please try again.' }, { status: 500 });
  }
}
