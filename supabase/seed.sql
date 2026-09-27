-- Seed data for Supabase/Postgres (mirrors web/src/lib/seed.ts, transcribed from
-- DATABASE/online_marketplace.sql). Passwords are the legacy bcrypt hashes —
-- login passwords are unchanged from the PHP system.

insert into users (id, name, email, password, role, location, phone, is_verified) values
  (1, 'mark john', 'mark@gmail.com', '$2y$10$8TtgE/81aBN8nbGeCsTtte1FGWhsAVF6WFTxnAiDQvMUFDPub0tta', 'customer', 'bunawan, agusan del sur', '', true),
  (6, 'Norie Suganob', 'noriesuganob17@gmail.com', '$2y$10$IThaAWUH0HFR2EfCidNtvu.MGlvZSFa5TnYcT3/w1fPiHf1moZYTO', 'customer', 'Bunawan, Agusan del Sur', '09979904061', true),
  (8, 'System Administrator', 'admin@marketplace.com', '$2y$10$la0zvTEQECeGtE4BmVe0Rud.zJ5baUFstzQI3eFE5g7riuqDJbsZG', 'admin', null, null, false),
  -- artisan user row (mirrors artisans.id 10 so unified login + notifications work)
  (10, 'John Mark Belar', 'artisan@demo.local', '$2a$10$ZqHsE4idNCRBTmUSW4UOee1OSble87n9j.jBOVWFGoL7ck.wMlffW', 'artisan', 'Bunawan, Agusan del Sur', '09078813630', true),
  -- demo accounts (password: demo1234)
  (9001, 'mark john (demo)', 'customer@demo.local', '$2a$10$ZqHsE4idNCRBTmUSW4UOee1OSble87n9j.jBOVWFGoL7ck.wMlffW', 'customer', 'Bunawan, Agusan del Sur', '09000000000', true),
  (9002, 'System Administrator (demo)', 'admin@demo.local', '$2a$10$ZqHsE4idNCRBTmUSW4UOee1OSble87n9j.jBOVWFGoL7ck.wMlffW', 'admin', null, null, true)
on conflict (email) do nothing;

insert into artisans (id, name, email, password, location, business_name, craft_type, dob, id_number, verification_status, bio, phone) values
  (10, 'John Mark Belar', 'belarjohnmark@gmail.com', '$2y$10$WTjCe4wDxRU8vpzZwbKxDukonvNxyEuIG44xSUt.NEH2ELqY8pS46', 'Purok 8, Simulao, Bunawan, Agusan del Sur', 'bcsjdbdb', 'Weaving', '2002-01-29', '5823-9526-5138-1425', 'approved', 'Local weaver from Agusan del Sur preserving traditional techniques.', '09078813630')
on conflict (email) do nothing;

-- Demo artisan profile (mirrors users.id 10 / artisan@demo.local)
insert into artisans (id, name, email, password, location, business_name, craft_type, verification_status, bio, phone) values
  (9010, 'John Mark Belar (demo)', 'artisan@demo.local', '$2a$10$ZqHsE4idNCRBTmUSW4UOee1OSble87n9j.jBOVWFGoL7ck.wMlffW', 'Bunawan, Agusan del Sur', 'Demo Weaving Studio', 'Weaving', 'approved', 'Demo artisan account for preview exploration (password: demo1234).', '09078813630')
on conflict (email) do nothing;

insert into categories (id, name, type) values
  (1, 'Weaving', 'product'), (2, 'Basketry', 'product'), (3, 'Leatherwork', 'product'),
  (4, 'Embroidery', 'product'), (5, 'Bamboo Crafts', 'product'), (6, 'Uway Crafts', 'product'),
  (7, 'Bags', 'product'), (8, 'Other', 'product'), (9, 'Weaving Workshop', 'experience')
on conflict do nothing;

insert into products (id, artisan_id, name, description, price, stock_quantity, category, status, nfc_tag_id, has_tutorial, tutorial_title, tutorial_description, tutorial_price, tutorial_capacity, tutorial_dates, tutorial_fee_type, tutorial_learnings, materials_used, has_variations, variation_pricing, variations_data) values
  (1, 10, 'Hand Made Logo', 'Handwoven piece showcasing traditional Agusan del Sur patterns.', 150, 5, 'Weaving', 'active', null, false, null, null, null, null, null, null, null, 'Abaca fiber, natural dyes', false, false, null),
  (3, 10, 'Tarpaulin Print', 'Custom printed tarpaulin for events and markets.', 99, 9, 'Other', 'active', null, false, null, null, null, null, null, null, null, null, false, false, null),
  (17, 10, 'Basket', 'Handmade uway basket with cultural patterns. Includes NFC authenticity tag and bookable weaving tutorial.', 500, 500, 'Uway Crafts', 'active', '35:F3:D4:33:79', true, 'Learn Making Basket', 'Hands-on weaving session covering material preparation, traditional techniques, cultural meaning, and finishing.', 199.87, 200,
    '[{"date":"2026-09-30","time_start":"13:14","time_end":"14:14","location":"P3, San Teodoro","lat":"8.1713902","lng":"125.9984985"},{"date":"2026-09-23","time_start":"22:14","time_end":"14:11","location":"Bunawan, Agusan del sur","lat":"8.1751677","lng":"125.9933733"}]',
    'paid', '["Material Preparation","Traditional Techniques","Cultural Meaning","Finished Product"]', 'Uway vine', true, true,
    '[{"name":"S","stock":79,"price":0,"type":"size","typeLabel":"Size"},{"name":"M","stock":77,"price":0,"type":"size","typeLabel":"Size"},{"name":"L","stock":78,"price":0,"type":"size","typeLabel":"Size"},{"name":"XL","stock":78,"price":0,"type":"size","typeLabel":"Size"},{"name":"Red","stock":78,"price":0,"type":"color","typeLabel":"Color"},{"name":"Black","stock":78,"price":0,"type":"color","typeLabel":"Color"},{"name":"A1","stock":78,"price":0,"type":"others","typeLabel":"Pattern"},{"name":"A2","stock":78,"price":0,"type":"others","typeLabel":"Pattern"}]'),
  (18, 10, 'Slipper (Handwoven)', 'Comfortable handwoven slippers.', 50, 19, 'Bags', 'active', null, false, null, null, null, null, null, null, null, 'Buri palm', false, false, null),
  (19, 10, 'Souvenir Keychain', 'Small woven souvenir keychains with per-variant pricing.', 200, 10, 'Bamboo Crafts', 'active', null, false, null, null, null, null, null, null, null, 'Bamboo', true, true,
    '[{"name":"S","stock":20,"price":20,"type":"size","typeLabel":"Price ₱20"},{"name":"L","stock":20,"price":49.93,"type":"size","typeLabel":"Price ₱49.93"},{"name":"Pink","stock":30,"price":50,"type":"color","typeLabel":"Price ₱50"}]')
on conflict do nothing;

insert into orders (id, customer_id, total_amount, status, payment_method, shipping_address, payment_reference) values
  (40, 1, 20, 'paid', 'gcash', 'choy | 09078813630, P 8 Simulao, Bunawan Brook', 'SIM-1788703544204'),
  (41, 6, 60, 'pending', 'cash_on_delivery', 'Norie Suganob | 09979904061, Katmon, Poblacion, Bunawan', null),
  (42, 6, 100, 'paid', 'gcash', 'Norie Suganob | 09979904061, Katmon, Poblacion, Bunawan', 'SIM-1788881459560')
on conflict do nothing;

insert into order_items (id, order_id, product_id, artisan_id, product_name, purchase_type, quantity, price, status, selected_variant, selected_session, ticket_code) values
  (100, 40, 17, 10, 'Basket', 'product', 1, 20, 'paid', 'Size: M | Color: Black', null, null),
  (101, 41, 17, 10, 'Woven Wall Decor', 'product', 1, 60, 'pending', null, null, null),
  (102, 42, 17, 10, 'Basket (workshop booking)', 'workshop', 1, 100, 'paid', null, '{"date":"2026-09-30","time_start":"13:14","time_end":"14:14","location":"P3, San Teodoro"}', 'TKT-102')
on conflict do nothing;

insert into notifications (user_id, user_role, type, message, is_read) values
  (6, 'customer', 'order_shipped', 'Good news! Your order for Woven Wall Decor has shipped.', false),
  (10, 'artisan', 'new_order', 'New order #41 from Norie Suganob! Items: Woven Wall Decor x1. Payment: Cash on Delivery.', false)
on conflict do nothing;

-- Reviews seed (visible by default) + a pending report + customer addresses
update order_items set review_rating = 5, review_comment = 'Beautiful basket, exactly like the photos. Salamat!', reviewed_at = '2026-09-07T10:00:00Z' where id = 100;
update order_items set review_rating = 4, review_comment = 'Great workshop, learned a lot about uway weaving.', reviewed_at = '2026-09-09T08:30:00Z' where id = 102;

insert into reports (id, reporter_id, reporter_name, reported_type, reported_id, reported_name, reason, status)
  values (1, 6, 'Norie Suganob', 'product', 3, 'Tarpaulin Print', 'Inappropriate Content\n\nDetails: Listing image does not show the actual product.', 'pending')
on conflict do nothing;

insert into customer_addresses (id, customer_id, label, full_name, phone, address, landmark, is_default) values
  (1, 1, 'Home', 'mark john', '09078813630', 'P 8 Simulao, Bunawan Brook, Bunawan, Agusan del Sur 8506', 'Near the chapel', true),
  (2, 6, 'Home', 'Norie Suganob', '09979904061', 'Katmon, Poblacion, Bunawan, Agusan del Sur 8506', 'Infront of Catholic church', true)
on conflict do nothing;

insert into settings (key, value) values
  ('platform_name', 'Cultural Marketplace'),
  ('homepage_banner_title', 'Discover Authentic Indigenous Crafts & Experiences'),
  ('homepage_banner_subtitle', 'Supporting Agusan del Sur Artisans and Preserving Cultural Heritage'),
  ('commission_rate', '5'),
  ('contact_email', 'admin@culturalmarketplace.com')
on conflict (key) do nothing;

-- ----------------------------------------------------------------------------
-- Re-sync every identity sequence past the seeded ids. Without this, the next
-- auto-generated insert reuses id 1 and collides with the rows above.
-- ----------------------------------------------------------------------------
select setval(pg_get_serial_sequence('users', 'id'), (select coalesce(max(id), 0) from users));
select setval(pg_get_serial_sequence('artisans', 'id'), (select coalesce(max(id), 0) from artisans));
select setval(pg_get_serial_sequence('products', 'id'), (select coalesce(max(id), 0) from products));
select setval(pg_get_serial_sequence('orders', 'id'), (select coalesce(max(id), 0) from orders));
select setval(pg_get_serial_sequence('order_items', 'id'), (select coalesce(max(id), 0) from order_items));
select setval(pg_get_serial_sequence('categories', 'id'), (select coalesce(max(id), 0) from categories));
select setval(pg_get_serial_sequence('notifications', 'id'), (select coalesce(max(id), 0) from notifications));
select setval(pg_get_serial_sequence('activity_logs', 'id'), (select coalesce(max(id), 0) from activity_logs));
select setval(pg_get_serial_sequence('reports', 'id'), (select coalesce(max(id), 0) from reports));
select setval(pg_get_serial_sequence('customer_addresses', 'id'), (select coalesce(max(id), 0) from customer_addresses));
select setval(pg_get_serial_sequence('admins', 'id'), (select coalesce(max(id), 0) from admins));
select setval(pg_get_serial_sequence('customers', 'id'), (select coalesce(max(id), 0) from customers));
select setval(pg_get_serial_sequence('cart_items', 'id'), (select coalesce(max(id), 0) from cart_items));
select setval(pg_get_serial_sequence('chat_conversations', 'id'), (select coalesce(max(id), 0) from chat_conversations));
select setval(pg_get_serial_sequence('chat_messages', 'id'), (select coalesce(max(id), 0) from chat_messages));
select setval(pg_get_serial_sequence('face_embeddings', 'id'), (select coalesce(max(id), 0) from face_embeddings));
select setval(pg_get_serial_sequence('face_verification_logs', 'id'), (select coalesce(max(id), 0) from face_verification_logs));
