import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { updateShipmentStatus, getShipmentById } from '@/lib/shipments';
import { pushNotification } from '@/lib/db';
import type { ShipmentStatus } from '@/lib/types';

// Status transitions: artisan advances their own parcels; admin may also cancel
// (exception path). Customer is notified on every movement.
const STATUS_MESSAGE: Record<ShipmentStatus, (t: string) => string> = {
  created: (t) => `Shipment label created for your order. Tracking: ${t} (J&T Express).`,
  dropped_off: (t) => `Your parcel was dropped off at J&T Express. Tracking: ${t}.`,
  in_transit: (t) => `Your parcel is on the way! Tracking: ${t}.`,
  delivered: () => 'Your parcel was delivered. Enjoy your craft!',
  cancelled: () => 'Your shipment was cancelled. The artisan will contact you about next steps.',
};

const VALID: ShipmentStatus[] = ['dropped_off', 'in_transit', 'delivered', 'cancelled'];

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || (session.role !== 'artisan' && session.role !== 'admin')) {
    return NextResponse.json({ status: 'error', message: 'Unauthorized' }, { status: 401 });
  }
  const { id } = await params;
  const shipmentId = Number(id);
  try {
    const body = (await req.json()) as { status?: string };
    const next = body.status as ShipmentStatus;
    if (!VALID.includes(next)) {
      return NextResponse.json({ status: 'error', message: 'Invalid status.' }, { status: 400 });
    }

    const shipment = await getShipmentById(shipmentId);
    if (!shipment) return NextResponse.json({ status: 'error', message: 'Shipment not found.' }, { status: 404 });

    // Artisans may only advance their own parcels; cancel is admin-only.
    if (session.role === 'artisan') {
      if (shipment.artisan_id !== session.id) {
        return NextResponse.json({ status: 'error', message: 'This shipment belongs to another artisan.' }, { status: 403 });
      }
      if (next === 'cancelled') {
        return NextResponse.json({ status: 'error', message: 'Only an admin can cancel a shipment. Contact support.' }, { status: 403 });
      }
    }

    const updated = await updateShipmentStatus(shipmentId, next, session.role);
    if (!updated) return NextResponse.json({ status: 'error', message: 'Shipment not found.' }, { status: 404 });

    await pushNotification({
      userId: shipment.customer_id, role: 'customer', type: `shipment_${next}`,
      message: STATUS_MESSAGE[next](shipment.tracking_number),
      data: { order_id: shipment.order_id, tracking_number: shipment.tracking_number },
    });

    return NextResponse.json({ status: 'success', shipment: updated });
  } catch (e) {
    return NextResponse.json(
      { status: 'error', message: e instanceof Error ? e.message : 'Update failed.' },
      { status: 400 },
    );
  }
}
