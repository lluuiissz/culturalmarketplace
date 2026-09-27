import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { createShipment } from '@/lib/shipments';
import { listArtisanOrders, getUserPhone, pushNotification, logActivity } from '@/lib/db';

// J&T-style booking: artisan books a parcel for one of their order items.
// Steps are validated server-side; recipient data comes from the order, never
// from artisan input (the artisan cannot edit the customer's address).
const PHONE_RE = /^(09\d{9}|\+639\d{9})$/;

export async function POST(req: Request) {
  const session = await getSession();
  if (!session || session.role !== 'artisan') {
    return NextResponse.json({ status: 'error', message: 'Unauthorized' }, { status: 401 });
  }
  try {
    const body = (await req.json()) as {
      orderItemId?: number;
      sender_name?: string; sender_phone?: string; sender_address?: string;
      weight_kg?: number; length_cm?: number; width_cm?: number; height_cm?: number;
      notes?: string;
    };

    const orderItemId = Number(body.orderItemId);
    if (!Number.isFinite(orderItemId)) {
      return NextResponse.json({ status: 'error', message: 'orderItemId is required.' }, { status: 400 });
    }

    // Ownership + shippability checks
    const mine = (await listArtisanOrders(session.id)).find((i) => i.id === orderItemId);
    if (!mine || !mine.order) {
      return NextResponse.json({ status: 'error', message: 'Order item not found.' }, { status: 404 });
    }
    if (mine.purchase_type === 'workshop') {
      return NextResponse.json({ status: 'error', message: 'Workshop bookings are not shippable.' }, { status: 400 });
    }
    if (!['paid', 'pending', 'preparing', 'ready_to_ship'].includes(mine.status)) {
      return NextResponse.json({ status: 'error', message: `This item is already ${mine.status.replace(/_/g, ' ')} and cannot be shipped.` }, { status: 409 });
    }
    if (mine.order.status === 'cancelled') {
      return NextResponse.json({ status: 'error', message: 'The order was cancelled.' }, { status: 409 });
    }

    // Step 1 validation (sender)
    const senderName = (body.sender_name ?? '').trim();
    const senderPhone = (body.sender_phone ?? '').trim();
    const senderAddress = (body.sender_address ?? '').trim();
    if (!senderName || !senderAddress) {
      return NextResponse.json({ status: 'error', message: 'Sender name and pickup address are required.' }, { status: 400 });
    }
    if (!PHONE_RE.test(senderPhone)) {
      return NextResponse.json({ status: 'error', message: 'Sender phone must be a PH mobile number (09xxxxxxxxx).' }, { status: 400 });
    }

    // Step 2: recipient from the order (customer-controlled data)
    const addressLines = (mine.order.shipping_address ?? '').split('\n').map((l) => l.trim()).filter(Boolean);
    const recipientName = addressLines[0] || mine.customer_name || 'Customer';
    // Recipient phone: prefer the phone captured at checkout (address line 2),
    // falling back to the customer's account phone.
    const checkoutPhone = addressLines.find((l) => /^(09\d{9}|\+639\d{9})$/.test(l.replace(/[\s-]/g, '')));
    const recipientPhone = checkoutPhone ?? (await getUserPhone(mine.order.customer_id)) ?? '';
    if (!PHONE_RE.test(recipientPhone)) {
      return NextResponse.json({ status: 'error', message: 'The customer has no valid phone number on file — ask them to update their profile.' }, { status: 422 });
    }
    const recipientAddress = mine.order.shipping_address ?? '';
    if (!recipientAddress) {
      return NextResponse.json({ status: 'error', message: 'The order has no shipping address.' }, { status: 422 });
    }

    // Step 3 validation (package)
    const weightKg = Number(body.weight_kg);
    if (!Number.isFinite(weightKg) || weightKg <= 0 || weightKg > 50) {
      return NextResponse.json({ status: 'error', message: 'Weight must be between 0.01 and 50 kg (J&T PH max).' }, { status: 400 });
    }
    const dims = [body.length_cm, body.width_cm, body.height_cm].map((d) => (d == null ? null : Number(d)));
    for (const d of dims) {
      if (d != null && (!Number.isFinite(d) || d <= 0 || d > 150)) {
        return NextResponse.json({ status: 'error', message: 'Each dimension must be between 1 and 150 cm.' }, { status: 400 });
      }
    }
    const declaredValue = Number(mine.price) * Number(mine.quantity);
    const itemsSummary = `${mine.product_name} × ${mine.quantity}${mine.selected_variant ? ` (${mine.selected_variant})` : ''}`;

    const shipment = await createShipment({
      orderItemId: mine.id,
      orderId: mine.order_id,
      artisanId: session.id,
      customerId: mine.order.customer_id,
      sender: { name: senderName, phone: senderPhone, address: senderAddress },
      recipient: { name: recipientName, phone: recipientPhone, address: recipientAddress },
      itemsSummary,
      weightKg, lengthCm: dims[0], widthCm: dims[1], heightCm: dims[2],
      declaredValue,
      notes: (body.notes ?? '').trim() || null,
    });

    await pushNotification({
      userId: mine.order.customer_id, role: 'customer', type: 'order_shipped',
      message: `Your order for '${mine.product_name}' has been shipped via J&T Express. Tracking number: ${shipment.tracking_number}.`,
      data: { order_id: mine.order_id, tracking_number: shipment.tracking_number },
    });
    await logActivity({ userId: session.id, role: 'artisan', userName: session.name, action: 'shipment_created', description: `Shipment ${shipment.tracking_number} booked for order #${mine.order_id} (${mine.product_name})` });

    return NextResponse.json({ status: 'success', shipment });
  } catch (e) {
    return NextResponse.json(
      { status: 'error', message: e instanceof Error ? e.message : 'Booking failed.' },
      { status: 500 },
    );
  }
}
