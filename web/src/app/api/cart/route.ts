import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { addToCart, getProduct, getCart } from '@/lib/db';

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== 'customer') {
    return NextResponse.json({ status: 'error', message: 'Please sign in as a customer.' }, { status: 401 });
  }
  const cart = await getCart(session.id);
  return NextResponse.json({ status: 'success', cart });
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session || session.role !== 'customer') {
    return NextResponse.json({ status: 'error', message: 'Please sign in as a customer to add items to your cart.' }, { status: 401 });
  }
  try {
    const body = (await req.json()) as {
      product_id?: number; purchase_type?: 'product' | 'workshop' | 'bundle';
      quantity?: number; selected_variant?: string | null; selected_session?: object | null;
      attendee_for?: 'self' | 'others'; attendee_name?: string | null;
    };
    const product = await getProduct(Number(body.product_id));
    if (!product) return NextResponse.json({ status: 'error', message: 'Product not found.' }, { status: 404 });

    const effectiveAttendeeFor = body.attendee_for ?? 'self';
    const effectiveAttendeeName = body.attendee_for === 'others' && body.attendee_name ? body.attendee_name : session.name;

    if (body.purchase_type === 'bundle') {
      // Add physical handcrafted item
      await addToCart({
        customerId: session.id,
        productId: product.id,
        purchaseType: 'product',
        quantity: Math.max(1, Number(body.quantity) || 1),
        selectedVariant: body.selected_variant ?? null,
      });
      // Add cultural workshop session booking
      await addToCart({
        customerId: session.id,
        productId: product.id,
        purchaseType: 'workshop',
        quantity: Math.max(1, Number(body.quantity) || 1),
        selectedSession: body.selected_session ?? null,
        attendeeFor: effectiveAttendeeFor,
        attendeeName: effectiveAttendeeName,
      });
      return NextResponse.json({ status: 'success', message: 'Craft and Workshop added to cart!' });
    }

    const purchaseType = body.purchase_type === 'workshop' ? 'workshop' : 'product';
    await addToCart({
      customerId: session.id,
      productId: product.id,
      purchaseType,
      quantity: Math.max(1, Number(body.quantity) || 1),
      selectedVariant: body.selected_variant ?? null,
      selectedSession: purchaseType === 'workshop' ? body.selected_session ?? null : null,
      attendeeFor: purchaseType === 'workshop' ? effectiveAttendeeFor : undefined,
      attendeeName: purchaseType === 'workshop' ? effectiveAttendeeName : undefined,
    });
    return NextResponse.json({ status: 'success' });
  } catch {
    return NextResponse.json({ status: 'error', message: 'Could not add to cart.' }, { status: 500 });
  }
}
