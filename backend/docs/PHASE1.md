# Phase 1 — Tenant DB foundation

## What was added

- `TenantDomain` table + `TenantDomainKind` enum
- `User.adminId` required, FK to `Admin`, `@@unique([adminId, email])`
- `Admin.slug` required + unique
- Local dev hosts: `localhost`, `127.0.0.1` → default/demo admin

## Run on your machine (port 5433)

Ensure `DATABASE_URL` in `backend/.env` matches your Postgres password, then:

```bash
cd backend
npm run db:tenant-foundation
npx prisma generate
npm run build
```

If you see `password authentication failed`, fix credentials or use Docker:

```bash
# from repo root
docker compose up -d
# .env: postgresql://postgres:postgres@localhost:5433/truebeauty
npm run db:tenant-foundation
```

Optional: `node seed-admin.js` before migration if no admin exists.

## Verify

```bash
node list-users-tenants.js
```

- No user with `adminId=(null)`
- `tenant_domain` has rows for localhost

## Note

Runtime tenant resolution (Host header) is **Phase 2**. Phase 1 keeps `X-Tenant-Slug` behavior; auth now uses per-tenant email lookups.
