// Seed data transcribed from DATABASE/online_marketplace.sql (MariaDB dump).
// Used by the demo store so the preview shows your real data without MySQL/Postgres.

import type { Product, Artisan } from './types';

export const seedUsers: Array<{
  id: number; name: string; email: string; password: string; role: 'customer' | 'artisan' | 'admin';
  location: string | null; phone: string | null; profile_picture: string | null;
}> = [
  { id: 1, name: 'mark john', email: 'mark@gmail.com', password: '$2y$10$8TtgE/81aBN8nbGeCsTtte1FGWhsAVF6WFTxnAiDQvMUFDPub0tta', role: 'customer', location: 'bunawan, agusan del sur', phone: '', profile_picture: null },
  { id: 6, name: 'Norie Suganob', email: 'noriesuganob17@gmail.com', password: '$2y$10$IThaAWUH0HFR2EfCidNtvu.MGlvZSFa5TnYcT3/w1fPiHf1moZYTO', role: 'customer', location: 'Bunawan, Agusan del Sur', phone: '09979904061', profile_picture: null },
  { id: 8, name: 'System Administrator', email: 'admin@marketplace.com', password: '$2y$10$la0zvTEQECeGtE4BmVe0Rud.zJ5baUFstzQI3eFE5g7riuqDJbsZG', role: 'admin', location: null, phone: null, profile_picture: null },
];

export const seedArtisans: Artisan[] = [
  {
    id: 10,
    name: 'John Mark Belar',
    email: 'belarjohnmark@gmail.com',
    business_name: 'bcsjdbdb',
    craft_type: 'Weaving',
    location: 'Purok 8, Simulao, Bunawan, Agusan del Sur',
    bio: 'Local weaver from Agusan del Sur preserving traditional techniques.',
    profile_picture: null,
    verification_status: 'approved',
    phone: '09078813630',
  },
];

export const seedCategories: Array<{ id: number; name: string; type: 'product' | 'experience' }> = [
  { id: 1, name: 'Weaving', type: 'product' },
  { id: 2, name: 'Basketry', type: 'product' },
  { id: 3, name: 'Leatherwork', type: 'product' },
  { id: 4, name: 'Embroidery', type: 'product' },
  { id: 5, name: 'Bamboo Crafts', type: 'product' },
  { id: 6, name: 'Uway Crafts', type: 'product' },
  { id: 7, name: 'Bags', type: 'product' },
  { id: 8, name: 'Other', type: 'product' },
  { id: 9, name: 'Weaving Workshop', type: 'experience' },
];

export const seedProducts: Product[] = [
  {
    id: 1, artisan_id: 10, name: 'Hand Made Logo', description: 'Handwoven piece showcasing traditional Agusan del Sur patterns.',
    price: 150, stock_quantity: 5, category: 'Weaving', image_path: null, product_gallery: null, video_path: null,
    status: 'active', nfc_tag_id: null, nfc_tag_status: null, has_tutorial: false,
    tutorial_title: null, tutorial_description: null, tutorial_dates: null, tutorial_price: null,
    tutorial_capacity: null, tutorial_location: null, tutorial_fee_type: null, tutorial_learnings: null,
    tutorial_status: null, materials_used: 'Abaca fiber, natural dyes', has_variations: false, variation_pricing: false,
    variations_data: null, created_at: '2026-06-27T17:41:28Z',
  },
  {
    id: 3, artisan_id: 10, name: 'Tarpaulin Print', description: 'Custom printed tarpaulin for events and markets.',
    price: 99, stock_quantity: 9, category: 'Other', image_path: null, product_gallery: null, video_path: null,
    status: 'active', nfc_tag_id: null, nfc_tag_status: null, has_tutorial: false,
    tutorial_title: null, tutorial_description: null, tutorial_dates: null, tutorial_price: null,
    tutorial_capacity: null, tutorial_location: null, tutorial_fee_type: null, tutorial_learnings: null,
    tutorial_status: null,
    materials_used: null, has_variations: false, variation_pricing: false,
    variations_data: null, created_at: '2026-06-27T17:48:32Z',
  },
  {
    id: 17, artisan_id: 10, name: 'Basket', description: 'Handmade uway basket with cultural patterns. Includes NFC authenticity tag and bookable weaving tutorial.',
    price: 500, stock_quantity: 500, category: 'Uway Crafts', image_path: null, product_gallery: null, video_path: null,
    status: 'active', nfc_tag_id: '35:F3:D4:33:79', nfc_tag_status: 'active', has_tutorial: true,
    tutorial_title: 'Learn Making Basket', tutorial_description: 'Hands-on weaving session covering material preparation, traditional techniques, cultural meaning, and finishing.',
    tutorial_dates: [
      { date: '2026-09-30', time_start: '13:14', time_end: '14:14', location: 'P3, San Teodoro', lat: '8.1713902', lng: '125.9984985' },
      { date: '2026-09-23', time_start: '22:14', time_end: '14:11', location: 'Bunawan, Agusan del sur', lat: '8.1751677', lng: '125.9933733' },
    ],
    tutorial_price: 199.87, tutorial_capacity: 200, tutorial_location: 'P3, San Teodoro, Bunawan',
    tutorial_fee_type: 'paid', tutorial_learnings: ['Material Preparation', 'Traditional Techniques', 'Cultural Meaning', 'Finished Product'],
    tutorial_status: 'accept_bookings',
    materials_used: 'Uway vine', has_variations: true, variation_pricing: true,
    variations_data: [
      { name: 'S', stock: 79, price: 0, type: 'size', typeLabel: 'Size' },
      { name: 'M', stock: 77, price: 0, type: 'size', typeLabel: 'Size' },
      { name: 'L', stock: 78, price: 0, type: 'size', typeLabel: 'Size' },
      { name: 'XL', stock: 78, price: 0, type: 'size', typeLabel: 'Size' },
      { name: 'Red', stock: 78, price: 0, type: 'color', typeLabel: 'Color' },
      { name: 'Black', stock: 78, price: 0, type: 'color', typeLabel: 'Color' },
      { name: 'A1', stock: 78, price: 0, type: 'others', typeLabel: 'Pattern' },
      { name: 'A2', stock: 78, price: 0, type: 'others', typeLabel: 'Pattern' },
    ],
    created_at: '2026-09-06T13:15:42Z',
  },
  {
    id: 18, artisan_id: 10, name: 'Slipper (Handwoven)', description: 'Comfortable handwoven slippers with multiple gallery photos.',
    price: 50, stock_quantity: 19, category: 'Bags', image_path: null, product_gallery: null, video_path: null,
    status: 'active', nfc_tag_id: null, nfc_tag_status: null, has_tutorial: false,
    tutorial_title: null, tutorial_description: null, tutorial_dates: null, tutorial_price: null,
    tutorial_capacity: null, tutorial_location: null, tutorial_fee_type: null, tutorial_learnings: null,
    tutorial_status: null, materials_used: 'Buri palm', has_variations: false, variation_pricing: false,
    variations_data: null, created_at: '2026-09-06T13:44:59Z',
  },
  {
    id: 19, artisan_id: 10, name: 'Souvenir Keychain', description: 'Small woven souvenir keychains with per-variant pricing.',
    price: 200, stock_quantity: 10, category: 'Bamboo Crafts', image_path: null, product_gallery: null, video_path: null,
    status: 'active', nfc_tag_id: null, nfc_tag_status: 'active', has_tutorial: false,
    tutorial_title: null, tutorial_description: null, tutorial_dates: null, tutorial_price: null, tutorial_capacity: null,
    tutorial_location: null, tutorial_fee_type: null, tutorial_learnings: null,
    tutorial_status: null,
    materials_used: 'Bamboo', has_variations: true, variation_pricing: true,
    variations_data: [
      { name: 'S', stock: 20, price: 20, type: 'size', typeLabel: 'Price ₱20' },
      { name: 'L', stock: 20, price: 49.93, type: 'size', typeLabel: 'Price ₱49.93' },
      { name: 'Pink', stock: 30, price: 50, type: 'color', typeLabel: 'Price ₱50' },
    ],
    created_at: '2026-09-06T13:59:15Z',
  },
  {
    id: 20, artisan_id: 10, name: 'Woven Wall Decor', description: 'Woven wall hanging for home decoration, batch of 10.',
    price: 200, stock_quantity: 10, category: 'Weaving', image_path: null, product_gallery: null, video_path: 'demo-video',
    status: 'active', nfc_tag_id: null, nfc_tag_status: null, has_tutorial: false,
    tutorial_title: null, tutorial_description: 'Decorative woven piece made with traditional patterns.', tutorial_dates: null, tutorial_price: null,
    tutorial_capacity: null, tutorial_location: null, tutorial_fee_type: null, tutorial_learnings: null,
    tutorial_status: null, materials_used: 'Abaca', has_variations: false, variation_pricing: false,
    variations_data: null, created_at: '2026-09-08T10:00:00Z',
  },
];

export const seedOrders: Array<{
  id: number; customer_id: number; total_amount: number; status: string; payment_method: string;
  shipping_address: string | null; payment_reference: string | null; created_at: string;
}> = [
  { id: 40, customer_id: 1, total_amount: 20, status: 'paid', payment_method: 'gcash', shipping_address: 'choy | 09078813630, P 8 Simulao, Bunawan Brook', payment_reference: 'SIM-1788703544204', created_at: '2026-09-06T14:05:06Z' },
  { id: 41, customer_id: 6, total_amount: 60, status: 'pending', payment_method: 'cash_on_delivery', shipping_address: 'Norie Suganob | 09979904061, Katmon, Poblacion, Bunawan', payment_reference: null, created_at: '2026-09-08T15:27:10Z' },
  { id: 42, customer_id: 6, total_amount: 100, status: 'paid', payment_method: 'gcash', shipping_address: 'Norie Suganob | 09979904061, Katmon, Poblacion, Bunawan', payment_reference: 'SIM-1788881459560', created_at: '2026-09-08T15:30:02Z' },
];

export const seedOrderItems: Array<{
  id: number; order_id: number; product_id: number; artisan_id: number; product_name: string;
  purchase_type: 'product' | 'workshop' | 'bundle'; quantity: number; price: number; status: string;
  selected_variant: string | null; selected_session: object | null;
}> = [
  { id: 100, order_id: 40, product_id: 17, artisan_id: 10, product_name: 'Basket', purchase_type: 'product', quantity: 1, price: 20, status: 'paid', selected_variant: 'Size: M | Color: Black', selected_session: null },
  { id: 101, order_id: 41, product_id: 20, artisan_id: 10, product_name: 'Woven Wall Decor', purchase_type: 'product', quantity: 1, price: 60, status: 'pending', selected_variant: null, selected_session: null },
  { id: 102, order_id: 42, product_id: 17, artisan_id: 10, product_name: 'Basket (workshop booking)', purchase_type: 'workshop', quantity: 1, price: 100, status: 'paid', selected_variant: null, selected_session: { date: '2026-09-30', time_start: '13:14', time_end: '14:14', location: 'P3, San Teodoro' } },
];

export const seedNotifications: Array<{ id: number; user_id: number; user_role: string; type: string; message: string; is_read: boolean; created_at: string }> = [
  { id: 1, user_id: 6, user_role: 'customer', type: 'order_shipped', message: 'Good news! Your order for Woven Wall Decor has shipped.', is_read: false, created_at: '2026-09-08T15:31:00Z' },
  { id: 2, user_id: 10, user_role: 'artisan', type: 'new_order', message: 'New order #41 from Norie Suganob! Items: Woven Wall Decor x1. Payment: Cash on Delivery.', is_read: false, created_at: '2026-09-08T15:27:10Z' },
];

export const seedReviews: Array<{
  order_item_id: number; rating: number; comment: string; reviewed_at: string; visible: boolean;
}> = [
  { order_item_id: 100, rating: 5, comment: 'Beautiful basket, exactly like the photos. Salamat!', reviewed_at: '2026-09-07T10:00:00Z', visible: true },
  { order_item_id: 102, rating: 4, comment: 'Great workshop, learned a lot about uway weaving.', reviewed_at: '2026-09-09T08:30:00Z', visible: true },
];

export const seedReports: Array<{
  id: number; reporter_id: number; reporter_name: string; reported_type: 'product' | 'artisan' | 'experience';
  reported_id: number; reported_name: string; reason: string; status: 'pending' | 'investigating' | 'resolved';
  action_taken: string | null; created_at: string;
}> = [
  {
    id: 1, reporter_id: 6, reporter_name: 'Norie Suganob', reported_type: 'product', reported_id: 3,
    reported_name: 'Tarpaulin Print', reason: 'Inappropriate Content\n\nDetails: Listing image does not show the actual product.',
    status: 'pending', action_taken: null, created_at: '2026-09-10T09:15:00Z',
  },
];

export const seedAddresses: Array<{
  id: number; customer_id: number; label: string; full_name: string | null; phone: string | null;
  address: string; landmark: string | null; is_default: boolean;
}> = [
  {
    id: 1, customer_id: 1, label: 'Home', full_name: 'mark john', phone: '09078813630',
    address: 'P 8 Simulao, Bunawan Brook, Bunawan, Agusan del Sur 8506', landmark: 'Near the chapel', is_default: true,
  },
  {
    id: 2, customer_id: 6, label: 'Home', full_name: 'Norie Suganob', phone: '09979904061',
    address: 'Katmon, Poblacion, Bunawan, Agusan del Sur 8506', landmark: 'Infront of Catholic church', is_default: true,
  },
];

export const seedSettings: Record<string, string> = {
  platform_name: 'Cultural Marketplace',
  homepage_banner_title: 'Discover Authentic Indigenous Crafts & Experiences',
  homepage_banner_subtitle: 'Supporting Agusan del Sur Artisans and Preserving Cultural Heritage',
  commission_rate: '5',
  contact_email: 'admin@culturalmarketplace.com',
  homepage_featured_products: '[]',
  homepage_featured_experiences: '[]',
};

// Legacy bcrypt hashes carry the $2y prefix used by PHP's password_hash().
// bcryptjs accepts it directly; normalize for other libraries.
export function normalizeBcrypt(hash: string): string {
  return hash.startsWith('$2y$') ? '$2b$' + hash.slice(4) : hash;
}

// Demo accounts for preview/exploration (legacy hashes above are kept verbatim
// for the real importer — original plaintext passwords are unknown).
export const DEMO_PASSWORD_HASH = '$2a$10$ZqHsE4idNCRBTmUSW4UOee1OSble87n9j.jBOVWFGoL7ck.wMlffW'; // "demo1234"
export const DEMO_ACCOUNTS = [
  { email: 'customer@demo.local', password: 'demo1234', role: 'customer' as const, id: 1, name: 'mark john' },
  { email: 'artisan@demo.local', password: 'demo1234', role: 'artisan' as const, id: 10, name: 'John Mark Belar' },
  { email: 'admin@demo.local', password: 'demo1234', role: 'admin' as const, id: 8, name: 'System Administrator' },
];
