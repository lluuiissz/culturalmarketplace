# Cultural Marketplace

Modern replacement for the legacy CodeIgniter marketplace: **Next.js 15 (App Router) + Supabase (Postgres, Storage)** with sidecar microservices for face verification and image moderation.

> The legacy PHP/CodeIgniter app is intentionally **not** part of this repository.

## Layout

```
web/       Next.js app (all product code)
supabase/  Postgres migrations + seed (apply in numeric order)
face-api/  Face verification microservice (FastAPI, OpenCV YuNet + SFace)
docs/      Migration notes and route map
scripts/   Legacy MariaDB -> Postgres data importer
```

## Quick start (local dev)

1. **Env** — copy `web/.env.example` to `web/.env.local` and fill in:
   - `DATABASE_URL` — Supabase/Postgres connection string (leave empty for an in-memory demo store)
   - `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` — enables Storage uploads
   - `JWT_SECRET` — any long random string
   - Optional: `RESEND_API_KEY`, `SMTP_*`, `FACE_API_URL`, `OCR_API_KEY`, `PAYMONGO_SECRET_KEY`, `IMAGE_SIDECAR_URL`
2. **Install** — from `web/`: `npm install`
3. **Database** — apply `supabase/migrations/*.sql` in numeric order, then `supabase/seed.sql`
4. **Image sidecar** (moderation) — from `web/`: `node scripts/clip-sidecar.mjs` (port 8091; models download once into `web/.transformers-cache`)
5. **Run** — from `web/`: `npm run dev` → http://localhost:3100

Demo accounts (seeded): `customer@demo.local` · `artisan@demo.local` · `admin@demo.local` — password `demo1234`.

## Feature map

- **Storefront** — browse with category/price filters, product pages with galleries, cart, checkout (customer info gate), PayMongo GCash payment flow, order tracking.
- **Artisan portal** — products (media uploads with moderation pipeline: size/duplicate/NSFW checks + advisory craft score), variations & stock, J&T-style parcel booking with printable waybills, workshop/experience listings + attendee check-in, reviews, statistics.
- **Admin console** — analytics dashboard (demographics, trends), people management, categories, homepage editor, image-moderation queue, reports, NFC tag registry, orders/payments/shipments oversight, activity logs.
- **Trust & safety** — account verification (OCR + face match sidecar), product image moderation with admin approval queue, report handling.
- **NFC authenticity tags** — Web NFC write-to-card flow (artisan or admin), server-generated tag IDs, public `/verify/<tagId>` page.

## Deploying to Vercel

- `web/` is the deployable unit; set the environment variables above in the Vercel project.
- Choose the **Singapore (sin1)** region to match the Supabase database and keep query latency ~10ms.
- The image-moderation sidecar must run somewhere reachable (Railway/Fly/VPS) and `IMAGE_SIDECAR_URL` must point to it; without it, uploads fall back to manual review (fail-open).
- The face-api sidecar follows the same pattern (`FACE_API_URL`).

## Docs

- `docs/migration.md` — CodeIgniter → Next.js migration notes
- `docs/ROUTE_MAP.md` — legacy route → new route mapping
- `scripts/migrate/README.md` — one-time legacy data import
