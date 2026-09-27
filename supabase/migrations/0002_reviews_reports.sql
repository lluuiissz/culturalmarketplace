-- Migration 0002 — additions for reviews moderation, reports, and analytics.
alter table order_items
  add column if not exists review_visible boolean not null default true;

alter table reports
  add column if not exists reporter_name text,
  add column if not exists reported_name text;

-- Backfill reporter/reportee names for existing rows (best-effort join).
update reports r
set reporter_name = u.name
from users u
where u.id = r.reporter_id and r.reporter_name is null;
