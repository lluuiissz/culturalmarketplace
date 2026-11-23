create index if not exists idx_orders_created_at_desc
  on public.orders (created_at desc);

create index if not exists idx_users_role_created_at
  on public.users (role, created_at);

create index if not exists idx_artisans_created_at
  on public.artisans (created_at);

create index if not exists idx_artisans_verification_status
  on public.artisans (verification_status);

create index if not exists idx_reports_status
  on public.reports (status);
