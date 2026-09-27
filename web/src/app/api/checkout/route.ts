import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getCart, createOrder, clearCart, pushNotification, logActivity } from '@/lib/db';

export async function POST(req: Request) {
  const session = await getSession();
  if (!session || session.role !== 'customer') {
    return NextResponse.json({ status: 'error', message: 'Please sign in as a customer.' }, { status: 401 });
  }
  try {
    const body = (await req.json()) as { address?: string; notes?: string; payment_method?: string; phone?: string };
    const address = (body.address ?? '').trim();
    if (!address) return NextResponse.json({ status: 'error', message: 'Shipping address is required.' }, { status: 400 });
    // Server-side customer-info gate (mirrors the client-side validation)
    const phone = (body.phone ?? '').trim();
    if (!/^(09\d{9}|\+639\d{9})$/.test(phone)) {
      return NextResponse.json({ status: 'error', message: 'A valid Philippine mobile number (09xxxxxxxxx) is required for delivery.' }, { status: 400 });
    }

    const cart = await getCart(session.id);
    const items = cart.filter((i) => i.product);
    if (!items.length) return NextResponse.json({ status: 'error', message: 'Your cart is empty.' }, { status: 400 });

    // Stock validation BEFORE creating the order — products and, when a
    // variant is chosen, the specific variation's stock (prevents overbooking).
    for (const i of items) {
      if (i.purchase_type === 'workshop') continue;
      const p = i.product!;
      if (i.selected_variant) {
        const entry = (p.variations_data ?? []).find((v) => `${v.typeLabel}: ${v.name}` === i.selected_variant);
        if (entry && entry.stock < i.quantity) {
          return NextResponse.json({ status: 'error', message: `Only ${entry.stock} left of ${p.name} (${i.selected_variant}). Please adjust your cart.` }, { status: 409 });
        }
      } else if (p.stock_quantity < i.quantity) {
        return NextResponse.json({ status: 'error', message: `Only ${p.stock_quantity} left of ${p.name}. Please adjust your cart.` }, { status: 409 });
      }
    }

    const method = body.payment_method === 'gcash' ? 'gcash' : 'cash_on_delivery';
    // Legacy rule: tutorial bookings force GCash
    if (items.some((i) => i.purchase_type !== 'product') && method !== 'gcash') {
      return NextResponse.json({ status: 'error', message: 'Tutorial bookings must be paid via GCash.' }, { status: 400 });
    }

    const total = items.reduce(
      (s, i) => s + (i.purchase_type === 'workshop' ? Number(i.product!.tutorial_price ?? i.product!.price) : Number(i.product!.price)) * i.quantity,
      0,
    );
    const status = method === 'gcash' ? 'awaiting_payment' : 'pending';

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
        price: i.purchase_type === 'workshop' ? Number(i.product!.tutorial_price ?? i.product!.price) : Number(i.product!.price),
        selectedVariant: i.selected_variant,
        selectedSession: i.selected_session ?? null,
        attendeeName: i.attendee_name ?? null,
      })),
    });

    // Notify each artisan with items in this order (COD only until GCash verified by admin)
    const artisanIds = [...new Set(items.map((i) => i.product!.artisan_id))];
    for (const aid of artisanIds) {
      if (method !== 'gcash') {
        await pushNotification({
          userId: aid, role: 'artisan', type: 'new_order',
          message: `New order #${orderId} from ${session.name}! Items: ${items.map((i) => i.product!.name).join(', ')}. Payment: Cash on Delivery.`,
          data: { order_id: orderId, customer_name: session.name },
        });
      }
    }

    await clearCart(session.id);
    await logActivity({ userId: session.id, role: 'customer', userName: session.name, action: 'order_placed', description: `Order #${orderId} placed (${method})` });

    return NextResponse.json({
      status: 'success',
      redirect: method === 'gcash' ? `/payment/gcash/${orderId}` : `/order/success/${orderId}`,
    });
  } catch {
    return NextResponse.json({ status: 'error', message: 'Could not place the order. Please try again.' }, { status: 500 });
  }
}
