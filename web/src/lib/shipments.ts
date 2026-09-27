// Shipments data layer — J&T-style parcel booking, dual-backend like db.ts.
// One shipment per order item; the order item's status is kept in sync in the
// same request so shipping state and order state can never diverge.
import { sql, usingPg, tsString, parseJsonish } from './dbPg';
import type { Shipment, ShipmentStatus } from './types';

type StatusHistoryEntry = { status: string; at: string; by: string };

function mapShipment(r: Record<string, unknown>): Shipment {
  return {
    id: Number(r.id),
    order_item_id: Number(r.order_item_id),
    order_id: Number(r.order_id),
    artisan_id: Number(r.artisan_id),
    customer_id: Number(r.customer_id),
    sender_name: String(r.sender_name), sender_phone: String(r.sender_phone), sender_address: String(r.sender_address),
    recipient_name: String(r.recipient_name), recipient_phone: String(r.recipient_phone), recipient_address: String(r.recipient_address),
    items_summary: String(r.items_summary),
    weight_kg: Number(r.weight_kg),
    length_cm: r.length_cm == null ? null : Number(r.length_cm),
    width_cm: r.width_cm == null ? null : Number(r.width_cm),
    height_cm: r.height_cm == null ? null : Number(r.height_cm),
    declared_value: Number(r.declared_value),
    notes: (r.notes as string) ?? null,
    courier_name: String(r.courier_name ?? 'J&T Express'),
    tracking_number: String(r.tracking_number),
    status: r.status as ShipmentStatus,
    status_history: parseJsonish<StatusHistoryEntry[]>(r.status_history) ?? [],
    created_at: tsString(r.created_at) ?? new Date().toISOString(),
    updated_at: tsString(r.updated_at) ?? new Date().toISOString(),
  };
}

/** J&T-style tracking reference: JT + 13 digits (unique-indexed in the DB). */
export function generateTrackingNumber(): string {
  let digits = '';
  for (let i = 0; i < 13; i++) digits += Math.floor(Math.random() * 10);
  return `JT${digits}`;
}

export async function createShipment(input: {
  orderItemId: number; orderId: number; artisanId: number; customerId: number;
  sender: { name: string; phone: string; address: string };
  recipient: { name: string; phone: string; address: string };
  itemsSummary: string;
  weightKg: number; lengthCm: number | null; widthCm: number | null; heightCm: number | null;
  declaredValue: number; notes: string | null;
}): Promise<Shipment> {
  const tracking = generateTrackingNumber();
  const now = new Date().toISOString();
  const history: StatusHistoryEntry[] = [{ status: 'created', at: now, by: 'artisan' }];

  if (usingPg) {
    // Try insert; on the (astronomically unlikely) tracking collision, retry once.
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const rows = await sql`
          insert into shipments (order_item_id, order_id, artisan_id, customer_id,
            sender_name, sender_phone, sender_address, recipient_name, recipient_phone, recipient_address,
            items_summary, weight_kg, length_cm, width_cm, height_cm, declared_value, notes,
            courier_name, tracking_number, status, status_history)
          values (${input.orderItemId}, ${input.orderId}, ${input.artisanId}, ${input.customerId},
            ${input.sender.name}, ${input.sender.phone}, ${input.sender.address},
            ${input.recipient.name}, ${input.recipient.phone}, ${input.recipient.address},
            ${input.itemsSummary}, ${input.weightKg}, ${input.lengthCm}, ${input.widthCm}, ${input.heightCm},
            ${input.declaredValue}, ${input.notes},
            'J&T Express', ${tracking}, 'created', ${history as unknown as string})
          returning *`;
        const shipment = mapShipment(rows[0] as Record<string, unknown>);
        await syncOrderItemShipped(input.orderItemId, tracking);
        return shipment;
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        if (attempt === 0 && /duplicate key/i.test(msg) && /tracking/i.test(msg)) continue;
        throw e;
      }
    }
    throw new Error('Could not generate a unique tracking number.');
  }

  // Demo store
  const { demo } = await import('./db');
  const s = demo();
  const shipment: Shipment = {
    id: Math.max(0, ...s.shipments.map((x) => x.id)) + 1,
    order_item_id: input.orderItemId, order_id: input.orderId, artisan_id: input.artisanId, customer_id: input.customerId,
    sender_name: input.sender.name, sender_phone: input.sender.phone, sender_address: input.sender.address,
    recipient_name: input.recipient.name, recipient_phone: input.recipient.phone, recipient_address: input.recipient.address,
    items_summary: input.itemsSummary, weight_kg: input.weightKg,
    length_cm: input.lengthCm, width_cm: input.widthCm, height_cm: input.heightCm,
    declared_value: input.declaredValue, notes: input.notes,
    courier_name: 'J&T Express', tracking_number: tracking, status: 'created',
    status_history: history, created_at: now, updated_at: now,
  };
  s.shipments.push(shipment);
  await syncOrderItemShipped(input.orderItemId, tracking);
  return shipment;
}

/** Writes courier/tracking onto the order item and moves it to shipped. */
async function syncOrderItemShipped(orderItemId: number, tracking: string): Promise<void> {
  if (usingPg) {
    await sql`update order_items set status = 'shipped', courier_name = 'J&T Express', tracking_number = ${tracking} where id = ${orderItemId}`;
    return;
  }
  const { demo } = await import('./db');
  const item = demo().order_items.find((x) => x.id === orderItemId);
  if (item) { item.status = 'shipped'; }
}

export async function getShipmentByOrderItem(orderItemId: number): Promise<Shipment | null> {
  if (usingPg) {
    const rows = await sql`select * from shipments where order_item_id = ${orderItemId}`;
    return rows[0] ? mapShipment(rows[0] as Record<string, unknown>) : null;
  }
  const { demo } = await import('./db');
  return demo().shipments.find((x) => x.order_item_id === orderItemId) ?? null;
}

export async function getShipmentById(id: number): Promise<Shipment | null> {
  if (usingPg) {
    const rows = await sql`select * from shipments where id = ${id}`;
    return rows[0] ? mapShipment(rows[0] as Record<string, unknown>) : null;
  }
  const { demo } = await import('./db');
  return demo().shipments.find((x) => x.id === id) ?? null;
}

export async function listShipmentsForCustomer(customerId: number): Promise<Shipment[]> {
  if (usingPg) {
    const rows = await sql`select * from shipments where customer_id = ${customerId} order by id desc`;
    return (rows as unknown as Record<string, unknown>[]).map(mapShipment);
  }
  const { demo } = await import('./db');
  return demo().shipments.filter((x) => x.customer_id === customerId).sort((a, b) => b.id - a.id);
}

export async function listShipmentsForArtisan(artisanId: number): Promise<Shipment[]> {
  if (usingPg) {
    const rows = await sql`select * from shipments where artisan_id = ${artisanId} order by id desc`;
    return (rows as unknown as Record<string, unknown>[]).map(mapShipment);
  }
  const { demo } = await import('./db');
  return demo().shipments.filter((x) => x.artisan_id === artisanId).sort((a, b) => b.id - a.id);
}

export async function listAllShipments(): Promise<Shipment[]> {
  if (usingPg) {
    const rows = await sql`select * from shipments order by id desc limit 500`;
    return (rows as unknown as Record<string, unknown>[]).map(mapShipment);
  }
  const { demo } = await import('./db');
  return [...demo().shipments].sort((a, b) => b.id - a.id);
}

const FLOW: Record<ShipmentStatus, ShipmentStatus | null> = {
  created: 'dropped_off',
  dropped_off: 'in_transit',
  in_transit: 'delivered',
  delivered: null,
  cancelled: null,
};

/** Advance (or cancel) a shipment and mirror the terminal state on the order item. */
export async function updateShipmentStatus(id: number, next: ShipmentStatus, byRole: string): Promise<Shipment | null> {
  const current = await getShipmentById(id);
  if (!current) return null;
  if (next === 'cancelled' ? current.status === 'delivered' : FLOW[current.status] !== next) {
    throw new Error(`Cannot move a shipment from ${current.status} to ${next}.`);
  }

  const entry: StatusHistoryEntry = { status: next, at: new Date().toISOString(), by: byRole };
  const history = [...current.status_history, entry];

  if (usingPg) {
    const rows = await sql`update shipments set status = ${next}, status_history = ${history as unknown as string} where id = ${id} returning *`;
    const updated = mapShipment(rows[0] as Record<string, unknown>);
    if (next === 'delivered') {
      await sql`update order_items set status = 'received' where id = ${updated.order_item_id}`;
    } else if (next === 'cancelled') {
      await sql`update order_items set status = 'cancelled' where id = ${updated.order_item_id}`;
    }
    return updated;
  }
  const { demo } = await import('./db');
  const s = demo();
  const sh = s.shipments.find((x) => x.id === id);
  if (!sh) return null;
  sh.status = next;
  sh.status_history = history;
  sh.updated_at = entry.at;
  const item = s.order_items.find((x) => x.id === sh.order_item_id);
  if (item && next === 'delivered') item.status = 'received';
  if (item && next === 'cancelled') item.status = 'cancelled';
  return sh;
}

/** Fix a mistyped tracking number (admin exception path). */
export async function updateTrackingNumber(id: number, tracking: string): Promise<void> {
  if (usingPg) {
    await sql`update shipments set tracking_number = ${tracking} where id = ${id}`;
    return;
  }
  const { demo } = await import('./db');
  const sh = demo().shipments.find((x) => x.id === id);
  if (sh) sh.tracking_number = tracking;
}
