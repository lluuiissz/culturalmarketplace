// Data layer additions for the full admin back-office, artisan P5b features,
// and customer profile/addresses/reports. Same dual-backend pattern as db.ts.

import bcrypt from 'bcryptjs';
import {
  seedUsers, seedReviews, seedReports, seedAddresses, DEMO_PASSWORD_HASH,
} from './seed';
import { sql, tsString, parseJsonish } from './dbPg';
import { invalidate } from './cache';
import type {
  Product, Artisan, Order, OrderItem, Address, Report, ExperienceBooking,
  CustomerRow, ArtisanAnalytics,
} from './types';

const DATABASE_URL = process.env.DATABASE_URL || '';
export const usingPg = DATABASE_URL.length > 0;

// Pool is created once in dbPg.ts (globalThis singleton) and shared here.

// ---------------------------------------------------------------------------
// Demo store extension (shares the global with db.ts's store)
// ---------------------------------------------------------------------------
interface AdminDemoStore {
  users: Array<{ id: number; name: string; email: string; password: string; role: string; location: string | null; phone: string | null; profile_picture: string | null; bio?: string | null; disabled?: boolean }>;
  artisans: Array<Artisan & { password: string; dob?: string | null; disabled?: boolean }>;
  order_items: Array<OrderItem & { review_visible?: boolean }>;
  reports: Report[];
  addresses: Address[];
  categories: Array<{ id: number; name: string; type: string }>;
  settings: Record<string, string>;
  products: Product[];
  orders: Order[];
}

function store(): AdminDemoStore {
  const g = globalThis as unknown as { __cmAdminStore?: AdminDemoStore };
  if (!g.__cmAdminStore) {
    g.__cmAdminStore = {
      users: [
        ...seedUsers.map((u) => ({ ...u })),
        { id: 9001, name: 'mark john (demo)', email: 'customer@demo.local', password: DEMO_PASSWORD_HASH, role: 'customer', location: 'Bunawan, Agusan del Sur', phone: '09000000000', profile_picture: null },
        { id: 10, name: 'John Mark Belar (demo)', email: 'artisan@demo.local', password: DEMO_PASSWORD_HASH, role: 'artisan', location: 'Bunawan, Agusan del Sur', phone: '09078813630', profile_picture: null },
        { id: 9002, name: 'System Administrator (demo)', email: 'admin@demo.local', password: DEMO_PASSWORD_HASH, role: 'admin', location: null, phone: null, profile_picture: null },
      ],
      artisans: [],
      order_items: [],
      reports: seedReports.map((r) => ({ ...r })) as Report[],
      addresses: seedAddresses.map((a) => ({ ...a })) as Address[],
      categories: [],
      settings: {},
      products: [],
      orders: [],
    };
  }
  return g.__cmAdminStore;
}

/** Pull live arrays from db.ts's store so both stores share one source of truth. */
function syncFromCore(): void {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const g = globalThis as unknown as { __cmDemoStore?: any };
  if (!g.__cmDemoStore) return;
  const core = g.__cmDemoStore;
  const s = store();
  s.artisans = core.artisans;
  s.order_items = core.order_items;
  s.categories = core.categories;
  s.settings = core.settings;
  s.products = core.products;
  s.orders = core.orders;
  // apply review seeds once
  if (!core.__reviewsSeeded) {
    core.__reviewsSeeded = true;
    for (const r of seedReviews) {
      const item = core.order_items.find((x: { id: number }) => x.id === r.order_item_id);
      if (item) {
        item.review_rating = r.rating;
        item.review_comment = r.comment;
        item.reviewed_at = r.reviewed_at;
        item.review_visible = r.visible;
      }
    }
  }
}

function n(v: unknown): number { return typeof v === 'number' ? v : Number(v ?? 0); }

// ---------------------------------------------------------------------------
// Customers (admin)
// ---------------------------------------------------------------------------
export async function listCustomers(): Promise<CustomerRow[]> {
  syncFromCore();
  if (usingPg) {
    const rows = await sql`
      select u.id, u.name, u.email, u.phone, u.location, u.created_at,
        (select count(*) from orders o where o.customer_id = u.id) as order_count
      from users u where u.role = 'customer' order by u.created_at desc nulls last limit 200`;
    return (rows as unknown as Record<string, unknown>[]).map((r) => ({
      id: n(r.id), name: String(r.name), email: String(r.email),
      phone: (r.phone as string) ?? null, location: (r.location as string) ?? null,
      created_at: tsString(r.created_at) ?? undefined,
      order_count: n(r.order_count), status: 'active' as const,
    }));
  }
  return store().users
    .filter((u) => u.role === 'customer' && !u.email.endsWith('@demo.local'))
    .map((u) => ({
      id: u.id, name: u.name, email: u.email, phone: u.phone, location: u.location,
      order_count: store().orders.filter((o) => o.customer_id === u.id).length,
      status: (u.disabled ? 'disabled' : 'active') as 'active' | 'disabled',
    }));
}

export async function updateCustomer(id: number, p: { name?: string; email?: string; phone?: string; location?: string }): Promise<void> {
  if (usingPg) {
    await sql`update users set
      name = coalesce(${p.name ?? null}, name),
      email = coalesce(${p.email ?? null}, email),
      phone = coalesce(${p.phone ?? null}, phone),
      location = coalesce(${p.location ?? null}, location)
      where id = ${id} and role = 'customer'`;
    return;
  }
  const u = store().users.find((x) => x.id === id && x.role === 'customer');
  if (u) Object.assign(u, Object.fromEntries(Object.entries(p).filter(([, v]) => v !== undefined)));
}

export async function deleteCustomer(id: number): Promise<void> {
  if (usingPg) {
    await sql`delete from users where id = ${id} and role = 'customer'`;
    return;
  }
  const s = store();
  s.users = s.users.filter((u) => u.id !== id);
}

export async function toggleCustomerStatus(id: number): Promise<void> {
  if (usingPg) {
    await sql`update users set is_verified = coalesce(not is_verified, true) where id = ${id} and role = 'customer'`;
    return;
  }
  const u = store().users.find((x) => x.id === id && x.role === 'customer');
  if (u) u.disabled = !u.disabled;
}

// ---------------------------------------------------------------------------
// Artisans (admin deep review)
// ---------------------------------------------------------------------------
export async function getArtisanFull(id: number): Promise<(Artisan & { id_number?: string | null; dob?: string | null; id_document_path?: string | null; id_document_back_path?: string | null; proof_of_craft_path?: string | null }) | null> {
  syncFromCore();
  if (usingPg) {
    const rows = await sql`select * from artisans where id = ${id} limit 1`;
    return rows.length ? (rows[0] as unknown as Artisan & Record<string, unknown>) : null;
  }
  const a = store().artisans.find((x) => x.id === id);
  return a ? { ...a } : null;
}

export async function listAllArtisansAdmin(): Promise<Artisan[]> {
  syncFromCore();
  if (usingPg) {
    const rows = await sql`select * from artisans order by created_at desc`;
    return (rows as unknown as Record<string, unknown>[]).map((r) => ({ ...r, created_at: tsString(r.created_at) })) as unknown as Artisan[];
  }
  return [...store().artisans];
}

export async function updateArtisan(id: number, p: { name?: string; email?: string; phone?: string; location?: string; craft_type?: string; business_name?: string; bio?: string }): Promise<void> {
  if (usingPg) {
    await sql`update artisans set
      name = coalesce(${p.name ?? null}, name),
      email = coalesce(${p.email ?? null}, email),
      phone = coalesce(${p.phone ?? null}, phone),
      location = coalesce(${p.location ?? null}, location),
      craft_type = coalesce(${p.craft_type ?? null}, craft_type),
      business_name = coalesce(${p.business_name ?? null}, business_name),
      bio = coalesce(${p.bio ?? null}, bio)
      where id = ${id}`;
    invalidate('artisans*');
    return;
  }
  const a = store().artisans.find((x) => x.id === id);
  if (a) Object.assign(a, Object.fromEntries(Object.entries(p).filter(([, v]) => v !== undefined)));
  invalidate('artisans*');
}

export async function deleteArtisan(id: number): Promise<void> {
  if (usingPg) {
    await sql`delete from artisans where id = ${id}`;
    return;
  }
  const s = store();
  s.artisans = s.artisans.filter((a) => a.id !== id);
}

// ---------------------------------------------------------------------------
// Bookings (workshop/experience order items)
// ---------------------------------------------------------------------------
export async function listBookings(artisanId?: number): Promise<ExperienceBooking[]> {
  syncFromCore();
  if (usingPg) {
    const rows = await sql`
      select oi.id as order_item_id, oi.order_id, oi.product_id, oi.artisan_id, oi.product_name,
             oi.attendee_name, oi.attendee_contact, oi.selected_session, oi.quantity, oi.price,
             oi.status, oi.ticket_code, o.customer_id, u.name as customer_name
      from order_items oi
      join orders o on o.id = oi.order_id
      join users u on u.id = o.customer_id
      where oi.purchase_type <> 'product'
        ${artisanId ? sql`and oi.artisan_id = ${artisanId}` : sql``}
      order by oi.id desc limit 200`;
    return (rows as unknown as Record<string, unknown>[]).map((r) => ({
      order_item_id: n(r.order_item_id), order_id: n(r.order_id), product_id: n(r.product_id),
      customer_id: n(r.customer_id), customer_name: String(r.customer_name),
      id: n(r.product_id), product_name: String(r.product_name),
      attendee_name: (r.attendee_name as string) ?? null, attendee_contact: (r.attendee_contact as string) ?? null,
      selected_session: (r.selected_session as ExperienceBooking['selected_session']) ?? null,
      quantity: n(r.quantity), price: n(r.price), status: String(r.status), ticket_code: (r.ticket_code as string) ?? null,
    }));
  }
  const s = store();
  return s.order_items
    .filter((x) => x.purchase_type !== 'product' && (!artisanId || x.artisan_id === artisanId))
    .map((x) => {
      const o = s.orders.find((oo) => oo.id === x.order_id);
      const cust = s.users.find((u) => u.id === o?.customer_id);
      return {
        id: x.product_id, order_item_id: x.id, order_id: x.order_id, product_id: x.product_id,
        customer_id: o?.customer_id ?? 0, customer_name: cust?.name ?? 'Customer',
        product_name: x.product_name, attendee_name: x.attendee_name,
        attendee_contact: null, selected_session: x.selected_session,
        quantity: x.quantity, price: n(x.price), status: x.status, ticket_code: x.ticket_code,
      };
    })
    .sort((a, b) => b.order_item_id - a.order_item_id);
}

export async function updateBookingStatus(orderItemId: number, status: string): Promise<void> {
  if (usingPg) {
    await sql`update order_items set status = ${status} where id = ${orderItemId}`;
    return;
  }
  const i = store().order_items.find((x) => x.id === orderItemId);
  if (i) i.status = status;
}

// ---------------------------------------------------------------------------
// Reviews (order_items review columns; visibility flag)
// ---------------------------------------------------------------------------
export async function listAllReviews(): Promise<Array<OrderItem & { review_visible?: boolean; customer_name?: string | null }>> {
  syncFromCore();
  if (usingPg) {
    const rows = await sql`
      select oi.*, u.name as customer_name from order_items oi
      join orders o on o.id = oi.order_id
      join users u on u.id = o.customer_id
      where oi.review_rating is not null
      order by oi.reviewed_at desc nulls last limit 200`;
    return (rows as unknown as Record<string, unknown>[]).map((r) => ({
      ...mapItem(r),
      review_visible: r.review_visible == null ? true : Boolean(r.review_visible),
      customer_name: (r.customer_name as string) ?? null,
    }));
  }
  return store().order_items
    .filter((x) => x.review_rating != null)
    .map((x) => {
      const o = store().orders.find((oo) => oo.id === x.order_id);
      const cust = store().users.find((u) => u.id === o?.customer_id);
      return { ...x, review_visible: (x as { review_visible?: boolean }).review_visible ?? true, customer_name: cust?.name ?? null };
    })
    .sort((a, b) => (b.reviewed_at ?? '').localeCompare(a.reviewed_at ?? ''));
}

function mapItem(r: Record<string, unknown>): OrderItem {
  return {
    id: n(r.id), order_id: n(r.order_id), product_id: n(r.product_id), artisan_id: n(r.artisan_id),
    product_name: String(r.product_name), purchase_type: r.purchase_type as OrderItem['purchase_type'],
    attendee_name: (r.attendee_name as string) ?? null,
    selected_session: parseJsonish<OrderItem['selected_session']>(r.selected_session), ticket_code: (r.ticket_code as string) ?? null,
    quantity: n(r.quantity), price: n(r.price), status: String(r.status ?? 'pending'),
    review_rating: r.review_rating == null ? null : n(r.review_rating),
    review_comment: (r.review_comment as string) ?? null,
    reviewed_at: (r.reviewed_at as string) ?? null,
    selected_variant: (r.selected_variant as string) ?? null,
  };
}

export async function setReviewVisible(itemId: number, visible: boolean): Promise<void> {
  if (usingPg) {
    await sql`update order_items set review_visible = ${visible} where id = ${itemId}`;
    return;
  }
  const i = store().order_items.find((x) => x.id === itemId) as { review_visible?: boolean } | undefined;
  if (i) i.review_visible = visible;
}

export async function deleteReview(itemId: number): Promise<void> {
  if (usingPg) {
    await sql`update order_items set review_rating = null, review_comment = null, reviewed_at = null where id = ${itemId}`;
    return;
  }
  const i = store().order_items.find((x) => x.id === itemId);
  if (i) { i.review_rating = null; i.review_comment = null; i.reviewed_at = null; }
}

// ---------------------------------------------------------------------------
// Reports (moderation)
// ---------------------------------------------------------------------------
export async function listReports(): Promise<Report[]> {
  syncFromCore();
  if (usingPg) {
    const rows = await sql`select * from reports order by created_at desc limit 200`;
    return (rows as unknown as Record<string, unknown>[]).map((r) => ({ ...r, created_at: tsString(r.created_at), resolved_at: tsString((r as { resolved_at?: unknown }).resolved_at) })) as unknown as Report[];
  }
  return [...store().reports].sort((a, b) => b.id - a.id);
}

export async function updateReport(id: number, p: { status?: Report['status']; action_taken?: string }): Promise<void> {
  if (usingPg) {
    await sql`update reports set
      status = coalesce(${p.status ?? null}, status),
      action_taken = coalesce(${p.action_taken ?? null}, action_taken)
      where id = ${id}`;
    return;
  }
  const r = store().reports.find((x) => x.id === id);
  if (r) {
    if (p.status) r.status = p.status;
    if (p.action_taken) r.action_taken = p.action_taken;
  }
}

export async function createReport(input: { reporterId: number; reportedType: Report['reported_type']; reportedId: number; reason: string; reporterName?: string; reportedName?: string }): Promise<number> {
  syncFromCore();
  if (usingPg) {
    const rows = await sql`insert into reports (reporter_id, reported_type, reported_id, reason, reporter_name, reported_name)
      values (${input.reporterId}, ${input.reportedType}, ${input.reportedId}, ${input.reason}, ${input.reporterName ?? null}, ${input.reportedName ?? null})
      returning id`;
    return n((rows[0] as Record<string, unknown>).id);
  }
  const id = Math.max(0, ...store().reports.map((r) => r.id)) + 1;
  store().reports.push({
    id, reporter_id: input.reporterId, reported_type: input.reportedType, reported_id: input.reportedId,
    reason: input.reason, status: 'pending', action_taken: null, created_at: new Date().toISOString(),
    reporter_name: input.reporterName ?? null, reported_name: input.reportedName ?? null,
  });
  return id;
}

/** Moderation actions with side effects (suspend listing / account). */
export async function suspendProduct(productId: number): Promise<void> {
  if (usingPg) {
    await sql`update products set status = 'inactive' where id = ${productId}`;
    return;
  }
  const p = store().products.find((x) => x.id === productId);
  if (p) p.status = 'inactive';
}

export async function suspendArtisanAccount(artisanId: number): Promise<void> {
  if (usingPg) {
    await sql`update artisans set verification_status = 'suspended' where id = ${artisanId}`;
    invalidate('artisans*');
    return;
  }
  const a = store().artisans.find((x) => x.id === artisanId);
  if (a) a.verification_status = 'suspended';
}

// ---------------------------------------------------------------------------
// Categories (admin)
// ---------------------------------------------------------------------------
// Case-insensitive duplicate check so "weaving" and "Weaving" can't coexist.
export async function addCategory(name: string, type: 'product' | 'experience'): Promise<{ ok: boolean }> {
  syncFromCore();
  if (usingPg) {
    const dup = (await sql`select id from categories where lower(name) = lower(${name}) and type = ${type}`)[0];
    if (dup) return { ok: false };
    await sql`insert into categories (name, type) values (${name}, ${type})`;
    invalidate('categories*');
    return { ok: true };
  }
  const list = store().categories;
  if (list.some((c) => c.name.toLowerCase() === name.toLowerCase() && c.type === type)) return { ok: false };
  list.push({ id: Math.max(0, ...list.map((c) => c.id)) + 1, name, type });
  return { ok: true };
}

// Returns { ok: false, products } when products still reference the category,
// so the admin UI can block deletion instead of orphaning listings.
export async function deleteCategoryDb(id: number): Promise<{ ok: boolean; products: number }> {
  if (usingPg) {
    const cat = (await sql`select name from categories where id = ${id}`)[0] as { name: string } | undefined;
    if (!cat) return { ok: false, products: 0 };
    const used = (await sql`select count(*) as n from products where lower(category) = lower(${cat.name})`)[0] as { n: string | number };
    const products = Number(used.n);
    if (products > 0) return { ok: false, products };
    await sql`delete from categories where id = ${id}`;
    invalidate('categories*');
    return { ok: true, products: 0 };
  }
  const s = store();
  const cat = s.categories.find((c) => c.id === id);
  if (!cat) return { ok: false, products: 0 };
  const products = s.products.filter((p) => (p.category ?? '').trim().toLowerCase() === cat.name.toLowerCase()).length;
  if (products > 0) return { ok: false, products };
  s.categories = s.categories.filter((c) => c.id !== id);
  return { ok: true, products: 0 };
}

// ---------------------------------------------------------------------------
// Settings / homepage / announcements
// ---------------------------------------------------------------------------
export async function getAllSettings(): Promise<Record<string, string>> {
  syncFromCore();
  if (usingPg) {
    const rows = await sql`select key, value from settings`;
    return Object.fromEntries(rows.map((r) => [String((r as Record<string, unknown>).key), String((r as Record<string, unknown>).value)]));
  }
  return { ...store().settings };
}

export async function saveSettings(entries: Record<string, string>): Promise<void> {
  if (usingPg) {
    for (const [key, value] of Object.entries(entries)) {
      await sql`insert into settings (key, value) values (${key}, ${value})
        on conflict (key) do update set value = excluded.value`;
    }
    invalidate('settings');
    return;
  }
  Object.assign(store().settings, entries);
}

// ---------------------------------------------------------------------------
// NFC admin
// ---------------------------------------------------------------------------
export async function listTaggedProducts(): Promise<Product[]> {
  syncFromCore();
  if (usingPg) {
    const rows = await sql`select * from products where nfc_tag_id is not null order by created_at desc`;
    return rows as unknown as Product[];
  }
  return store().products.filter((p) => p.nfc_tag_id);
}

export async function setNfcTagStatus(productId: number, status: 'active' | 'inactive' | 'lost'): Promise<void> {
  if (usingPg) {
    await sql`update products set nfc_tag_status = ${status} where id = ${productId}`;
    return;
  }
  const p = store().products.find((x) => x.id === productId);
  if (p) p.nfc_tag_status = status;
}

export async function replaceNfcTag(productId: number, newTagId: string): Promise<void> {
  if (usingPg) {
    await sql`update products set nfc_tag_id = ${newTagId}, nfc_tag_status = 'active' where id = ${productId}`;
    return;
  }
  const p = store().products.find((x) => x.id === productId);
  if (p) { p.nfc_tag_id = newTagId; p.nfc_tag_status = 'active'; }
}

// Registers a NEW tag on a product: the server generates the tag ID (artisans
// never type one — prevents typos and collisions) and the tag starts in
// `awaiting_write` until the physical card is confirmed written (activation).
export async function registerNfcTag(productId: number): Promise<{ tagId: string } | { error: string }> {
  syncFromCore();
  const existing = usingPg
    ? await sql`select nfc_tag_id from products where id = ${productId}`
    : [{ nfc_tag_id: store().products.find((x) => x.id === productId)?.nfc_tag_id ?? null }];
  if (existing.length && existing[0].nfc_tag_id) return { error: 'This product already has an NFC tag. Use “Replace tag” instead.' };

  // Collision-safe generation (tag column is unique in the DB).
  for (let attempt = 0; attempt < 5; attempt++) {
    const tagId = `CM-${crypto.randomUUID().replace(/-/g, '').slice(0, 8).toUpperCase()}`;
    try {
      if (usingPg) {
        await sql`update products set nfc_tag_id = ${tagId}, nfc_tag_status = 'awaiting_write' where id = ${productId} and nfc_tag_id is null`;
      } else {
        const p = store().products.find((x) => x.id === productId);
        if (p) { p.nfc_tag_id = tagId; p.nfc_tag_status = 'awaiting_write'; }
      }
      return { tagId };
    } catch {
      // unique violation — regenerate and retry
    }
  }
  return { error: 'Could not generate a unique tag ID. Please try again.' };
}

// Called after the NfcWriter read-back confirms the URL on the card matches.
export async function activateNfcTag(productId: number, expectedTagId: string): Promise<boolean> {
  syncFromCore();
  if (usingPg) {
    const r = await sql`update products set nfc_tag_status = 'active' where id = ${productId} and nfc_tag_id = ${expectedTagId} returning id`;
    return r.length > 0;
  }
  const p = store().products.find((x) => x.id === productId);
  if (!p || p.nfc_tag_id !== expectedTagId) return false;
  p.nfc_tag_status = 'active';
  return true;
}

export async function listUntaggedProducts(): Promise<Product[]> {
  syncFromCore();
  if (usingPg) {
    const rows = await sql`select * from products where nfc_tag_id is null order by created_at desc`;
    return rows as unknown as Product[];
  }
  return store().products.filter((p) => !p.nfc_tag_id);
}

// Clears a product's tag entirely (used before re-registering on replace).
export async function clearNfcTag(productId: number): Promise<void> {
  if (usingPg) {
    await sql`update products set nfc_tag_id = null, nfc_tag_status = null where id = ${productId}`;
    return;
  }
  const p = store().products.find((x) => x.id === productId);
  if (p) { p.nfc_tag_id = null; p.nfc_tag_status = null; }
}

// ---------------------------------------------------------------------------
// Analytics (artisan)
// ---------------------------------------------------------------------------
export async function artisanAnalytics(artisanId: number): Promise<ArtisanAnalytics> {
  syncFromCore();
  if (usingPg) {
    const rows = await sql`
      select
        (select coalesce(sum(oi.price * oi.quantity), 0) from order_items oi where oi.artisan_id = ${artisanId} and oi.status <> 'cancelled') as total_sales,
        (select count(distinct oi.order_id) from order_items oi where oi.artisan_id = ${artisanId}) as total_orders,
        (select avg(oi.review_rating) from order_items oi where oi.artisan_id = ${artisanId} and oi.review_rating is not null) as avg_rating,
        (select count(*) from order_items oi where oi.artisan_id = ${artisanId} and oi.review_rating is not null) as review_count,
        (select count(*) from products p where p.artisan_id = ${artisanId}) as product_count,
        (select count(*) from order_items oi where oi.artisan_id = ${artisanId} and oi.purchase_type <> 'product') as booking_count,
        (select count(*) from order_items oi where oi.artisan_id = ${artisanId} and oi.purchase_type <> 'product' and oi.status = 'pending') as pending_bookings`;
    const r = rows[0] as Record<string, unknown>;
    const top = await sql`
      select oi.product_name as name, sum(oi.quantity) as qty, sum(oi.price * oi.quantity) as revenue
      from order_items oi where oi.artisan_id = ${artisanId}
      group by oi.product_name order by revenue desc limit 5`;
    const recent = await sql`
      select p.name, oi.review_rating as rating, oi.review_comment as comment, oi.reviewed_at
      from order_items oi join products p on p.id = oi.product_id
      where oi.artisan_id = ${artisanId} and oi.review_rating is not null
      order by oi.reviewed_at desc nulls last limit 5`;
    return {
      totalSales: n(r.total_sales), totalOrders: n(r.total_orders),
      avgRating: r.avg_rating == null ? null : Number(r.avg_rating),
      reviewCount: n(r.review_count), productCount: n(r.product_count),
      bookingCount: n(r.booking_count), pendingBookings: n(r.pending_bookings),
      topProducts: (top as unknown as Record<string, unknown>[]).map((t) => ({ name: String(t.name), qty: n(t.qty), revenue: n(t.revenue) })),
      recentReviews: (recent as unknown as Record<string, unknown>[]).map((t) => ({ name: String(t.name), rating: n(t.rating), comment: (t.comment as string) ?? null, reviewed_at: t.reviewed_at ? String(t.reviewed_at) : null })),
    };
  }
  const s = store();
  const items = s.order_items.filter((x) => x.artisan_id === artisanId && x.status !== 'cancelled');
  const reviews = items.filter((x) => x.review_rating != null);
  const bookings = s.order_items.filter((x) => x.artisan_id === artisanId && x.purchase_type !== 'product');
  const byProduct = new Map<string, { qty: number; revenue: number }>();
  for (const i of items) {
    const e = byProduct.get(i.product_name) ?? { qty: 0, revenue: 0 };
    e.qty += i.quantity; e.revenue += n(i.price) * i.quantity;
    byProduct.set(i.product_name, e);
  }
  return {
    totalSales: items.reduce((sum, i) => sum + n(i.price) * i.quantity, 0),
    totalOrders: new Set(items.map((i) => i.order_id)).size,
    avgRating: reviews.length ? reviews.reduce((sum, i) => sum + (i.review_rating ?? 0), 0) / reviews.length : null,
    reviewCount: reviews.length,
    productCount: s.products.filter((p) => p.artisan_id === artisanId).length,
    bookingCount: bookings.length,
    pendingBookings: bookings.filter((b) => b.status === 'pending').length,
    topProducts: [...byProduct.entries()].map(([name, v]) => ({ name, ...v })).sort((a, b) => b.revenue - a.revenue).slice(0, 5),
    recentReviews: reviews.slice(0, 5).map((r) => ({ name: r.product_name, rating: r.review_rating ?? 0, comment: r.review_comment, reviewed_at: r.reviewed_at })),
  };
}

// ---------------------------------------------------------------------------
// Addresses (customer)
// ---------------------------------------------------------------------------
export async function listAddresses(customerId: number): Promise<Address[]> {
  syncFromCore();
  if (usingPg) {
    const rows = await sql`select * from customer_addresses where customer_id = ${customerId} order by is_default desc, id`;
    return rows as unknown as Address[];
  }
  return store().addresses.filter((a) => a.customer_id === customerId);
}

export async function createAddress(input: Omit<Address, 'id'>): Promise<number> {
  if (usingPg) {
    if (input.is_default) await sql`update customer_addresses set is_default = false where customer_id = ${input.customer_id}`;
    const rows = await sql`insert into customer_addresses (customer_id, label, full_name, phone, address, landmark, is_default)
      values (${input.customer_id}, ${input.label}, ${input.full_name}, ${input.phone}, ${input.address}, ${input.landmark}, ${input.is_default})
      returning id`;
    return n((rows[0] as Record<string, unknown>).id);
  }
  const s = store();
  if (input.is_default) s.addresses.forEach((a) => { if (a.customer_id === input.customer_id) a.is_default = false; });
  const id = Math.max(0, ...s.addresses.map((a) => a.id)) + 1;
  s.addresses.push({ ...input, id });
  return id;
}

export async function deleteAddress(customerId: number, id: number): Promise<void> {
  if (usingPg) {
    await sql`delete from customer_addresses where id = ${id} and customer_id = ${customerId}`;
    return;
  }
  const s = store();
  s.addresses = s.addresses.filter((a) => !(a.id === id && a.customer_id === customerId));
}

export async function setDefaultAddress(customerId: number, id: number): Promise<void> {
  if (usingPg) {
    await sql`update customer_addresses set is_default = (id = ${id}) where customer_id = ${customerId}`;
    return;
  }
  store().addresses.forEach((a) => { if (a.customer_id === customerId) a.is_default = a.id === id; });
}

// ---------------------------------------------------------------------------
// Profile (customer + artisan)
// ---------------------------------------------------------------------------
export async function updateCustomerProfile(id: number, p: { name?: string; phone?: string; location?: string; bio?: string; profile_picture?: string }): Promise<void> {
  if (usingPg) {
    await sql`update users set
      name = coalesce(${p.name ?? null}, name),
      phone = coalesce(${p.phone ?? null}, phone),
      location = coalesce(${p.location ?? null}, location),
      bio = coalesce(${p.bio ?? null}, bio),
      profile_picture = coalesce(${p.profile_picture ?? null}, profile_picture)
      where id = ${id}`;
    return;
  }
  const u = store().users.find((x) => x.id === id);
  if (u) Object.assign(u, Object.fromEntries(Object.entries(p).filter(([, v]) => v !== undefined)));
}

export async function updateArtisanProfile(id: number, p: { name?: string; phone?: string; location?: string; bio?: string; business_name?: string; craft_type?: string; profile_picture?: string }): Promise<void> {
  if (usingPg) {
    await sql`update artisans set
      name = coalesce(${p.name ?? null}, name),
      phone = coalesce(${p.phone ?? null}, phone),
      location = coalesce(${p.location ?? null}, location),
      bio = coalesce(${p.bio ?? null}, bio),
      business_name = coalesce(${p.business_name ?? null}, business_name),
      craft_type = coalesce(${p.craft_type ?? null}, craft_type),
      profile_picture = coalesce(${p.profile_picture ?? null}, profile_picture)
      where id = ${id}`;
    invalidate('artisans*');
    return;
  }
  const a = store().artisans.find((x) => x.id === id);
  if (a) Object.assign(a, Object.fromEntries(Object.entries(p).filter(([, v]) => v !== undefined)));
}

// ---------------------------------------------------------------------------
// Tutorials (artisan): session dates + attendees
// ---------------------------------------------------------------------------
export async function saveTutorialDates(artisanId: number, productId: number, dates: unknown): Promise<void> {
  // Pass the array as-is: the pool's json type serializer handles jsonb params.
  if (usingPg) {
    await sql`update products set tutorial_dates = ${(dates ?? null) as unknown as string | null}, has_tutorial = true where id = ${productId} and artisan_id = ${artisanId}`;
    return;
  }
  const p = store().products.find((x) => x.id === productId && x.artisan_id === artisanId);
  if (p) { p.tutorial_dates = dates as Product['tutorial_dates']; p.has_tutorial = true; }
}

export async function listAttendees(artisanId: number, productId: number): Promise<ExperienceBooking[]> {
  const all = await listBookings(artisanId);
  return all.filter((b) => b.product_id === productId);
}

export async function markAttendeePresent(orderItemId: number, present: boolean): Promise<void> {
  await updateBookingStatus(orderItemId, present ? 'attended' : 'no_show');
}

// ---------------------------------------------------------------------------
// Reports seed name backfill for demo (reporter names resolved at read time)
// ---------------------------------------------------------------------------
export async function getCustomerName(id: number): Promise<string | null> {
  syncFromCore();
  if (usingPg) {
    const rows = await sql`select name from users where id = ${id} limit 1`;
    return rows.length ? String((rows[0] as Record<string, unknown>).name) : null;
  }
  return store().users.find((u) => u.id === id)?.name ?? null;
}

/** Batched names for many users — ONE query (N+1 fix for report/moderation lists). */
export async function getCustomerNames(ids: number[]): Promise<Map<number, string>> {
  const map = new Map<number, string>();
  const unique = [...new Set(ids)].filter(Boolean);
  if (!unique.length) return map;
  if (usingPg) {
    const rows = await sql`select id, name from users where id = any(${unique})`;
    for (const r of rows as unknown as Record<string, unknown>[]) map.set(n(r.id), String(r.name));
    return map;
  }
  for (const id of unique) {
    const u = store().users.find((x) => x.id === id);
    if (u) map.set(id, u.name);
  }
  return map;
}

/** Batched product counts for many artisans — ONE query (N+1 fix for artisan lists). */
export async function getProductCountsByArtisan(artisanIds: number[]): Promise<Map<number, number>> {
  const map = new Map<number, number>();
  const unique = [...new Set(artisanIds)].filter(Boolean);
  if (!unique.length) return map;
  if (usingPg) {
    const rows = await sql`select artisan_id, count(*)::int as cnt from products where artisan_id = any(${unique}) group by artisan_id`;
    for (const r of rows as unknown as Record<string, unknown>[]) map.set(n(r.artisan_id), n(r.cnt));
    return map;
  }
  for (const id of unique) {
    map.set(id, store().products.filter((p) => p.artisan_id === id).length);
  }
  return map;
}

// bcrypt re-export for password change route
export async function hashPasswordAdmin(pw: string): Promise<string> {
  return bcrypt.hash(pw, 10);
}
