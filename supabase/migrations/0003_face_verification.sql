-- ============================================================================
-- 0003: Face verification & OCR support
--   - reuses the existing face_embeddings table (0001) for 128-d encodings
--   - adds face_verification_logs: audit trail of every face match attempt
--     (who, when, distance, outcome) for admin review.
-- ============================================================================

-- housekeeping: drop the redundant table accidentally introduced by an earlier
-- draft of this migration (superseded by face_embeddings from 0001)
drop table if exists artisan_embeddings;

-- captured selfie stored alongside the ID documents for admin review
alter table artisans add column if not exists selfie_path text;
-- automated face-verification outcome recorded at registration time
alter table artisans add column if not exists face_matched boolean;
alter table artisans add column if not exists face_confidence double precision;
-- warnings surfaced by OCR/face/storage services for the admin reviewer
alter table artisans add column if not exists registration_notes text;

create table if not exists face_verification_logs (
  id            bigserial primary key,
  email         text,                    -- applicant email at attempt time
  artisan_id    bigint references artisans(id),  -- set when matched against an existing artisan
  result        text not null,           -- 'match' | 'no_match' | 'duplicate' | 'error'
  distance      double precision,
  confidence    double precision,
  detail        jsonb,                   -- service response / error info
  created_at    timestamptz not null default now()
);

create index if not exists idx_face_logs_email on face_verification_logs(email);
create index if not exists idx_face_logs_created on face_verification_logs(created_at);
