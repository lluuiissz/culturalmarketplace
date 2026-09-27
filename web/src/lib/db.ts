// Dual data layer:
//  - DATABASE_URL set  -> real Postgres (Supabase) via `postgres` driver
//  - otherwise         -> in-memory demo store seeded from the legacy dump
// Both backends implement the same call surface, so route handlers are
// written once against `db.*`.

import bcrypt from 'bcryptjs';
import { sql, tsString, parseJsonish } from './dbPg';
import { cached, invalidate } from './cache';
import {
  seedUsers, seedArtisans, seedCategories, seedProducts,
  seedOrders, seedOrderItems, seedNotifications, seedSettings, normalizeBcrypt,
  DEMO_PASSWORD_HASH, DEMO_ACCOUNTS,
} from './seed';
import type {
  Product, Artisan, Order, OrderItem, CartItem, Notification,
  ChatMessage, ActivityLog, SessionUser, Role,
} from './types';

const DATABASE_URL = process.env.DATABASE_URL || '';
export const usingPostgres = DATABASE_URL.length > 0;

// Pool is created once in dbPg.ts (globalThis singleton) and shared here.

// ---------------------------------------------------------------------------
// Demo store (mutable mirror of the seed data)
// ---------------------------------------------------------------------------
interface DemoRow {
  users: Array<(typeof seedUsers)[number] & { bio?: string | null; is_verified?: boolean }>;
  artisans: Array<Artisan & { password: string; dob?: string | null; id_document_path?: string | null; id_document_back_path?: string | null; business_name?: string | null }>;
  categories: (typeof seedCategories)[number][];
  products: Product[];
  cart_items: (CartItem & { attendee_for?: string; attendee_contact?: string | null; attendee_note?: string | null })[];
  orders: (Order & { paymongo_link_id?: string | null })[];
  order_items: OrderItem[];
  chat_conversations: Array<{ id: number; customer_id: number; artisan_id: number; product_id: number | null; last_message_at: string; created_at: string }>;
  chat_messages: ChatMessage[];
  notifications: Notification[];
  activity_logs: ActivityLog[];
  shipments: import('./types').Shipment[];
  settings: Record<string, string>;
  pending: Map<string, { name: string; phone: string; password: string; otp: string; expires: number; attempts: number }>;
}

export { demo };
function demo(): DemoRow {
  const g = globalThis as unknown as { __cmDemoStore?: DemoRow };
  if (!g.__cmDemoStore) {
    const s: DemoRow = {
      shipments: [],
      users: [
        ...seedUsers.map((u) => ({ ...u })),
        // demo accounts (password: demo1234) for preview exploration.
        // The artisan demo row intentionally shares id 10 with the artisan profile
        // so the portal shows the seeded products/orders/conversations.
        { id: 9001, name: 'mark john (demo)', email: 'customer@demo.local', password: DEMO_PASSWORD_HASH, role: 'customer' as const, location: 'Bunawan, Agusan del Sur', phone: '09000000000', profile_picture: null },
        { id: 10, name: 'John Mark Belar (demo)', email: 'artisan@demo.local', password: DEMO_PASSWORD_HASH, role: 'artisan' as const, location: 'Bunawan, Agusan del Sur', phone: '09078813630', profile_picture: null },
        { id: 9002, name: 'System Administrator (demo)', email: 'admin@demo.local', password: DEMO_PASSWORD_HASH, role: 'admin' as const, location: null, phone: null, profile_picture: null },
      ],
      artisans: seedArtisans.map((a) => ({ ...a, password: normalizeBcrypt('$2y$10$WTjCe4wDxRU8vpzZwbKxDukonvNxyEuIG44xSUt.NEH2ELqY8pS46'), dob: '2002-01-29' })),
      categories: seedCategories.map((c) => ({ ...c })),
      products: seedProducts.map((p) => ({ ...p, product_gallery: p.product_gallery ?? null })),
      cart_items: [],
      orders: seedOrders.map((o) => ({ ...o, paymongo_link_id: null, notes: null })) as DemoRow['orders'],
      order_items: seedOrderItems.map((o) => ({
        ...o,
        attendee_for: 'self', attendee_name: null, attendee_contact: null, attendee_note: null,
        ticket_code: o.purchase_type === 'workshop' ? `TKT-${o.id}` : null,
        review_rating: null, review_comment: null, reviewed_at: null,
      })) as OrderItem[],
      chat_conversations: [
        { id: 1, customer_id: 1, artisan_id: 10, product_id: 17, last_message_at: new Date(Date.now() - 3600_000).toISOString(), created_at: new Date(Date.now() - 7200_000).toISOString() },
      ],
      chat_messages: [
        { id: 1, conversation_id: 1, sender_role: 'customer', message: 'Hi! Is this basket still available in size M?', read_at: new Date().toISOString(), created_at: new Date(Date.now() - 3600_000).toISOString() },
      ],
      notifications: seedNotifications.map((n) => ({ ...n })),
      activity_logs: [
        { id: 1, user_id: 8, user_role: 'admin', user_name: 'System Administrator', action: 'login', description: 'Administrator logged in', created_at: new Date().toISOString() },
      ],
      settings: { ...seedSettings },
      pending: new Map(),
    };
    g.__cmDemoStore = s;
  }
  return g.__cmDemoStore;
}

export const store = usingPostgres ? null : demo();

export { DEMO_ACCOUNTS };

// Barrel re-export: admin/customer/artisan extension functions live in
// adminDb.ts but are exposed through '@/lib/db' for a single import surface.
export * from './adminDb';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 10);
}
export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  try {
    return await bcrypt.compare(plain, normalizeBcrypt(hash));
  } catch {
    return false;
  }
}

function num(v: unknown): number {
  return typeof v === 'number' ? v : Number(v ?? 0);
}

// ---------------------------------------------------------------------------
// Auth / users
// ---------------------------------------------------------------------------
export async function findUserByEmail(email: string): Promise<(SessionUser & { password: string }) | null> {
  if (usingPostgres) {
    const rows = await sql`select id, name, email, password, role, profile_picture from users where lower(email) = ${email.toLowerCase()} limit 1`;
    if (!rows.length) {
      // Legacy schema keeps artisan credentials in the artisans table
      const a = await sql`select id, name, email, password, profile_picture, verification_status from artisans where lower(email) = ${email.toLowerCase()} limit 1`;
      if (!a.length) return null;
      const ar = a[0] as Record<string, unknown>;
      return { id: num(ar.id), name: String(ar.name), email: String(ar.email), password: String(ar.password), role: 'artisan' as Role, profile_picture: (ar.profile_picture as string) ?? null };
    }
    const r = rows[0] as Record<string, unknown>;
    return { id: num(r.id), name: String(r.name), email: String(r.email), password: String(r.password), role: String(r.role) as Role, profile_picture: (r.profile_picture as string) ?? null };
  }
  const u = store!.users.find((x) => x.email.toLowerCase() === email.toLowerCase());
  if (!u) {
    // artisans live in the artisans table in the legacy schema
    const a = store!.artisans.find((x) => x.email.toLowerCase() === email.toLowerCase());
    if (a) return { id: a.id, name: a.name, email: a.email, password: a.password, role: 'artisan', profile_picture: a.profile_picture };
    return null;
  }
  return { id: u.id, name: u.name, email: u.email, password: u.password, role: u.role, profile_picture: u.profile_picture ?? null };
}

export async function createCustomer(input: { name: string; email: string; password: string; phone: string; location?: string }): Promise<number> {
  if (usingPostgres) {
    const rows = await sql`insert into users (name, email, password, role, phone, location, is_verified)
      values (${input.name}, ${input.email}, ${input.password}, 'customer', ${input.phone}, ${input.location ?? null}, true)
      returning id`;
    return num(rows[0].id);
  }
  const id = Math.max(0, ...store!.users.map((u) => u.id)) + 1;
  store!.users.push({ id, name: input.name, email: input.email, password: input.password, role: 'customer', location: input.location ?? null, phone: input.phone, profile_picture: null });
  return id;
}

export async function createArtisan(input: {
  name: string; email: string; password: string; phone: string; location: string;
  craft_type: string; business_name?: string; id_number: string; dob?: string;
  id_document_path?: string | null; id_document_back_path?: string | null;
  selfie_path?: string | null; face_matched?: boolean | null; face_confidence?: number | null;
  registration_notes?: string | null;
}): Promise<number> {
  if (usingPostgres) {
    const rows = await sql`insert into artisans (name, email, password, phone, location, craft_type, business_name, id_number, dob, id_document_path, id_document_back_path, selfie_path, face_matched, face_confidence, registration_notes, verification_status)
      values (${input.name}, ${input.email}, ${input.password}, ${input.phone}, ${input.location}, ${input.craft_type}, ${input.business_name ?? null}, ${input.id_number}, ${input.dob ?? null}, ${input.id_document_path ?? null}, ${input.id_document_back_path ?? null}, ${input.selfie_path ?? null}, ${input.face_matched ?? null}, ${input.face_confidence ?? null}, ${input.registration_notes ?? null}, 'pending')
      returning id`;
    return num(rows[0].id);
  }
  const id = Math.max(0, ...store!.artisans.map((a) => a.id)) + 1;
  store!.artisans.push({
    id, name: input.name, email: input.email, password: input.password, phone: input.phone,
    location: input.location, craft_type: input.craft_type, business_name: input.business_name ?? null,
    bio: null, profile_picture: null, verification_status: 'pending',
    id_document_path: input.id_document_path ?? null, id_document_back_path: input.id_document_back_path ?? null,
    selfie_path: input.selfie_path ?? null, face_matched: input.face_matched ?? null,
    face_confidence: input.face_confidence ?? null, registration_notes: input.registration_notes ?? null,
    dob: input.dob ?? null,
  });
  // mirror into users so unified login works
  const uid = Math.max(0, ...store!.users.map((u) => u.id)) + 1;
  store!.users.push({ id: uid, name: input.name, email: input.email, password: input.password, role: 'artisan', location: input.location, phone: input.phone, profile_picture: null });
  return id;
}

// ---------------------------------------------------------------------------
// Pending registrations (OTP)
// ---------------------------------------------------------------------------
export async function putPendingRegistration(email: string, data: { name: string; phone: string; password: string; otp: string; ttlMinutes: number }): Promise<void> {
  const expires = Date.now() + data.ttlMinutes * 60_000;
  if (usingPostgres) {
    await sql`insert into pending_registrations (email, name, phone, password, otp_code, otp_expires, attempts)
      values (${email.toLowerCase()}, ${data.name}, ${data.phone}, ${data.password}, ${data.otp}, ${new Date(expires).toISOString()}, 0)
      on conflict (email) do update set name = excluded.name, phone = excluded.phone,
        password = excluded.password, otp_code = excluded.otp_code, otp_expires = excluded.otp_expires, attempts = 0`;
    return;
  }
  store!.pending.set(email.toLowerCase(), { name: data.name, phone: data.phone, password: data.password, otp: data.otp, expires, attempts: 0 });
}

export async function takePendingRegistration(email: string): Promise<{ name: string; phone: string; password: string; otp: string; expires: number } | null> {
  if (usingPostgres) {
    const rows = await sql`select name, phone, password, otp_code, otp_expires from pending_registrations where email = ${email.toLowerCase()} limit 1`;
    if (!rows.length) return null;
    const r = rows[0] as Record<string, unknown>;
    return { name: String(r.name), phone: String(r.phone), password: String(r.password), otp: String(r.otp_code), expires: new Date(String(r.otp_expires)).getTime() };
  }
  const p = store!.pending.get(email.toLowerCase());
  return p ? { name: p.name, phone: p.phone, password: p.password, otp: p.otp, expires: p.expires } : null;
}

export async function deletePendingRegistration(email: string): Promise<void> {
  if (usingPostgres) {
    await sql`delete from pending_registrations where email = ${email.toLowerCase()}`;
    return;
  }
  store!.pending.delete(email.toLowerCase());
}

// ---------------------------------------------------------------------------
// Marketplace reads
// ---------------------------------------------------------------------------
export async function getSettings(): Promise<Record<string, string>> {
  return cached('settings', async () => {
    if (usingPostgres) {
      const rows = await sql`select key, value from settings`;
      return Object.fromEntries(rows.map((r) => [String((r as Record<string, unknown>).key), String((r as Record<string, unknown>).value)]));
    }
    return { ...store!.settings };
  });
}

export async function listCategories(type?: 'product' | 'experience'): Promise<Array<{ id: number; name: string; type: string }>> {
  return cached(`categories:${type ?? 'all'}`, async () => {
    if (usingPostgres) {
      const rows = type
        ? await sql`select id, name, type from categories where type = ${type} order by name`
        : await sql`select id, name, type from categories order by name`;
      return rows as unknown as Array<{ id: number; name: string; type: string }>;
    }
    return store!.categories.filter((c) => !type || c.type === type).map((c) => ({ ...c }));
  });
}

function mapProduct(r: Record<string, unknown>): Product {
  return {
    id: num(r.id), artisan_id: num(r.artisan_id), name: String(r.name), description: (r.description as string) ?? null,
    price: num(r.price), stock_quantity: num(r.stock_quantity), category: (r.category as string) ?? null,
    image_path: (r.image_path as string) ?? null, product_gallery: parseJsonish<string[]>(r.product_gallery),
    video_path: (r.video_path as string) ?? null, status: r.status as Product['status'],
    nfc_tag_id: (r.nfc_tag_id as string) ?? null, nfc_tag_status: (r.nfc_tag_status as string) ?? null,
    has_tutorial: Boolean(r.has_tutorial), tutorial_title: (r.tutorial_title as string) ?? null,
    tutorial_description: (r.tutorial_description as string) ?? null,
    tutorial_dates: parseJsonish<Product['tutorial_dates']>(r.tutorial_dates),
    tutorial_price: r.tutorial_price == null ? null : num(r.tutorial_price),
    tutorial_capacity: r.tutorial_capacity == null ? null : num(r.tutorial_capacity),
    tutorial_location: (r.tutorial_location as string) ?? null,
    tutorial_fee_type: (r.tutorial_fee_type as Product['tutorial_fee_type']) ?? null,
    tutorial_learnings: (r.tutorial_learnings as string[] | null) ?? null,
    tutorial_status: (r.tutorial_status as Product['tutorial_status']) ?? null,
    materials_used: (r.materials_used as string) ?? null,
    has_variations: Boolean(r.has_variations), variation_pricing: Boolean(r.variation_pricing),
    variations_data: parseJsonish<Product['variations_data']>(r.variations_data),
    created_at: tsString(r.created_at) ?? new Date().toISOString(),
  };
}

export async function listActiveProducts(opts?: { category?: string; search?: string; artisanId?: number }): Promise<Product[]> {
  if (usingPostgres) {
    const rows = await sql`
      select * from products
      where status = 'active'
        and (${opts?.category ?? null}::text is null or category = ${opts?.category ?? null})
        and (${opts?.artisanId ?? null}::bigint is null or artisan_id = ${opts?.artisanId ?? null})
        and (${opts?.search ?? null}::text is null or name ilike '%' || ${opts?.search ?? null} || '%' or description ilike '%' || ${opts?.search ?? null} || '%')
      order by created_at desc limit 100`;
    return (rows as unknown as Record<string, unknown>[]).map(mapProduct);
  }
  let list = store!.products.filter((p) => p.status === 'active');
  if (opts?.category) list = list.filter((p) => p.category === opts.category);
  if (opts?.artisanId) list = list.filter((p) => p.artisan_id === opts.artisanId);
  if (opts?.search) {
    const s = opts.search.toLowerCase();
    list = list.filter((p) => p.name.toLowerCase().includes(s) || (p.description ?? '').toLowerCase().includes(s));
  }
  return list;
}

export async function getProduct(id: number): Promise<Product | null> {
  if (usingPostgres) {
    const rows = await sql`select * from products where id = ${id} limit 1`;
    return rows.length ? mapProduct(rows[0] as unknown as Record<string, unknown>) : null;
  }
  const p = store!.products.find((x) => x.id === id);
  return p ?? null;
}

export async function getProductByNfc(tagId: string): Promise<Product | null> {
  if (usingPostgres) {
    const rows = await sql`select * from products where nfc_tag_id = ${tagId} limit 1`;
    return rows.length ? mapProduct(rows[0] as unknown as Record<string, unknown>) : null;
  }
  return store!.products.find((x) => x.nfc_tag_id === tagId) ?? null;
}

export async function listArtisanProducts(artisanId: number): Promise<Product[]> {
  if (usingPostgres) {
    const rows = await sql`select * from products where artisan_id = ${artisanId} order by created_at desc`;
    return (rows as unknown as Record<string, unknown>[]).map(mapProduct);
  }
  return store!.products.filter((p) => p.artisan_id === artisanId).sort((a, b) => b.id - a.id);
}

function mapArtisan(r: Record<string, unknown>): Artisan {
  return {
    id: num(r.id), name: String(r.name), email: String(r.email),
    business_name: (r.business_name as string) ?? null, craft_type: (r.craft_type as string) ?? null,
    location: (r.location as string) ?? null, bio: (r.bio as string) ?? null,
    profile_picture: (r.profile_picture as string) ?? null,
    verification_status: r.verification_status as Artisan['verification_status'],
    phone: (r.phone as string) ?? null,
  };
}

export async function listApprovedArtisans(): Promise<Artisan[]> {
  return cached('artisans:approved', async () => {
    if (usingPostgres) {
      const rows = await sql`select * from artisans where verification_status = 'approved' order by name`;
      return (rows as unknown as Record<string, unknown>[]).map(mapArtisan);
    }
    return store!.artisans.filter((a) => a.verification_status === 'approved');
  });
}

export async function getArtisan(id: number): Promise<Artisan | null> {
  if (usingPostgres) {
    const rows = await sql`select * from artisans where id = ${id} limit 1`;
    return rows.length ? mapArtisan(rows[0] as unknown as Record<string, unknown>) : null;
  }
  const a = store!.artisans.find((x) => x.id === id);
  return a ? { ...a } : null;
}

/** Phone number on a user account (used for shipment recipient contact). */
export async function getUserPhone(userId: number): Promise<string | null> {
  if (usingPostgres) {
    const rows = await sql`select phone from users where id = ${userId} limit 1`;
    return rows.length ? ((rows[0] as { phone?: string | null }).phone ?? null) : null;
  }
  return store!.users.find((u) => u.id === userId)?.phone ?? null;
}

/** Demo-mode helper: update product media columns in the in-memory store. */
export function updateProductMediaDemo(productId: number, imagePath: string | null, gallery: string[] | null): void {
  const p = store!.products.find((x) => x.id === productId);
  if (p) { p.image_path = imagePath; p.product_gallery = gallery; }
}

export async function getArtisanByEmail(email: string): Promise<Artisan | null> {
  if (usingPostgres) {
    const rows = await sql`select * from artisans where email = ${email} limit 1`;
    return rows.length ? mapArtisan(rows[0] as unknown as Record<string, unknown>) : null;
  }
  return store!.artisans.find((a) => a.email === email) ?? null;
}

export async function listPendingArtisans(): Promise<Artisan[]> {
  if (usingPostgres) {
    const rows = await sql`select * from artisans where verification_status = 'pending' order by created_at desc`;
    return (rows as unknown as Record<string, unknown>[]).map(mapArtisan);
  }
  return store!.artisans.filter((a) => a.verification_status === 'pending');
}

export async function setArtisanStatus(id: number, status: Artisan['verification_status']): Promise<void> {
  if (usingPostgres) {
    await sql`update artisans set verification_status = ${status} where id = ${id}`;
    invalidate('artisans*');
    return;
  }
  const a = store!.artisans.find((x) => x.id === id);
  if (a) a.verification_status = status;
}

// ---------------------------------------------------------------------------
// Cart
// ---------------------------------------------------------------------------
export async function getCart(customerId: number): Promise<Array<CartItem & { product: Product | null }>> {
  if (usingPostgres) {
    const rows = await sql`
      select c.*, to_jsonb(p) as product from cart_items c
      left join products p on p.id = c.product_id
      where c.customer_id = ${customerId} order by c.created_at desc`;
    return (rows as unknown as Record<string, unknown>[]).map((r) => ({
      id: num(r.id), customer_id: num(r.customer_id), product_id: num(r.product_id),
      purchase_type: r.purchase_type as CartItem['purchase_type'],
      attendee_name: (r.attendee_name as string) ?? null,
      selected_session: (r.selected_session as CartItem['selected_session']) ?? null,
      quantity: num(r.quantity), selected_variant: (r.selected_variant as string) ?? null,
      product: r.product ? mapProduct(r.product as Record<string, unknown>) : null,
    }));
  }
  return store!.cart_items
    .filter((c) => c.customer_id === customerId)
    .map((c) => ({ ...c, product: store!.products.find((p) => p.id === c.product_id) ?? null }))
    .sort((a, b) => b.id - a.id);
}

export async function addToCart(item: {
  customerId: number; productId: number; purchaseType: CartItem['purchase_type'];
  quantity: number; selectedVariant?: string | null; selectedSession?: object | null;
  attendeeFor?: string; attendeeName?: string | null; attendeeContact?: string | null; attendeeNote?: string | null;
}): Promise<void> {
  // postgres.js JSON-serializes plain objects for jsonb params at runtime; the
  // cast only satisfies the driver's parameter typing.
  const sessionParam = (item.selectedSession ?? null) as unknown as string | null;
  if (usingPostgres) {
    await sql`insert into cart_items (customer_id, product_id, purchase_type, quantity, selected_variant, selected_session, attendee_for, attendee_name, attendee_contact, attendee_note)
      values (${item.customerId}, ${item.productId}, ${item.purchaseType}, ${item.quantity}, ${item.selectedVariant ?? null},
              ${sessionParam}, ${item.attendeeFor ?? 'self'},
              ${item.attendeeName ?? null}, ${item.attendeeContact ?? null}, ${item.attendeeNote ?? null})`;
    return;
  }
  store!.cart_items.push({
    id: Math.max(0, ...store!.cart_items.map((c) => c.id)) + 1,
    customer_id: item.customerId, product_id: item.productId, purchase_type: item.purchaseType,
    attendee_name: item.attendeeName ?? null, selected_session: (item.selectedSession as CartItem['selected_session']) ?? null,
    quantity: item.quantity, selected_variant: item.selectedVariant ?? null,
  });
}

export async function updateCartQty(customerId: number, itemId: number, quantity: number): Promise<void> {
  if (usingPostgres) {
    await sql`update cart_items set quantity = ${quantity} where id = ${itemId} and customer_id = ${customerId}`;
    return;
  }
  const c = store!.cart_items.find((x) => x.id === itemId && x.customer_id === customerId);
  if (c) c.quantity = quantity;
}

export async function removeFromCart(customerId: number, itemId: number): Promise<void> {
  if (usingPostgres) {
    await sql`delete from cart_items where id = ${itemId} and customer_id = ${customerId}`;
    return;
  }
  store!.cart_items = store!.cart_items.filter((x) => !(x.id === itemId && x.customer_id === customerId));
}

export async function clearCart(customerId: number, ids?: number[]): Promise<void> {
  if (usingPostgres) {
    if (ids?.length) await sql`delete from cart_items where customer_id = ${customerId} and id = any(${ids})`;
    else await sql`delete from cart_items where customer_id = ${customerId}`;
    return;
  }
  store!.cart_items = store!.cart_items.filter((x) => x.customer_id !== customerId || (ids ? !ids.includes(x.id) : false));
}

// ---------------------------------------------------------------------------
// Orders
// ---------------------------------------------------------------------------
function mapOrder(r: Record<string, unknown>): Order {
  return {
    id: num(r.id), customer_id: num(r.customer_id), total_amount: num(r.total_amount),
    status: String(r.status), payment_method: String(r.payment_method),
    payment_receipt: (r.payment_receipt as string) ?? null, payment_reference: (r.payment_reference as string) ?? null,
    shipping_address: (r.shipping_address as string) ?? null, notes: (r.notes as string) ?? null,
    created_at: tsString(r.created_at) ?? new Date().toISOString(),
  };
}

function mapOrderItem(r: Record<string, unknown>): OrderItem {
  return {
    id: num(r.id), order_id: num(r.order_id), product_id: num(r.product_id), artisan_id: num(r.artisan_id),
    product_name: String(r.product_name), purchase_type: r.purchase_type as OrderItem['purchase_type'],
    attendee_name: (r.attendee_name as string) ?? null,
    selected_session: (r.selected_session as OrderItem['selected_session']) ?? null,
    ticket_code: (r.ticket_code as string) ?? null, quantity: num(r.quantity), price: num(r.price),
    status: String(r.status ?? 'pending'), review_rating: r.review_rating == null ? null : num(r.review_rating),
    review_comment: (r.review_comment as string) ?? null,
    reviewed_at: (r.reviewed_at as string) ?? null,
    selected_variant: (r.selected_variant as string) ?? null,
    courier_name: (r.courier_name as string) ?? null,
    tracking_number: (r.tracking_number as string) ?? null,
  };
}

export async function createOrder(input: {
  customerId: number; total: number; paymentMethod: string; status: string;
  shippingAddress: string; notes?: string; items: Array<{
    productId: number; artisanId: number; productName: string; purchaseType: CartItem['purchase_type'];
    quantity: number; price: number; selectedVariant?: string | null; selectedSession?: object | null;
    attendeeName?: string | null;
  }>;
}): Promise<number> {
  if (usingPostgres) {
    const rows = await sql`insert into orders (customer_id, total_amount, status, payment_method, shipping_address, notes)
      values (${input.customerId}, ${input.total}, ${input.status}, ${input.paymentMethod}, ${input.shippingAddress}, ${input.notes ?? null})
      returning id`;
    const orderId = num(rows[0].id);
    for (const it of input.items) {
      await sql`insert into order_items (order_id, product_id, artisan_id, product_name, purchase_type, quantity, price, selected_variant, selected_session, attendee_name, ticket_code, status)
        values (${orderId}, ${it.productId}, ${it.artisanId}, ${it.productName}, ${it.purchaseType}, ${it.quantity}, ${it.price},
                ${it.selectedVariant ?? null}, ${(it.selectedSession ?? null) as unknown as string | null},
                ${it.attendeeName ?? null},
                ${it.purchaseType !== 'product' ? 'TKT-' + Date.now() + '-' + it.productId : null},
                ${input.status === 'awaiting_payment' ? 'awaiting_payment' : 'pending'})`;
      // Legacy parity (CheckoutController): workshop bookings never touch
      // physical stock; only product/bundle lines deduct on order creation.
      if (it.purchaseType !== 'workshop') {
        await sql`update products set stock_quantity = greatest(0, stock_quantity - ${it.quantity}) where id = ${it.productId}`;
        // Variation-level stock: selected_variant is "<typeLabel>: <name>";
        // decrement the matching entry inside the variations_data JSON.
        if (it.selectedVariant) {
          const vrows = await sql`select variations_data from products where id = ${it.productId}`;
          let variants: Array<{ name: string; stock: number; price: number; type: string; typeLabel: string }> | null = null;
          try { variants = typeof vrows[0].variations_data === 'string' ? JSON.parse(vrows[0].variations_data) : (vrows[0].variations_data as typeof variants); } catch { /* ignore */ }
          const entry = variants?.find((v) => `${v.typeLabel}: ${v.name}` === it.selectedVariant);
          if (entry) {
            const updated = variants!.map((v) => (v === entry ? { ...v, stock: Math.max(0, v.stock - it.quantity) } : v));
            await sql`update products set variations_data = ${JSON.stringify(updated)}::jsonb where id = ${it.productId}`;
          }
        }
      }
    }
    return orderId;
  }
  const orderId = Math.max(0, ...store!.orders.map((o) => o.id)) + 1;
  store!.orders.push({
    id: orderId, customer_id: input.customerId, total_amount: input.total, status: input.status,
    payment_method: input.paymentMethod, shipping_address: input.shippingAddress, notes: input.notes ?? null,
    payment_receipt: null, payment_reference: null, paymongo_link_id: null, created_at: new Date().toISOString(),
  });
  for (const it of input.items) {
    store!.order_items.push({
      id: Math.max(0, ...store!.order_items.map((o) => o.id)) + 1,
      order_id: orderId, product_id: it.productId, artisan_id: it.artisanId, product_name: it.productName,
      purchase_type: it.purchaseType, attendee_name: it.attendeeName ?? null,
      selected_session: (it.selectedSession as OrderItem['selected_session']) ?? null,
      ticket_code: it.purchaseType !== 'product' ? `TKT-${Date.now()}-${it.productId}` : null,
      quantity: it.quantity, price: it.price, status: input.status === 'awaiting_payment' ? 'awaiting_payment' : 'pending',
      review_rating: null, review_comment: null, reviewed_at: null, selected_variant: it.selectedVariant ?? null,
    });
    const p = store!.products.find((x) => x.id === it.productId);
    if (p) {
      p.stock_quantity = Math.max(0, p.stock_quantity - it.quantity);
      // Variation-level deduction mirrors the Postgres path.
      if (it.selectedVariant && Array.isArray(p.variations_data)) {
        const entry = p.variations_data.find((v) => `${v.typeLabel}: ${v.name}` === it.selectedVariant);
        if (entry) entry.stock = Math.max(0, entry.stock - it.quantity);
      }
    }
  }
  return orderId;
}

export async function getOrder(id: number): Promise<Order | null> {
  if (usingPostgres) {
    const rows = await sql`select * from orders where id = ${id} limit 1`;
    return rows.length ? mapOrder(rows[0] as unknown as Record<string, unknown>) : null;
  }
  const o = store!.orders.find((x) => x.id === id);
  return o ?? null;
}

export async function getOrderItems(orderId: number): Promise<OrderItem[]> {
  if (usingPostgres) {
    const rows = await sql`select * from order_items where order_id = ${orderId} order by id`;
    return (rows as unknown as Record<string, unknown>[]).map(mapOrderItem);
  }
  return store!.order_items.filter((x) => x.order_id === orderId);
}

/** Batched items for many orders — ONE query instead of one per order.
 *  Every order-items round-trip to Supabase costs ~100ms; pages that render
 *  item lists for N orders were paying N × 100ms (the classic N+1). */
export async function getOrderItemsForOrders(orderIds: number[]): Promise<Map<number, OrderItem[]>> {
  const map = new Map<number, OrderItem[]>();
  if (!orderIds.length) return map;
  if (usingPostgres) {
    const rows = await sql`select * from order_items where order_id = any(${orderIds}) order by id`;
    for (const raw of rows as unknown as Record<string, unknown>[]) {
      const item = mapOrderItem(raw);
      const list = map.get(item.order_id);
      if (list) list.push(item); else map.set(item.order_id, [item]);
    }
    return map;
  }
  for (const id of orderIds) {
    map.set(id, store!.order_items.filter((x) => x.order_id === id));
  }
  return map;
}

export async function listCustomerOrders(customerId: number): Promise<Order[]> {
  if (usingPostgres) {
    const rows = await sql`select * from orders where customer_id = ${customerId} order by created_at desc`;
    return (rows as unknown as Record<string, unknown>[]).map(mapOrder);
  }
  return store!.orders.filter((o) => o.customer_id === customerId).sort((a, b) => b.id - a.id);
}

export async function listArtisanOrders(artisanId: number): Promise<Array<OrderItem & { order: Order | null; customer_name: string | null }>> {
  if (usingPostgres) {
    const rows = await sql`
      select oi.*, to_jsonb(o) as order, u.name as customer_name from order_items oi
      join orders o on o.id = oi.order_id
      join users u on u.id = o.customer_id
      where oi.artisan_id = ${artisanId} order by oi.id desc`;
    return (rows as unknown as Record<string, unknown>[]).map((r) => ({
      ...mapOrderItem(r),
      order: r.order ? mapOrder(r.order as Record<string, unknown>) : null,
      customer_name: (r.customer_name as string) ?? null,
    }));
  }
  return store!.order_items
    .filter((x) => x.artisan_id === artisanId)
    .map((x) => {
      const o = store!.orders.find((oo) => oo.id === x.order_id) ?? null;
      const u = o ? store!.users.find((uu) => uu.id === o.customer_id) : undefined;
      return { ...x, order: o, customer_name: u?.name ?? null };
    })
    .sort((a, b) => b.id - a.id);
}

export async function updateOrderStatus(orderId: number, status: string): Promise<void> {
  if (usingPostgres) {
    await sql`update orders set status = ${status} where id = ${orderId}`;
    return;
  }
  const o = store!.orders.find((x) => x.id === orderId);
  if (o) o.status = status;
}

export async function getOrderItem(itemId: number): Promise<OrderItem | null> {
  if (usingPostgres) {
    const rows = await sql`select * from order_items where id = ${itemId} limit 1`;
    return rows.length ? mapOrderItem(rows[0] as unknown as Record<string, unknown>) : null;
  }
  return store!.order_items.find((x) => x.id === itemId) ?? null;
}

export async function updateOrderItemStatus(itemId: number, status: string): Promise<void> {
  if (usingPostgres) {
    await sql`update order_items set status = ${status} where id = ${itemId}`;
    return;
  }
  const i = store!.order_items.find((x) => x.id === itemId);
  if (i) i.status = status;
}

export async function updateOrderItemReview(itemId: number, rating: number, comment: string | null): Promise<void> {
  if (usingPostgres) {
    await sql`update order_items set review_rating = ${rating}, review_comment = ${comment}, reviewed_at = now() where id = ${itemId}`;
    return;
  }
  const i = store!.order_items.find((x) => x.id === itemId);
  if (i) { i.review_rating = rating; i.review_comment = comment; i.reviewed_at = new Date().toISOString(); }
}

export async function setOrderPayment(orderId: number, opts: { receipt?: string; reference?: string; status?: string }): Promise<void> {
  if (usingPostgres) {
    await sql`update orders set
        payment_receipt = coalesce(${opts.receipt ?? null}, payment_receipt),
        payment_reference = coalesce(${opts.reference ?? null}, payment_reference),
        status = coalesce(${opts.status ?? null}, status)
      where id = ${orderId}`;
    return;
  }
  const o = store!.orders.find((x) => x.id === orderId);
  if (!o) return;
  if (opts.receipt) o.payment_receipt = opts.receipt;
  if (opts.reference) o.payment_reference = opts.reference;
  if (opts.status) o.status = opts.status;
}

export async function listPendingPaymentOrders(): Promise<Order[]> {
  if (usingPostgres) {
    const rows = await sql`select * from orders where payment_method = 'gcash' and status = 'awaiting_payment' order by created_at desc`;
    return (rows as unknown as Record<string, unknown>[]).map(mapOrder);
  }
  return store!.orders.filter((o) => o.payment_method === 'gcash' && o.status === 'awaiting_payment');
}

export async function listAllOrders(): Promise<Order[]> {
  if (usingPostgres) {
    const rows = await sql`select * from orders order by created_at desc limit 200`;
    return (rows as unknown as Record<string, unknown>[]).map(mapOrder);
  }
  return [...store!.orders].sort((a, b) => b.id - a.id);
}

// ---------------------------------------------------------------------------
// Notifications
// ---------------------------------------------------------------------------
export async function pushNotification(n: { userId: number; role: string; type: string; message: string; data?: object }): Promise<void> {
  if (usingPostgres) {
    await sql`insert into notifications (user_id, user_role, type, message, data)
      values (${n.userId}, ${n.role}, ${n.type}, ${n.message}, ${(n.data ?? null) as unknown as string | null})`;
    return;
  }
  store!.notifications.push({
    id: Math.max(0, ...store!.notifications.map((x) => x.id)) + 1,
    user_id: n.userId, user_role: n.role, type: n.type, message: n.message,
    is_read: false, created_at: new Date().toISOString(),
  });
}

export async function listNotifications(userId: number, role: string): Promise<Notification[]> {
  if (usingPostgres) {
    const rows = await sql`select * from notifications where user_id = ${userId} and user_role = ${role} order by created_at desc limit 50`;
    return (rows as unknown as Record<string, unknown>[]).map((r) => ({
      id: num(r.id), user_id: num(r.user_id), user_role: String(r.user_role), type: String(r.type),
      message: String(r.message), is_read: Boolean(r.is_read), created_at: tsString(r.created_at) ?? new Date().toISOString(),
    }));
  }
  return store!.notifications.filter((n) => n.user_id === userId && n.user_role === role).sort((a, b) => b.id - a.id);
}

export async function markNotificationsRead(userId: number, role: string): Promise<void> {
  if (usingPostgres) {
    await sql`update notifications set is_read = true where user_id = ${userId} and user_role = ${role}`;
    return;
  }
  store!.notifications.forEach((n) => { if (n.user_id === userId && n.user_role === role) n.is_read = true; });
}

// ---------------------------------------------------------------------------
// Chat
// ---------------------------------------------------------------------------
export async function openConversation(customerId: number, artisanId: number, productId: number): Promise<number> {
  if (usingPostgres) {
    const rows = await sql`select id from chat_conversations where customer_id = ${customerId} and artisan_id = ${artisanId} and product_id = ${productId} limit 1`;
    if (rows.length) return num((rows[0] as Record<string, unknown>).id);
    const ins = await sql`insert into chat_conversations (customer_id, artisan_id, product_id) values (${customerId}, ${artisanId}, ${productId}) returning id`;
    return num((ins[0] as Record<string, unknown>).id);
  }
  let conv = store!.chat_conversations.find((c) => c.customer_id === customerId && c.artisan_id === artisanId && c.product_id === productId);
  if (!conv) {
    conv = {
      id: Math.max(0, ...store!.chat_conversations.map((c) => c.id)) + 1,
      customer_id: customerId, artisan_id: artisanId, product_id: productId,
      last_message_at: new Date().toISOString(), created_at: new Date().toISOString(),
    };
    store!.chat_conversations.push(conv);
  }
  return conv.id;
}

export async function getConversation(id: number): Promise<{ id: number; customer_id: number; artisan_id: number; product_id: number | null } | null> {
  if (usingPostgres) {
    const rows = await sql`select id, customer_id, artisan_id, product_id from chat_conversations where id = ${id} limit 1`;
    return rows.length ? (rows[0] as unknown as { id: number; customer_id: number; artisan_id: number; product_id: number | null }) : null;
  }
  const c = store!.chat_conversations.find((x) => x.id === id);
  return c ? { id: c.id, customer_id: c.customer_id, artisan_id: c.artisan_id, product_id: c.product_id } : null;
}

export async function listConversations(user: { id: number; role: Role }): Promise<Array<{ id: number; counterpart: string; product_name: string | null; last_message_at: string }>> {
  if (usingPostgres) {
    const isCustomer = user.role === 'customer';
    const rows = await sql`
      select c.id, ${isCustomer ? sql`a.name` : sql`u.name`} as counterpart, p.name as product_name, c.last_message_at
      from chat_conversations c
      join artisans a on a.id = c.artisan_id
      join users u on u.id = c.customer_id
      left join products p on p.id = c.product_id
      where ${isCustomer ? sql`c.customer_id = ${user.id}` : sql`c.artisan_id = ${user.id}`}
      order by c.last_message_at desc`;
    return (rows as unknown as Record<string, unknown>[]).map((r) => ({
      id: num(r.id), counterpart: String(r.counterpart), product_name: (r.product_name as string) ?? null,
      last_message_at: String(r.last_message_at),
    }));
  }
  const mine = store!.chat_conversations.filter((c) => (user.role === 'customer' ? c.customer_id === user.id : c.artisan_id === user.id));
  return mine
    .map((c) => {
      const artisan = store!.artisans.find((a) => a.id === c.artisan_id);
      const cust = store!.users.find((u) => u.id === c.customer_id);
      const product = c.product_id ? store!.products.find((p) => p.id === c.product_id) : null;
      return {
        id: c.id,
        counterpart: user.role === 'customer' ? artisan?.name ?? 'Artisan' : cust?.name ?? 'Customer',
        product_name: product?.name ?? null,
        last_message_at: c.last_message_at,
      };
    })
    .sort((a, b) => b.last_message_at.localeCompare(a.last_message_at));
}

export async function listMessages(conversationId: number): Promise<ChatMessage[]> {
  if (usingPostgres) {
    const rows = await sql`select * from chat_messages where conversation_id = ${conversationId} order by created_at asc limit 200`;
    return (rows as unknown as Record<string, unknown>[]).map((r) => ({
      id: num(r.id), conversation_id: num(r.conversation_id), sender_role: r.sender_role as ChatMessage['sender_role'],
      message: String(r.message), read_at: tsString(r.read_at), created_at: tsString(r.created_at) ?? new Date().toISOString(),
    }));
  }
  return store!.chat_messages.filter((m) => m.conversation_id === conversationId).sort((a, b) => a.id - b.id);
}

export async function sendMessage(conversationId: number, senderRole: 'customer' | 'artisan', message: string): Promise<void> {
  if (usingPostgres) {
    await sql`insert into chat_messages (conversation_id, sender_role, message) values (${conversationId}, ${senderRole}, ${message})`;
    await sql`update chat_conversations set last_message_at = now() where id = ${conversationId}`;
    return;
  }
  store!.chat_messages.push({
    id: Math.max(0, ...store!.chat_messages.map((m) => m.id)) + 1,
    conversation_id: conversationId, sender_role: senderRole, message,
    read_at: null, created_at: new Date().toISOString(),
  });
  const c = store!.chat_conversations.find((x) => x.id === conversationId);
  if (c) c.last_message_at = new Date().toISOString();
}

// ---------------------------------------------------------------------------
// Activity log
// ---------------------------------------------------------------------------
export async function logActivity(entry: { userId?: number | null; role?: string; userName?: string; action: string; description: string; ip?: string }): Promise<void> {
  if (usingPostgres) {
    await sql`insert into activity_logs (user_id, user_role, user_name, action, description, ip_address)
      values (${entry.userId ?? null}, ${entry.role ?? 'system'}, ${entry.userName ?? 'System'}, ${entry.action}, ${entry.description}, ${entry.ip ?? ''})`;
    return;
  }
  store!.activity_logs.push({
    id: Math.max(0, ...store!.activity_logs.map((x) => x.id)) + 1,
    user_id: entry.userId ?? null, user_role: entry.role ?? 'system', user_name: entry.userName ?? 'System',
    action: entry.action, description: entry.description, created_at: new Date().toISOString(),
  });
}

export async function listActivityLogs(limit = 100): Promise<ActivityLog[]> {
  if (usingPostgres) {
    const rows = await sql`select * from activity_logs order by created_at desc limit ${limit}`;
    return (rows as unknown as Record<string, unknown>[]).map((r) => ({
      id: num(r.id), user_id: r.user_id == null ? null : num(r.user_id), user_role: String(r.user_role),
      user_name: String(r.user_name), action: String(r.action), description: String(r.description),
      created_at: tsString(r.created_at) ?? new Date().toISOString(),
    }));
  }
  return [...store!.activity_logs].sort((a, b) => b.id - a.id).slice(0, limit);
}

// ---------------------------------------------------------------------------
// Admin stats
// ---------------------------------------------------------------------------
export async function adminStats(): Promise<{ customers: number; artisans: number; pendingArtisans: number; orders: number; revenue: number; products: number }> {
  if (usingPostgres) {
    const r = await sql`
      select
        (select count(*) from users where role = 'customer') as customers,
        (select count(*) from artisans) as artisans,
        (select count(*) from artisans where verification_status = 'pending') as pending_artisans,
        (select count(*) from orders) as orders,
        (select coalesce(sum(total_amount), 0) from orders where status = 'paid') as revenue,
        (select count(*) from products) as products`;
    const row = r[0] as Record<string, unknown>;
    return {
      customers: num(row.customers), artisans: num(row.artisans), pendingArtisans: num(row.pending_artisans),
      orders: num(row.orders), revenue: num(row.revenue), products: num(row.products),
    };
  }
  return {
    customers: store!.users.filter((u) => u.role === 'customer').length,
    artisans: store!.artisans.length,
    pendingArtisans: store!.artisans.filter((a) => a.verification_status === 'pending').length,
    orders: store!.orders.length,
    revenue: store!.orders.filter((o) => o.status === 'paid').reduce((s, o) => s + o.total_amount, 0),
    products: store!.products.length,
  };
}

// ---------------------------------------------------------------------------
// Products (artisan CRUD)
// ---------------------------------------------------------------------------
export async function createProduct(artisanId: number, p: Partial<Product>): Promise<number> {
  if (usingPostgres) {
    const rows = await sql`insert into products (artisan_id, name, description, price, stock_quantity, category, has_tutorial, tutorial_title, tutorial_description, tutorial_price, tutorial_capacity, tutorial_dates, tutorial_fee_type, has_variations, variations_data)
      values (${artisanId}, ${p.name!}, ${p.description ?? null}, ${p.price ?? 0}, ${p.stock_quantity ?? 0}, ${p.category ?? null},
              ${p.has_tutorial ?? false}, ${p.tutorial_title ?? null}, ${p.tutorial_description ?? null}, ${p.tutorial_price ?? null},
              ${p.tutorial_capacity ?? null}, ${(p.tutorial_dates ?? null) as unknown as string | null}, ${p.tutorial_fee_type ?? null},
              ${p.has_variations ?? false}, ${(p.variations_data ?? null) as unknown as string | null})
      returning id`;
    return num(rows[0].id);
  }
  const id = Math.max(0, ...store!.products.map((x) => x.id)) + 1;
  store!.products.push({
    id, artisan_id: artisanId, name: p.name!, description: p.description ?? null, price: p.price ?? 0,
    stock_quantity: p.stock_quantity ?? 0, category: p.category ?? null, image_path: null, product_gallery: null,
    video_path: null, status: 'active', nfc_tag_id: null, nfc_tag_status: null, has_tutorial: p.has_tutorial ?? false,
    tutorial_title: p.tutorial_title ?? null, tutorial_description: p.tutorial_description ?? null,
    tutorial_dates: (p.tutorial_dates as Product['tutorial_dates']) ?? null, tutorial_price: p.tutorial_price ?? null,
    tutorial_capacity: p.tutorial_capacity ?? null, tutorial_location: null, tutorial_fee_type: p.tutorial_fee_type ?? null,
    tutorial_learnings: null, tutorial_status: null, materials_used: null, has_variations: p.has_variations ?? false,
    variation_pricing: p.variation_pricing ?? false, variations_data: (p.variations_data as Product['variations_data']) ?? null,
    created_at: new Date().toISOString(),
  });
  return id;
}

export async function updateProduct(artisanId: number, id: number, p: Partial<Product>): Promise<void> {
  if (usingPostgres) {
    await sql`update products set
        name = coalesce(${p.name ?? null}, name),
        description = coalesce(${p.description ?? null}, description),
        price = coalesce(${p.price ?? null}, price),
        stock_quantity = coalesce(${p.stock_quantity ?? null}, stock_quantity),
        category = coalesce(${p.category ?? null}, category),
        status = coalesce(${p.status ?? null}, status),
        has_tutorial = coalesce(${p.has_tutorial ?? null}, has_tutorial),
        tutorial_title = coalesce(${p.tutorial_title ?? null}, tutorial_title),
        tutorial_description = coalesce(${p.tutorial_description ?? null}, tutorial_description),
        tutorial_price = coalesce(${p.tutorial_price ?? null}, tutorial_price),
        tutorial_capacity = coalesce(${p.tutorial_capacity ?? null}, tutorial_capacity),
        tutorial_fee_type = coalesce(${p.tutorial_fee_type ?? null}, tutorial_fee_type),
        has_variations = coalesce(${p.has_variations ?? null}, has_variations),
        variation_pricing = coalesce(${p.variation_pricing ?? null}, variation_pricing),
        variations_data = coalesce(${p.variations_data !== undefined ? (p.variations_data ? JSON.stringify(p.variations_data) : null) : null}::jsonb, variations_data),
        materials_used = coalesce(${p.materials_used ?? null}, materials_used)
      where id = ${id} and artisan_id = ${artisanId}`;
    return;
  }
  const prod = store!.products.find((x) => x.id === id && x.artisan_id === artisanId);
  if (!prod) return;
  Object.assign(prod, Object.fromEntries(Object.entries(p).filter(([, v]) => v !== undefined)));
}

export async function toggleProductStatus(artisanId: number, id: number): Promise<void> {
  if (usingPostgres) {
    await sql`update products set status = case when status = 'active' then 'inactive' else 'active' end where id = ${id} and artisan_id = ${artisanId}`;
    return;
  }
  const p = store!.products.find((x) => x.id === id && x.artisan_id === artisanId);
  if (p) p.status = p.status === 'active' ? 'inactive' : 'active';
}

export async function registerNfcTag(artisanId: number, productId: number, tagId: string): Promise<void> {
  if (usingPostgres) {
    await sql`update products set nfc_tag_id = ${tagId}, nfc_tag_status = 'active' where id = ${productId} and artisan_id = ${artisanId}`;
    return;
  }
  const p = store!.products.find((x) => x.id === productId && x.artisan_id === artisanId);
  if (p) { p.nfc_tag_id = tagId; p.nfc_tag_status = 'active'; }
}
