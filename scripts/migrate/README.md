# MariaDB → Supabase Postgres data migration

One-time importer. Streams every table from the legacy MariaDB database,
transforms types, and inserts into Postgres **preserving primary keys** so all
URLs, FKs, and cross-references (chat, notifications, reports) stay valid.

## Prerequisites

1. Apply the schema first: `psql $DATABASE_URL -f supabase/migrations/0001_schema.sql`
2. Legacy MariaDB reachable (XAMPP MySQL or a dump loaded locally) and `DATABASE_URL` exported.

## Install & run

```bash
cd scripts/migrate
npm install          # installs mysql2, postgres, dotenv
cp .env.example .env # fill in legacy MySQL creds + target DATABASE_URL
node import.mjs
```

The importer is idempotent per run: it truncates the Postgres tables it owns,
then inserts in FK-safe order (users → artisans → categories → products →
cart/orders → chat → notifications/logs). Legacy `$2y` bcrypt hashes are copied
verbatim (bcryptjs verifies them at login; no user password resets needed).
`datetime` → `timestamptz`, enum → text + CHECK, JSON-in-text → jsonb.

## Files

- `import.mjs` — the importer (streaming, batched inserts)
- `.env.example` — connection settings template (no secrets committed)
