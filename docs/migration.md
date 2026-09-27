# Migration & Architecture

## Stack
- **Next.js 15 App Router** (`web/`) — pages + route handlers, custom JWT cookie auth (jose)
- **Supabase Postgres** (`supabase/migrations/0001_schema.sql`) — full schema from the MariaDB dump: identity PKs preserved, enums → text+CHECK, JSON-in-text → jsonb, FKs/indexes/RLS/updated_at triggers added
- **face-api/** — FastAPI wrapper around legacy `scripts/face_verify.py` (`/verify`, `/check-duplicate`)
- **scripts/migrate/** — streaming MariaDB→Postgres importer, PK-preserving, `$2y` bcrypt hashes kept verbatim

## Dual data layer
`web/src/lib/db.ts` picks a backend at runtime:
- `DATABASE_URL` set → Postgres via `postgres` driver (production/Supabase)
- unset → **in-memory demo store** seeded from `DATABASE/online_marketplace.sql` (dev/preview with zero external services)

Route handlers are written once against the shared `db.*` surface.

## Auth mapping (PHP session → JWT cookie)
Legacy session keys `id, name, role, isLoggedIn` map 1:1 to the JWT payload.
Guards live in `web/src/middleware.ts` for `/customer/*`, `/artisan/*`, `/admin/*`.
Passwords: bcryptjs verifies legacy `$2y$` hashes (normalized to `$2b$` in-memory) —
**existing users log in with their old passwords**.

## Preserved business rules
- Tutorial bookings force GCash (checkout validation + server-side rule)
- GCash orders sit in `awaiting_payment` until admin verifies (mock flow auto-pays with SIM- reference)
- Artisans are notified on COD orders immediately, on GCash only after verification
- Workshop order items get ticket codes; NFC tags map to `/verify/[tagId]`
- OTP registration: 6-digit, 10-minute expiry, stored in `pending_registrations` (was PHP session)

## Configuration (web/.env.example)
`DATABASE_URL`, `JWT_SECRET`, `FACE_API_URL`, `OCR_API_KEY`, `PAYMENTS_MODE`, `PAYMONGO_SECRET_KEY`, `RESEND_API_KEY`, `OTP_FROM_EMAIL`, `NEXT_PUBLIC_SITE_URL`

## Costs
All code free/open-source (MIT/Apache/BSD). Free-tier caveats and the zero-cost
Oracle Always Free production path are documented in the approved plan — dev/demo
runs fully free on this dual-layer setup.

## Remaining phases (documented in ROUTE_MAP.md phase tags)
- P5b: artisan experiences calendar, bookings, reviews, tutorial attendees
- P6b: remaining admin sections (customers, experiences, bookings, reports, categories, homepage, reviews, NFC admin, analytics, announcements, settings, profile)
- File uploads: Supabase Storage buckets + path rewrite (schema columns ready)
- PayMongo live mode behind `PAYMENTS_MODE=paymongo`
