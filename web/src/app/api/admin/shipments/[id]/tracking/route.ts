import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { updateTrackingNumber, getShipmentById } from '@/lib/shipments';
import { logActivity } from '@/lib/db';

// Admin exception path: correct a mistyped tracking number on a shipment.
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ status: 'error' }, { status: 401 });
  }
  const { id } = await params;
  const shipmentId = Number(id);
  try {
    const body = (await req.json()) as { tracking_number?: string };
    const tracking = (body.tracking_number ?? '').trim().toUpperCase();
    if (!/^[A-Z0-9]{8,20}$/.test(tracking)) {
      return NextResponse.json({ status: 'error', message: 'Tracking number must be 8–20 letters/digits.' }, { status: 400 });
    }
    const shipment = await getShipmentById(shipmentId);
    if (!shipment) return NextResponse.json({ status: 'error', message: 'Shipment not found.' }, { status: 404 });

    await updateTrackingNumber(shipmentId, tracking);
    await logActivity({
      userId: session.id, role: 'admin', userName: session.name,
      action: 'shipment_tracking_fixed',
      description: `Tracking for shipment #${shipmentId} corrected: ${shipment.tracking_number} → ${tracking}`,
    });
    return NextResponse.json({ status: 'success' });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Update failed.';
    const conflict = /duplicate key/i.test(msg);
    return NextResponse.json(
      { status: 'error', message: conflict ? 'That tracking number is already used by another shipment.' : msg },
      { status: conflict ? 409 : 500 },
    );
  }
}
