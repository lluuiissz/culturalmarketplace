export type Role = 'customer' | 'artisan' | 'admin';

export interface SessionUser {
  id: number;
  name: string;
  role: Role;
  email: string;
  profile_picture?: string | null;
}

export interface Address {
  id: number;
  customer_id: number;
  label: string;
  full_name: string | null;
  phone: string | null;
  address: string;
  landmark: string | null;
  is_default: boolean;
}

export interface Report {
  id: number;
  reporter_id: number;
  reporter_name?: string | null;
  reported_type: 'product' | 'artisan' | 'experience';
  reported_id: number;
  reported_name?: string | null;
  reason: string;
  status: 'pending' | 'investigating' | 'resolved';
  action_taken: string | null;
  created_at: string;
}

export interface ExperienceBooking {
  id: number;
  order_id: number;
  order_item_id: number;
  customer_id: number;
  customer_name: string;
  product_id: number;
  product_name: string;
  attendee_name: string | null;
  attendee_contact: string | null;
  selected_session: TutorialDate | null;
  quantity: number;
  price: number;
  status: string;
  ticket_code: string | null;
}

export interface CustomerRow {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  location: string | null;
  created_at?: string;
  order_count: number;
  status: 'active' | 'disabled';
}

export interface AdminDashboardStats {
  customers: number;
  artisans: number;
  pendingArtisans: number;
  orders: number;
  revenue: number;
  products: number;
}

export interface ArtisanAnalytics {
  totalSales: number;
  totalOrders: number;
  avgRating: number | null;
  reviewCount: number;
  productCount: number;
  bookingCount: number;
  pendingBookings: number;
  topProducts: Array<{ name: string; qty: number; revenue: number }>;
  recentReviews: Array<{ name: string; rating: number; comment: string | null; reviewed_at: string | null }>;
}

export interface Product {
  id: number;
  artisan_id: number;
  name: string;
  description: string | null;
  price: number;
  stock_quantity: number;
  category: string | null;
  image_path: string | null;
  product_gallery: string[] | null;
  video_path: string | null;
  status: 'active' | 'inactive';
  nfc_tag_id: string | null;
  nfc_tag_status: string | null;
  has_tutorial: boolean;
  tutorial_title: string | null;
  tutorial_description: string | null;
  tutorial_dates: TutorialDate[] | null;
  tutorial_price: number | null;
  tutorial_capacity: number | null;
  tutorial_location: string | null;
  tutorial_fee_type: 'paid' | 'free' | null;
  tutorial_learnings: string[] | null;
  tutorial_status: 'accept_bookings' | 'draft' | null;
  materials_used: string | null;
  has_variations: boolean;
  variation_pricing: boolean;
  variations_data: Variation[] | null;
  created_at: string;
}

export interface Variation {
  name: string;
  stock: number;
  price: number;
  type: string;
  typeLabel: string;
}

export interface TutorialDate {
  date: string;
  time_start: string;
  time_end: string;
  location?: string;
  venue_street?: string;
  venue_barangay?: string;
  venue_municipality?: string;
  venue_meeting_place?: string;
  lat?: string;
  lng?: string;
}

export interface Artisan {
  id: number;
  name: string;
  email: string;
  business_name: string | null;
  craft_type: string | null;
  location: string | null;
  bio: string | null;
  profile_picture: string | null;
  verification_status: 'pending' | 'approved' | 'rejected' | 'suspended';
  phone: string | null;
  // verification artifacts (face/OCR feature)
  selfie_path?: string | null;
  face_matched?: boolean | null;
  face_confidence?: number | null;
  registration_notes?: string | null;
  id_number?: string | null;
  dob?: string | null;
  id_document_path?: string | null;
  id_document_back_path?: string | null;
  proof_of_craft_path?: string | null;
  product_sample_1_path?: string | null;
  product_sample_2_path?: string | null;
}

export interface Order {
  id: number;
  customer_id: number;
  total_amount: number;
  status: string;
  payment_method: string;
  payment_receipt: string | null;
  payment_reference: string | null;
  shipping_address: string | null;
  notes: string | null;
  created_at: string;
}

export interface OrderItem {
  id: number;
  order_id: number;
  product_id: number;
  artisan_id: number;
  product_name: string;
  purchase_type: 'product' | 'workshop' | 'bundle';
  attendee_name: string | null;
  selected_session: TutorialDate | null;
  ticket_code: string | null;
  quantity: number;
  price: number;
  status: string;
  review_rating: number | null;
  review_comment: string | null;
  reviewed_at: string | null;
  selected_variant: string | null;
  courier_name?: string | null;
  tracking_number?: string | null;
}

export interface CartItem {
  id: number;
  customer_id: number;
  product_id: number;
  purchase_type: 'product' | 'workshop' | 'bundle';
  attendee_name: string | null;
  selected_session: TutorialDate | null;
  quantity: number;
  selected_variant: string | null;
}

export interface Notification {
  id: number;
  user_id: number;
  user_role: string;
  type: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

export interface ChatMessage {
  id: number;
  conversation_id: number;
  sender_role: 'customer' | 'artisan';
  message: string;
  read_at: string | null;
  created_at: string;
}

export interface ActivityLog {
  id: number;
  user_id: number | null;
  user_role: string;
  user_name: string;
  action: string;
  description: string;
  created_at: string;
}

export type ShipmentStatus = 'created' | 'dropped_off' | 'in_transit' | 'delivered' | 'cancelled';

export interface Shipment {
  id: number;
  order_item_id: number;
  order_id: number;
  artisan_id: number;
  customer_id: number;
  sender_name: string;
  sender_phone: string;
  sender_address: string;
  recipient_name: string;
  recipient_phone: string;
  recipient_address: string;
  items_summary: string;
  weight_kg: number;
  length_cm: number | null;
  width_cm: number | null;
  height_cm: number | null;
  declared_value: number;
  notes: string | null;
  courier_name: string;
  tracking_number: string;
  status: ShipmentStatus;
  status_history: Array<{ status: string; at: string; by: string }>;
  created_at: string;
  updated_at: string;
}
